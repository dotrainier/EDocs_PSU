import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { advanceRouting } from '@/lib/routing';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await getAccessTokenPayload(request);
    const { taskId } = await params;
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    // Only office staff can act on clearances
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned' }, { status: 403 });
    }

    const body = await request.json();
    const { action, remarks } = body; // action = 'cleared' or 'rejected'

    if (!['cleared', 'rejected'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // 1. Get the clearance task
    const taskResult = await db
      .select()
      .from(clearance_tasks)
      .where(eq(clearance_tasks.id, taskId))
      .limit(1);

    const task = taskResult[0];
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // 2. Verify task belongs to this office
    if (task.office_id !== Number(session.officeId)) {
      return NextResponse.json({ message: 'Forbidden - not your office' }, { status: 403 });
    }

    // 3. Get the request to access documentTypeId
    const requestResult = await db
      .select()
      .from(document_requests)
      .where(eq(document_requests.id, task.request_id))
      .limit(1);

    const docRequest = requestResult[0];
    if (!docRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // 4. Update clearance task
    const newStatus = action === 'cleared' ? 'Cleared' : 'Rejected';

    await db
      .update(clearance_tasks)
      .set({
        status: newStatus,
        remarks: remarks || null,
        cleared_by: session.userId,
        cleared_at: new Date(),
      })
      .where(eq(clearance_tasks.id, taskId));

    // 5. Log audit
    await logAudit({
      userId: session.userId,
      action: action === 'cleared' ? 'CLEARANCE_CLEARED' : 'CLEARANCE_REJECTED',
      details: {
        taskId: taskId,
        requestId: task.request_id,
        officeId: session.officeId,
        remarks,
      },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    // 6. If CLEARED, advance routing
    if (action === 'cleared') {
      await advanceRouting(task.request_id, docRequest.document_type_id);
    }

    // 7. If REJECTED, update request status to 'Action Required'
    if (action === 'rejected') {
      await db
        .update(document_requests)
        .set({
          status: 'Action Required',
          updated_at: new Date(),
        })
        .where(eq(document_requests.id, task.request_id));
    }

    return NextResponse.json(
      {
        message: `Clearance ${action === 'cleared' ? 'approved' : 'rejected'} successfully`,
        task: newStatus,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('Clearance action error:', error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
