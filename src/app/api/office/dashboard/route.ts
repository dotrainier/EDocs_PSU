// src/app/api/office/dashboard/route.ts
import { NextResponse } from 'next/server';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests, document_types, users, offices } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

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

    const pendingTasks = await db
      .select({
        request_id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        document_type: document_types.name,
        requestor_name: users.full_name,
        created_at: document_requests.created_at,
        sla_due_at: document_requests.sla_due_at,
        status: document_requests.status,
        payment_status: document_requests.payment_status,
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(users, eq(document_requests.user_id, users.id))
      .where(and(eq(clearance_tasks.office_id, officeId), eq(clearance_tasks.status, 'Pending')))
      .orderBy(desc(document_requests.created_at));

    // Helper: calculate SLA status from dates
    const calculateSlaStatus = (createdAt: Date, slaDueAt: Date | null): string => {
      if (!slaDueAt) return 'On Track';
      const now = new Date();
      const totalMs = slaDueAt.getTime() - createdAt.getTime();
      const elapsedMs = now.getTime() - createdAt.getTime();
      const percentElapsed = (elapsedMs / totalMs) * 100;

      if (percentElapsed >= 100) return 'Breached';
      if (percentElapsed >= 75) return 'At Risk';
      return 'On Track';
    };

    // 2. Calculate stats
    const tasksWithSla = pendingTasks.map((t) => ({
      ...t,
      sla_status: calculateSlaStatus(t.created_at, t.sla_due_at),
    }));

    const stats = {
      total_pending: tasksWithSla.length,
      on_track: tasksWithSla.filter((t) => t.sla_status === 'OnTrack').length,
      at_risk: tasksWithSla.filter((t) => t.sla_status === 'AtRisk').length,
      breached: tasksWithSla.filter((t) => t.sla_status === 'Breached').length,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SLA WEEKLY TREND (last 4 weeks)
    // ─────────────────────────────────────────────────────────────────────────

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const allRequestsLast4Weeks = await db
      .select({
        request_id: document_requests.id,
        created_at: document_requests.created_at,
        sla_due_at: document_requests.sla_due_at,
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .where(
        and(
          eq(clearance_tasks.office_id, officeId),
          gte(document_requests.created_at, fourWeeksAgo),
        ),
      );

    // Group by week
    const weeklyMap: Record<string, { onTrack: number; atRisk: number; breached: number }> = {};
    allRequestsLast4Weeks.forEach((r) => {
      const weekNum = Math.ceil(
        (new Date().getTime() - r.created_at.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      const weekKey = `Week ${5 - Math.floor(weekNum / 7)}`;

      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { onTrack: 0, atRisk: 0, breached: 0 };
      }

      const status = calculateSlaStatus(r.created_at, r.sla_due_at);
      if (status === 'OnTrack') weeklyMap[weekKey].onTrack++;
      else if (status === 'AtRisk') weeklyMap[weekKey].atRisk++;
      else weeklyMap[weekKey].breached++;
    });

    const slaWeeklyTrend = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week) => ({
      week,
      onTrack: weeklyMap[week]?.onTrack ?? 0,
      atRisk: weeklyMap[week]?.atRisk ?? 0,
      breached: weeklyMap[week]?.breached ?? 0,
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
      sla_due_at: t.sla_due_at,
      sla_status: t.sla_status,
      payment_status: t.payment_status,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        // Stats cards
        stats,

        // Chart data
        slaWeeklyTrend,
        documentTypeDistribution,
        processingTime,
        clearancePerformance,

        // Queue preview
        tasks: queuePreview,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Dashboard error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
