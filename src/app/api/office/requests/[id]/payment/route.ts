import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, clearance_tasks } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    // Same authorization boundary as the Accept/Reject clearance action.
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const { id } = await params;

    const requestResult = await db
      .select({ id: document_requests.id, payment_status: document_requests.payment_status })
      .from(document_requests)
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const docRequest = requestResult[0];
    if (!docRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // The acting office must have an active (Pending) clearance task on this
    // specific request — mirrors the ownership check in the clearance route.
    const taskResult = await db
      .select({ id: clearance_tasks.id })
      .from(clearance_tasks)
      .where(
        and(
          eq(clearance_tasks.request_id, docRequest.id),
          eq(clearance_tasks.office_id, Number(session.officeId)),
          eq(clearance_tasks.status, 'Pending'),
        ),
      )
      .limit(1);

    if (!taskResult[0]) {
      return NextResponse.json(
        { message: 'Your office does not have an active clearance task on this request' },
        { status: 403 },
      );
    }

    if (docRequest.payment_status === 'Paid') {
      return NextResponse.json({ message: 'Payment is already confirmed' }, { status: 409 });
    }

    await db
      .update(document_requests)
      .set({ payment_status: 'Paid', updated_at: new Date() })
      .where(eq(document_requests.id, docRequest.id));

    await logAudit({
      userId: session.userId,
      action: 'PAYMENT_CONFIRMED',
      details: { requestId: docRequest.id, officeId: session.officeId },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return NextResponse.json({ message: 'Payment marked as paid' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
