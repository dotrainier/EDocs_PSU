// src/app/api/admin/dashboard/route.ts
//
// Real, system-wide overview for the admin dashboard (Admin only). Every
// number here is a genuine query — no fabricated trends or counts. Where a
// stat is currently backed by only one office (OUR is the only office with
// any document type routed to it — see seed.document.ts), the response
// makes that explicit via `participatingOffices` instead of pretending the
// system spans more offices than it currently does.
import { NextResponse } from 'next/server';
import { and, eq, gte, sql, inArray, desc } from 'drizzle-orm';
import { db } from '@/db';
import {
  users,
  document_requests,
  document_types,
  offices,
  audit_log,
} from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';
import { calculateExpectedDatesForOffice, getOfficeBacklogSummary } from '@/lib/expected-date';

const STATUS_ORDER = [
  'Pending',
  'In Process',
  'Action Required',
  'Ready for Release',
  'Released',
  'Cancelled',
];

const ACTIVITY_LABELS: Record<string, { label: string; type: 'info' | 'success' | 'danger' }> = {
  REQUEST_SUBMITTED: { label: 'Request submitted', type: 'info' },
  CLEARANCE_CLEARED: { label: 'Clearance cleared', type: 'success' },
  CLEARANCE_REJECTED: { label: 'Clearance rejected', type: 'danger' },
  PAYMENT_CONFIRMED: { label: 'Payment confirmed', type: 'success' },
  DOCUMENT_GENERATED: { label: 'Document generated', type: 'success' },
  REQUEST_READY_FOR_RELEASE: { label: 'Marked ready for release', type: 'success' },
  REQUEST_RELEASED: { label: 'Document released', type: 'success' },
};

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // ───────────────────────────────────────────────────────────────────────
    // 1. USER / REGISTRATION FUNNEL
    // ───────────────────────────────────────────────────────────────────────

    const [totalUsersRow, verificationRows] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(users),
      db
        .select({
          verification_status: users.verification_status,
          count: sql<number>`COUNT(*)`,
        })
        .from(users)
        .groupBy(users.verification_status),
    ]);

    const totalUsers = Number(totalUsersRow[0]?.count ?? 0);
    const registrationFunnel = { pending: 0, approved: 0, rejected: 0 };
    verificationRows.forEach((row) => {
      if (row.verification_status in registrationFunnel) {
        (registrationFunnel as Record<string, number>)[row.verification_status] = Number(row.count);
      }
    });

    // ───────────────────────────────────────────────────────────────────────
    // 2. REQUEST VOLUME — total, by status, by document type
    // ───────────────────────────────────────────────────────────────────────

    const [totalRequestsRow, statusRows, docTypeRows] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(document_requests),
      db
        .select({ status: document_requests.status, count: sql<number>`COUNT(*)` })
        .from(document_requests)
        .groupBy(document_requests.status),
      db
        .select({ name: document_types.name, count: sql<number>`COUNT(*)` })
        .from(document_requests)
        .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
        .groupBy(document_types.id, document_types.name),
    ]);

    const totalRequests = Number(totalRequestsRow[0]?.count ?? 0);

    const statusCountMap = new Map<string, number>();
    statusRows.forEach((row) => statusCountMap.set(row.status, Number(row.count)));
    const requestsByStatus = STATUS_ORDER.map((status) => ({
      status,
      count: statusCountMap.get(status) ?? 0,
    }));
    const pendingRequests = (statusCountMap.get('Pending') ?? 0) + (statusCountMap.get('In Process') ?? 0);

    const documentTypeVolume = docTypeRows
      .map((row) => ({ name: row.name, value: Number(row.count) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ───────────────────────────────────────────────────────────────────────
    // 3. COMPLETED TODAY — REQUEST_RELEASED audit events since local midnight
    // ───────────────────────────────────────────────────────────────────────

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedTodayRow = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(audit_log)
      .where(and(eq(audit_log.action, 'REQUEST_RELEASED'), gte(audit_log.timestamp, startOfToday)));
    const completedToday = Number(completedTodayRow[0]?.count ?? 0);

    // ───────────────────────────────────────────────────────────────────────
    // 4. PARTICIPATING OFFICES — offices actually issuing at least one active
    //    document type. Currently just OUR (see seed.document.ts), but this
    //    derives it live rather than hardcoding the office code, so it stays
    //    correct once other offices are wired up.
    // ───────────────────────────────────────────────────────────────────────

    const participatingOfficeRows = await db
      .selectDistinct({ id: offices.id, name: offices.name })
      .from(document_types)
      .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
      .where(eq(document_types.is_active, true))
      .orderBy(offices.name);

    // ───────────────────────────────────────────────────────────────────────
    // 5. SYSTEM-WIDE ON TRACK / OVERDUE — same calculateExpectedDatesForOffice
    //    used by the office dashboard, aggregated across every participating
    //    office (currently just OUR).
    // ───────────────────────────────────────────────────────────────────────

    const now = Date.now();
    let onTrack = 0;
    let overdue = 0;
    for (const office of participatingOfficeRows) {
      const expectedDates = await calculateExpectedDatesForOffice(office.id);
      expectedDates.forEach((date) => {
        if (date.getTime() < now) overdue++;
        else onTrack++;
      });
    }

    // ───────────────────────────────────────────────────────────────────────
    // 6. LIVE BACKLOG per participating office (currently just OUR)
    // ───────────────────────────────────────────────────────────────────────

    const officeBacklogs = await Promise.all(
      participatingOfficeRows.map(async (office) => ({
        officeId: office.id,
        officeName: office.name,
        ...(await getOfficeBacklogSummary(office.id)),
      })),
    );

    // ───────────────────────────────────────────────────────────────────────
    // 7. RECENT ACTIVITY — latest audit_log entries, system-wide
    // ───────────────────────────────────────────────────────────────────────

    const recentAuditRows = await db
      .select({
        id: audit_log.id,
        action: audit_log.action,
        details: audit_log.details,
        timestamp: audit_log.timestamp,
        actor_given_name: users.given_name,
        actor_middle_name: users.middle_name,
        actor_last_name: users.last_name,
        actor_name_suffix: users.name_suffix,
      })
      .from(audit_log)
      .leftJoin(users, eq(audit_log.user_id, users.id))
      .orderBy(desc(audit_log.timestamp))
      .limit(12);

    const requestIds = Array.from(
      new Set(
        recentAuditRows
          .map((row) => (row.details as Record<string, unknown> | null)?.requestId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    );

    const trackingLookup = new Map<string, { tracking_number: string; document_type: string }>();
    if (requestIds.length > 0) {
      const trackingRows = await db
        .select({
          id: document_requests.id,
          tracking_number: document_requests.tracking_number,
          document_type: document_types.name,
        })
        .from(document_requests)
        .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
        .where(inArray(document_requests.id, requestIds));
      trackingRows.forEach((row) => {
        trackingLookup.set(row.id, { tracking_number: row.tracking_number, document_type: row.document_type });
      });
    }

    const recentActivity = recentAuditRows.map((row) => {
      const details = (row.details as Record<string, unknown> | null) ?? {};
      const requestId = typeof details.requestId === 'string' ? details.requestId : null;
      const tracking = requestId ? trackingLookup.get(requestId) : null;
      const config = ACTIVITY_LABELS[row.action] ?? { label: row.action, type: 'info' as const };
      const actor = composeFullName({
        given_name: row.actor_given_name,
        middle_name: row.actor_middle_name,
        last_name: row.actor_last_name,
        name_suffix: row.actor_name_suffix,
      });

      return {
        id: row.id,
        action: row.action,
        label: config.label,
        type: config.type,
        actor: actor || null,
        detail: tracking ? `${tracking.document_type} — #${tracking.tracking_number}` : null,
        at: row.timestamp,
      };
    });

    // ───────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ───────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalRequests,
          pendingRequests,
          completedToday,
          onTrack,
          overdue,
        },
        registrationFunnel,
        requestsByStatus,
        documentTypeVolume,
        participatingOffices: participatingOfficeRows,
        officeBacklogs,
        recentActivity,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Admin dashboard error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
