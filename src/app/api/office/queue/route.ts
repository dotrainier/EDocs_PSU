// src/app/api/office/queue/route.ts
import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests, document_types, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { getSlaStatus } from '@/lib/server_utils';

// ── GET /api/office/queue ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    // 2. Only office staff and office head can access
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 3. Must have an office assigned
    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    // 4. Fetch pending tasks for this office
    const tasks = await db
      .select({
        // Task info
        task_id: clearance_tasks.id,
        task_status: clearance_tasks.status,
        sequence_order: clearance_tasks.sequence_order,

        // Request info
        request_id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        status: document_requests.status,
        purpose: document_requests.purpose,
        copies: document_requests.copies,
        fee_amount: document_requests.fee_amount,
        payment_status: document_requests.payment_status,
        sla_due_at: document_requests.sla_due_at,
        created_at: document_requests.created_at,

        // Document type
        document_type: document_types.name,
        handling_pattern: document_types.handling_pattern,

        // Requestor
        requestor_name: users.full_name,
        requestor_school_id: users.school_id,
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(users, eq(document_requests.user_id, users.id))
      .where(
        and(
          eq(clearance_tasks.office_id, Number(session.officeId)),
          eq(clearance_tasks.status, 'Pending'),
        ),
      )
      .orderBy(desc(document_requests.created_at));

    // 5. Add SLA status to each task
    const tasksWithSla = tasks.map((t) => ({
      ...t,
      sla_status: t.sla_due_at ? getSlaStatus(t.created_at, t.sla_due_at) : 'OnTrack',
    }));

    // 6. Stats for dashboard
    const stats = {
      total_pending: tasksWithSla.length,
      on_track: tasksWithSla.filter((t) => t.sla_status === 'OnTrack').length,
      at_risk: tasksWithSla.filter((t) => t.sla_status === 'AtRisk').length,
      breached: tasksWithSla.filter((t) => t.sla_status === 'Breached').length,
    };

    return NextResponse.json({ tasks: tasksWithSla, stats }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
