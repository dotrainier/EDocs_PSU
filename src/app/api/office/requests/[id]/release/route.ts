// src/app/api/office/requests/[id]/release/route.ts
//
// Closes the request lifecycle: Ready for Release -> Released. Internal
// staff action, not exposed to or reachable by students.
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const { id } = await params;

    const requestResult = await db
      .select({
        id: document_requests.id,
        status: document_requests.status,
        issuing_office_id: document_types.issuing_office_id,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const docRequest = requestResult[0];
    if (!docRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // By this point clearance is already Cleared, not Pending, so the
    // Pending-task check used for Clear/Reject/Mark as Paid doesn't apply —
    // same authorization boundary as Generate Document: staff belonging to
    // this document type's issuing office.
    if (docRequest.issuing_office_id !== Number(session.officeId)) {
      return NextResponse.json(
        { message: 'Your office does not issue this document type' },
        { status: 403 },
      );
    }

    if (docRequest.status !== 'Ready for Release') {
      return NextResponse.json(
        { message: 'This request is not ready to be released' },
        { status: 409 },
      );
    }

    await db
      .update(document_requests)
      .set({ status: 'Released', updated_at: new Date() })
      .where(eq(document_requests.id, docRequest.id));

    await logAudit({
      userId: session.userId,
      action: 'REQUEST_RELEASED',
      details: { requestId: docRequest.id, officeId: session.officeId },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return NextResponse.json({ message: 'Request marked as released' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
