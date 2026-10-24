// src/app/api/portal/requests/[id]/resubmit/route.ts
//
// Takes a request out of Action Required (SRS §9.3 step 4): the student has
// addressed the rejecting office's remark and sends the request back for
// clearance. Every Rejected task restarts as Pending so the same office
// reviews it again; tasks other offices already Cleared are kept. Optional
// extras: a note to the office (posted to the request's message thread) and,
// for TOR, a replacement clearance form.
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  clearance_tasks,
  document_requests,
  document_types,
  office_staff,
  request_messages,
} from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notification';
import {
  uploadClearanceForm,
  CLEARANCE_FORM_MAX_BYTES,
  CLEARANCE_FORM_ALLOWED_TYPES,
} from '@/lib/cloudinary';

const resubmitSchema = z.object({
  note: z.string().trim().max(2000, 'Note is too long').optional(),
});

async function readResubmitBody(
  request: Request,
): Promise<{ raw: Record<string, unknown>; clearanceFormFile: File | null }> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const fileEntry = formData.get('clearanceForm');
    return {
      raw: { note: formData.get('note') || undefined },
      clearanceFormFile: fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null,
    };
  }

  const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return { raw, clearanceFormFile: null };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;

    const [req] = await db
      .select({
        id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        user_id: document_requests.user_id,
        status: document_requests.status,
        document_type_name: document_types.name,
        document_type_code: document_types.code,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (req.user_id !== session.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (req.status !== 'Action Required') {
      return NextResponse.json(
        { message: 'Only a request that needs action can be resubmitted' },
        { status: 409 },
      );
    }

    const { raw, clearanceFormFile } = await readResubmitBody(request);
    const parsed = resubmitSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    const note = parsed.data.note || null;

    const rejectedTasks = await db
      .select({ id: clearance_tasks.id, office_id: clearance_tasks.office_id })
      .from(clearance_tasks)
      .where(and(eq(clearance_tasks.request_id, req.id), eq(clearance_tasks.status, 'Rejected')));

    if (rejectedTasks.length === 0) {
      return NextResponse.json(
        { message: 'This request has no rejected clearance to resubmit' },
        { status: 409 },
      );
    }

    // Same rules as the original TOR submission — the server re-validates
    // even though the client already does.
    let clearanceFormPublicId: string | null = null;
    if (clearanceFormFile) {
      if (req.document_type_code !== 'TOR') {
        return NextResponse.json(
          { message: 'Only Transcript of Records requests take a clearance form.' },
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

    // The status condition on the request update makes a double-click or a
    // replayed call a no-op instead of resetting the tasks twice.
    const resubmitted = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(document_requests)
        .set({
          status: 'Pending',
          updated_at: new Date(),
          ...(clearanceFormPublicId ? { clearance_form_public_id: clearanceFormPublicId } : {}),
        })
        .where(
          and(eq(document_requests.id, req.id), eq(document_requests.status, 'Action Required')),
        )
        .returning({ id: document_requests.id });

      if (!updated) return false;

      await tx
        .update(clearance_tasks)
        .set({ status: 'Pending', remarks: null, cleared_by: null, cleared_at: null })
        .where(
          inArray(
            clearance_tasks.id,
            rejectedTasks.map((t) => t.id),
          ),
        );

      if (note) {
        await tx
          .insert(request_messages)
          .values({ request_id: req.id, sender_id: session.userId, body: note });
      }

      return true;
    });

    if (!resubmitted) {
      return NextResponse.json(
        { message: 'This request has already been resubmitted' },
        { status: 409 },
      );
    }

    const officeIds = [...new Set(rejectedTasks.map((t) => t.office_id))];

    await logAudit({
      userId: session.userId,
      action: 'REQUEST_RESUBMITTED',
      details: {
        requestId: req.id,
        trackingNumber: req.tracking_number,
        officeIds: officeIds.map(String),
        replacedClearanceForm: !!clearanceFormPublicId,
        note,
      },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    // Tell the staff of every office whose task restarted that it is back in
    // their queue. Fast DB writes, so awaited — same as the message routes.
    try {
      const staffRows = await db
        .select({ user_id: office_staff.user_id })
        .from(office_staff)
        .where(inArray(office_staff.office_id, officeIds));
      const uniqueStaffIds = Array.from(new Set(staffRows.map((r) => r.user_id)));

      const preview = note && note.length > 140 ? `${note.slice(0, 140)}…` : note;

      await Promise.all(
        uniqueStaffIds.map((staffId) =>
          createNotification({
            userId: staffId,
            title: `Resubmitted for clearance: ${req.tracking_number}`,
            message: preview
              ? `The student addressed the issue and resubmitted: “${preview}”`
              : `The student addressed the issue on this ${req.document_type_name} request and resubmitted it for clearance.`,
            type: 'clearance_requested',
            requestId: req.id,
          }),
        ),
      );
    } catch {
      // notification errors are non-critical — the resubmission already persisted
    }

    return NextResponse.json(
      { message: 'Request resubmitted for clearance', status: 'Pending' },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
