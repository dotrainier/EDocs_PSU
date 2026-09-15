// src/app/api/office/dashboard/route.ts
import { NextResponse } from 'next/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests, document_types, users, offices } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    // 2. Role check
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned' }, { status: 403 });
    }

    const officeId = Number(session.officeId);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. GET ALL PENDING TASKS FOR THIS OFFICE (+ SLA status)
    // ─────────────────────────────────────────────────────────────────────────

    const pendingTaskRows = await db
      .select({
        request_id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        document_type: document_types.name,
        requestor_given_name: users.given_name,
        requestor_middle_name: users.middle_name,
        requestor_last_name: users.last_name,
        requestor_name_suffix: users.name_suffix,
        created_at: document_requests.created_at,
        status: document_requests.status,
        payment_status: document_requests.payment_status,
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(users, eq(document_requests.user_id, users.id))
      .where(and(eq(clearance_tasks.office_id, officeId), eq(clearance_tasks.status, 'Pending')))
      .orderBy(desc(document_requests.created_at));

    const pendingTasks = pendingTaskRows.map((task) => ({
      request_id: task.request_id,
      tracking_number: task.tracking_number,
      document_type: task.document_type,
      requestor_name: composeFullName({
        given_name: task.requestor_given_name,
        middle_name: task.requestor_middle_name,
        last_name: task.requestor_last_name,
        name_suffix: task.requestor_name_suffix,
      }),
      created_at: task.created_at,
      status: task.status,
      payment_status: task.payment_status,
    }));

    // NOTE: On Track/At Risk/Breached SLA-status counts and the weekly SLA
    // trend chart are retired along with the fixed-deadline SLA system. A
    // live capacity-based number doesn't fit an "on track/breached" framing,
    // so these are left as neutral placeholders pending a dedicated
    // replacement concept for the dashboard (a separate follow-up task) —
    // see calculateExpectedDate() in src/lib/expected-date.ts for the new
    // per-request calculation used elsewhere.
    const tasksWithSla = pendingTasks.map((t) => ({ ...t, sla_status: 'On Track' as const }));

    const stats = {
      total_pending: tasksWithSla.length,
      on_track: tasksWithSla.length,
      at_risk: 0,
      breached: 0,
    };

    const slaWeeklyTrend: Array<{ week: string; onTrack: number; atRisk: number; breached: number }> =
      ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week) => ({
        week,
        onTrack: 0,
        atRisk: 0,
        breached: 0,
      }));

    // ─────────────────────────────────────────────────────────────────────────
    // 3. DOCUMENT TYPE DISTRIBUTION
    // ─────────────────────────────────────────────────────────────────────────

    const docTypeVolume = await db
      .select({
        name: document_types.name,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(eq(clearance_tasks.office_id, officeId))
      .groupBy(document_types.id, document_types.name);

    const documentTypeDistribution = docTypeVolume
      .map((row) => ({
        name: row.name,
        value: Number(row.count ?? 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PROCESSING TIME vs SLA TARGET (released requests only)
    // ─────────────────────────────────────────────────────────────────────────

    const releasedRequests = await db
      .select({
        document_type: document_types.name,
        sla_days: document_types.sla_working_days,
        created_at: document_requests.created_at,
        updated_at: document_requests.updated_at,
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(
        and(eq(clearance_tasks.office_id, officeId), eq(document_requests.status, 'Released')),
      );

    // Calculate average processing time per document type
    const processingTimeMap: Record<string, { total: number; count: number; sla: number }> = {};
    releasedRequests.forEach((r) => {
      if (!processingTimeMap[r.document_type]) {
        processingTimeMap[r.document_type] = { total: 0, count: 0, sla: r.sla_days };
      }
      const daysProcessing = Math.ceil(
        (r.updated_at.getTime() - r.created_at.getTime()) / (24 * 60 * 60 * 1000),
      );
      processingTimeMap[r.document_type].total += daysProcessing;
      processingTimeMap[r.document_type].count++;
    });

    const processingTime = Object.entries(processingTimeMap)
      .map(([docType, data]) => ({
        docType,
        target: data.sla,
        actual: Math.round(data.total / data.count),
      }))
      .slice(0, 4); // Top 4

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CLEARANCE PERFORMANCE BY OFFICE
    // ─────────────────────────────────────────────────────────────────────────

    const clearanceByOffice = await db
      .select({
        office_name: offices.name,
        cleared:
          sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Cleared' THEN 1 ELSE 0 END)`.as(
            'cleared',
          ),
        pending:
          sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Pending' THEN 1 ELSE 0 END)`.as(
            'pending',
          ),
        rejected:
          sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Rejected' THEN 1 ELSE 0 END)`.as(
            'rejected',
          ),
      })
      .from(clearance_tasks)
      .innerJoin(offices, eq(clearance_tasks.office_id, offices.id))
      .groupBy(offices.id, offices.name)
      .orderBy(offices.name);

    const clearancePerformance = clearanceByOffice.map((row) => ({
      office: row.office_name,
      cleared: Number(row.cleared ?? 0),
      pending: Number(row.pending ?? 0),
      rejected: Number(row.rejected ?? 0),
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 6. RECENT QUEUE PREVIEW (top 5)
    // ─────────────────────────────────────────────────────────────────────────

    const queuePreview = tasksWithSla.slice(0, 5).map((t) => ({
      request_id: t.request_id,
      tracking_number: t.tracking_number,
      document_type: t.document_type,
      requestor_name: t.requestor_name,
      created_at: t.created_at,
      sla_status: t.sla_status,
      payment_status: t.payment_status,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 7. PERSONAL STATS (OfficeStaff only)
    // ─────────────────────────────────────────────────────────────────────────

    const myStatsRow = await db
      .select({
        cleared: sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Cleared' THEN 1 ELSE 0 END)`.as('cleared'),
        rejected: sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Rejected' THEN 1 ELSE 0 END)`.as('rejected'),
      })
      .from(clearance_tasks)
      .where(eq(clearance_tasks.cleared_by, session.userId));

    const myStats = {
      my_cleared: Number(myStatsRow[0]?.cleared ?? 0),
      my_rejected: Number(myStatsRow[0]?.rejected ?? 0),
      my_pending: stats.total_pending,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        // Role (used by AI insights to tailor prompt)
        role: session.role,

        // Stats cards
        stats,

        // Chart data
        slaWeeklyTrend,
        documentTypeDistribution,
        processingTime,
        clearancePerformance,

        // Queue preview
        tasks: queuePreview,

        // Personal stats for role-aware AI insights
        myStats,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Dashboard error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
