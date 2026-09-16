import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests, users, offices, document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { advanceRouting } from '@/lib/routing';
import { logAudit } from '@/lib/audit';
import { sendMail } from '@/lib/lib-mailer';
import { ClearanceApprovedEmail } from '@/email-templates/ClearanceApproved';
import { render } from 'react-email';
import { createNotification } from '@/lib/notification';
import { composeFullName } from '@/lib/user-name';

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

    // 2b. A task can only be cleared/rejected once — same pattern as the
    // status guards on Generate Document and Mark as Released. Without this,
    // a replayed or direct call against an already-resolved task can
    // re-trigger advanceRouting() or flip a completed request back to
    // Action Required.
    if (task.status !== 'Pending') {
      return NextResponse.json(
        { message: 'This clearance task has already been resolved' },
        { status: 409 },
      );
    }

    // 3. Get the request to access documentTypeId and payment status
    const requestResult = await db
      .select({
        user_id: document_requests.user_id,
        document_type_id: document_requests.document_type_id,
        tracking_number: document_requests.tracking_number,
        document_name: document_types.name,
        payment_status: document_requests.payment_status,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(
        and(
          eq(document_requests.id, task.request_id),
          eq(document_types.id, document_requests.document_type_id),
        ),
      )
      .limit(1);

    const docRequest = requestResult[0];
    if (!docRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // 4. Block clearing if payment has not been confirmed
    if (action === 'cleared' && docRequest.payment_status !== 'Paid') {
      return NextResponse.json(
        { message: 'Payment has not been confirmed. Request cannot be cleared until payment is verified.' },
        { status: 422 },
      );
    }

    // 5. Update clearance task
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

    // 8. Log audit
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

    // Fire-and-forget: notifications + email don't block the response
    void (async () => {
      try {
        const [requestor, officeResult] = await Promise.all([
          db
            .select({
              given_name: users.given_name,
              middle_name: users.middle_name,
              last_name: users.last_name,
              name_suffix: users.name_suffix,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, docRequest.user_id))
            .limit(1),
          db
            .select({ name: offices.name })
            .from(offices)
            .where(eq(offices.id, task.office_id))
            .limit(1),
        ]);

        if (!requestor[0]) return;
        const requestorName = composeFullName(requestor[0]);
        const officeName = officeResult[0]?.name || 'Office';

        const notif = {
          title: `Your ${docRequest.document_name} request has been ${newStatus.toLowerCase()} by ${officeName}`,
          message: `Your request for ${docRequest.document_name} has been ${newStatus.toLowerCase()} by ${officeName}.`,
        };

        await createNotification({
          userId: docRequest.user_id,
          title: notif.title,
          message: notif.message,
          type: newStatus === 'Cleared' ? 'clearance_cleared' : 'clearance_rejected',
          requestId: task.request_id,
          relatedId: task.id.toString(),
        });

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: task.request_id,
            userId: docRequest.user_id,
            status: newStatus,
            message: notif.message,
          }),
        }).catch(() => {});

        if (requestor[0].email) {
          const emailHtml = await render(
            ClearanceApprovedEmail({
              userName: requestorName,
              documentType: docRequest.document_name,
              trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${docRequest.tracking_number}`,
              officeName,
            }),
          );
          await sendMail({
            to: requestor[0].email,
            subject: `Your ${docRequest.document_name} request has been ${newStatus.toLowerCase()} by ${officeName}`,
            html: emailHtml,
          });
        }
      } catch {
        // notification/email errors are non-critical
      }
    })();

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
