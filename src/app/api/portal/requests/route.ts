import { NextResponse } from 'next/server';
import { eq, desc, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { generateTrackingNumber, calculateSlaDeadline } from '@/lib/generate';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notification';
import { sendMailToMultiple } from '@/lib/lib-mailer';
import { NewRequestStaffEmail } from '@/email-templates/NewRequestStaff';
import { render } from 'react-email';
import { uploadClearanceForm } from '@/lib/cloudinary';

import {
  document_requests,
  document_types,
  clearance_requirements,
  clearance_tasks,
  office_staff,
  users,
} from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

const createRequestSchema = z.object({
  documentTypeId: z.coerce.number().int().positive(),
  purpose: z.string().min(1).max(255),
  copies: z.coerce.number().int().min(1).max(10),
  additionalNotes: z.string().max(1000).optional(),
  schoolYear: z.string().max(20).optional(),
  semester: z.string().max(30).optional(),
});

// TOR requests are cleared by the Registrar reviewing a student-uploaded
// clearance form (see clearance_requirements seed) rather than by routing
// through separate offices — so a file is required at submission time.
const CLEARANCE_FORM_MAX_BYTES = 5 * 1024 * 1024;
const CLEARANCE_FORM_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

async function readRequestBody(
  request: Request,
): Promise<{ raw: Record<string, unknown>; clearanceFormFile: File | null }> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const raw: Record<string, unknown> = {
      documentTypeId: formData.get('documentTypeId'),
      purpose: formData.get('purpose'),
      copies: formData.get('copies'),
      additionalNotes: formData.get('additionalNotes') || undefined,
      schoolYear: formData.get('schoolYear') || undefined,
      semester: formData.get('semester') || undefined,
    };
    const fileEntry = formData.get('clearanceForm');
    const clearanceFormFile = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
    return { raw, clearanceFormFile };
  }

  const raw = (await request.json()) as Record<string, unknown>;
  return { raw, clearanceFormFile: null };
}

async function createClearanceTasks(requestId: string, documentTypeId: number): Promise<void> {
  const requirements = await db
    .select()
    .from(clearance_requirements)
    .where(eq(clearance_requirements.document_type_id, documentTypeId))
    .orderBy(clearance_requirements.sequence_order);

  if (requirements.length === 0) return;

  const parallelReqs = requirements.filter((r) => r.sequence_order === null);
  const sequentialReqs = requirements.filter((r) => r.sequence_order !== null);

  if (parallelReqs.length > 0) {
    await db.insert(clearance_tasks).values(
      parallelReqs.map((r) => ({
        request_id: requestId,
        office_id: r.office_id,
        status: 'Pending',
        sequence_order: null,
      })),
    );
  }

  const firstSequential = sequentialReqs.find((r) => r.sequence_order === 1);
  if (firstSequential && parallelReqs.length === 0) {
    await db.insert(clearance_tasks).values({
      request_id: requestId,
      office_id: firstSequential.office_id,
      status: 'Pending',
      sequence_order: 1,
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const frontUserRoles = ['Student'];
    if (!frontUserRoles.includes(session.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { raw, clearanceFormFile } = await readRequestBody(request);
    const parsed = createRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const { documentTypeId, purpose, copies, additionalNotes, schoolYear, semester } = parsed.data;

    const docTypeResult = await db
      .select()
      .from(document_types)
      .where(eq(document_types.id, documentTypeId))
      .limit(1);

    const docType = docTypeResult[0];
    if (!docType || !docType.is_active) {
      return NextResponse.json({ message: 'Document type not found or inactive' }, { status: 404 });
    }

    if (docType.eligible_student_types === 'active_only') {
      const userResult = await db
        .select({ student_type: users.student_type })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      const studentType = userResult[0]?.student_type ?? null;

      if (studentType !== 'active') {
        return NextResponse.json(
          { message: `${docType.name} is only available to currently enrolled students.` },
          { status: 403 },
        );
      }
    }

    // Validate period fields driven by period_type on the document type record
    if (docType.period_type === 'semester_past_only') {
      if (!schoolYear || !semester) {
        return NextResponse.json(
          { message: 'School year and semester are required for this document type' },
          { status: 400 },
        );
      }
    }

    // TOR requires an uploaded clearance form — validate server-side even
    // though the client already enforces this, since the client can't be trusted.
    let clearanceFormPublicId: string | null = null;
    if (docType.code === 'TOR') {
      if (!clearanceFormFile) {
        return NextResponse.json(
          { message: 'A clearance form upload is required for Transcript of Records requests.' },
          { status: 400 },
        );
      }
      if (!CLEARANCE_FORM_ALLOWED_TYPES.includes(clearanceFormFile.type)) {
        return NextResponse.json(
          { message: 'Clearance form must be a PDF, JPG, or PNG file.' },
          { status: 400 },
        );
      }
      if (clearanceFormFile.size > CLEARANCE_FORM_MAX_BYTES) {
        return NextResponse.json(
          { message: 'Clearance form must be 5MB or smaller.' },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await clearanceFormFile.arrayBuffer());
      clearanceFormPublicId = await uploadClearanceForm(buffer);
    }

    const trackingNumber = await generateTrackingNumber();
    const slaDeadline = calculateSlaDeadline(docType.sla_working_days);

    const hasSemester = docType.period_type === 'semester_past_only';

    const inserted = await db
      .insert(document_requests)
      .values({
        tracking_number: trackingNumber,
        user_id: session.userId,
        document_type_id: documentTypeId,
        purpose,
        copies,
        additional_notes: additionalNotes ?? null,
        status: 'Pending',
        fee_amount: docType.fee_amount,
        payment_status: docType.fee_amount && docType.fee_amount !== '0.00' ? 'Unpaid' : 'Paid',
        sla_due_at: slaDeadline,
        school_year: hasSemester ? (schoolYear ?? null) : null,
        semester: hasSemester ? (semester ?? null) : null,
        clearance_form_public_id: clearanceFormPublicId,
      })
      .returning({ id: document_requests.id });

    const requestId = inserted[0].id;

    if (docType.requires_clearance) {
      await createClearanceTasks(requestId, documentTypeId);
    }

    await logAudit({
      userId: session.userId,
      action: 'REQUEST_SUBMITTED',
      details: { requestId, trackingNumber, documentTypeId, purpose },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    // Fire-and-forget: notifications don't block the response
    void (async () => {
      try {
        // Notify portal user
        const userNotif = {
          title: `Request submitted: ${docType.name}`,
          message: `Your request has been submitted successfully. Tracking number: ${trackingNumber}.`,
        };
        await createNotification({
          userId: session.userId,
          title: userNotif.title,
          message: userNotif.message,
          type: 'document_submitted',
          requestId,
        });
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: requestId,
            userId: session.userId,
            status: 'Pending',
            message: userNotif.message,
          }),
        }).catch(() => {});

        // Notify all staff in involved offices (issuing + clearance)
        const involvedOfficeIds = new Set<number>([docType.issuing_office_id]);
        if (docType.requires_clearance) {
          const tasks = await db
            .select({ office_id: clearance_tasks.office_id })
            .from(clearance_tasks)
            .where(eq(clearance_tasks.request_id, requestId));
          tasks.forEach((t) => involvedOfficeIds.add(t.office_id));
        }

        const staffRows = await db
          .select({ user_id: office_staff.user_id, email: users.email })
          .from(office_staff)
          .innerJoin(users, eq(office_staff.user_id, users.id))
          .where(inArray(office_staff.office_id, [...involvedOfficeIds]));

        // A staff member can legitimately be linked to more than one involved
        // office (e.g. a multi-office document) — dedupe by user_id so each
        // person is notified/emailed exactly once, regardless of how many
        // office rows matched.
        const uniqueStaffRows = Array.from(
          new Map(staffRows.map((r) => [r.user_id, r])).values(),
        );

        const staffNotif = {
          title: `New ${docType.name} request`,
          message: `A new ${docType.name} request has been submitted. Tracking: ${trackingNumber}.`,
        };

        const staffEmails = uniqueStaffRows.map((r) => r.email);
        if (staffEmails.length > 0) {
          const emailHtml = await render(
            NewRequestStaffEmail({
              documentType: docType.name,
              trackingNumber,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/office/requests`,
            }),
          );
          await sendMailToMultiple({
            to: staffEmails,
            subject: `New Document Request: ${docType.name} [${trackingNumber}]`,
            html: emailHtml,
          }).catch(() => {});
        }

        await Promise.all(
          uniqueStaffRows.map(async ({ user_id }) => {
            await createNotification({
              userId: user_id,
              title: staffNotif.title,
              message: staffNotif.message,
              type: 'document_submitted',
              requestId,
            });
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentId: requestId,
                userId: user_id,
                status: 'Pending',
                message: staffNotif.message,
              }),
            }).catch(() => {});
          }),
        );
      } catch {
        // notification errors are non-critical
      }
    })();

    return NextResponse.json(
      {
        message: 'Request submitted successfully',
        trackingNumber,
        feeAmount: docType.fee_amount ?? '0.00',
        paymentStatus: docType.fee_amount && docType.fee_amount !== '0.00' ? 'Unpaid' : 'Paid',
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getAccessTokenPayload(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
  }

  const requests = await db
    .select({
      tracking_number: document_requests.tracking_number,
      document_type: document_types.name,
      created_at: document_requests.created_at,
      updated_at: document_requests.updated_at,
      purpose: document_requests.purpose,
      status: document_requests.status,
    })
    .from(document_requests)
    .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
    .where(eq(document_requests.user_id, session.userId))
    .orderBy(desc(document_requests.updated_at));

  return NextResponse.json(
    {
      requests: requests.map((r) => ({
        ...r,
        has_download: true,
      })),
    },
    { status: 200 },
  );
}
