// src/lib/admin-reports.ts
//
// Read-only, system-wide reporting queries shared by the Admin Dashboard
// (/api/admin/dashboard), the Admin Payments page (/api/admin/payments) and
// the Admin Assistant's toolset (src/lib/admin-assistant.ts). Every number is
// a genuine live query — no fabricated trends or counts. Nothing in this file
// writes to the database.
import { and, eq, gte, sql, inArray, desc } from 'drizzle-orm';
import { db } from '@/db';
import { users, document_requests, document_types, offices, audit_log } from '@/db/schema';
import { composeFullName } from '@/lib/user-name';
import { calculateExpectedDatesForOffice, getOfficeBacklogSummary } from '@/lib/expected-date';

export const STATUS_ORDER = [
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

export async function getRegistrationFunnel(): Promise<{
  totalUsers: number;
  registrationFunnel: { pending: number; approved: number; rejected: number };
}> {
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

  const registrationFunnel = { pending: 0, approved: 0, rejected: 0 };
  verificationRows.forEach((row) => {
    if (row.verification_status in registrationFunnel) {
      (registrationFunnel as Record<string, number>)[row.verification_status] = Number(row.count);
    }
  });

  return { totalUsers: Number(totalUsersRow[0]?.count ?? 0), registrationFunnel };
}

/**
 * Request counts: all-time total, by status (every status in STATUS_ORDER,
 * zero-filled), and by document type (every type with at least one request,
 * sorted by volume descending — callers slice if they only want the top N).
 */
export async function getRequestVolume(): Promise<{
  totalRequests: number;
  pendingRequests: number;
  requestsByStatus: Array<{ status: string; count: number }>;
  documentTypeVolume: Array<{ name: string; value: number }>;
}> {
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

  const statusCountMap = new Map<string, number>();
  statusRows.forEach((row) => statusCountMap.set(row.status, Number(row.count)));
  const requestsByStatus = STATUS_ORDER.map((status) => ({
    status,
    count: statusCountMap.get(status) ?? 0,
  }));

  return {
    totalRequests: Number(totalRequestsRow[0]?.count ?? 0),
    pendingRequests: (statusCountMap.get('Pending') ?? 0) + (statusCountMap.get('In Process') ?? 0),
    requestsByStatus,
    documentTypeVolume: docTypeRows
      .map((row) => ({ name: row.name, value: Number(row.count) }))
      .sort((a, b) => b.value - a.value),
  };
}

/** Requests released since local midnight (REQUEST_RELEASED audit events). */
export async function getCompletedToday(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const row = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(audit_log)
    .where(and(eq(audit_log.action, 'REQUEST_RELEASED'), gte(audit_log.timestamp, startOfToday)));
  return Number(row[0]?.count ?? 0);
}

/**
 * Offices actually issuing at least one active document type. Currently just
 * OUR (see seed.document.ts), but this derives it live rather than
 * hardcoding the office code, so it stays correct once other offices are
 * wired up.
 */
export async function getParticipatingOffices(): Promise<Array<{ id: number; name: string }>> {
  return db
    .selectDistinct({ id: offices.id, name: offices.name })
    .from(document_types)
    .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
    .where(eq(document_types.is_active, true))
    .orderBy(offices.name);
}

/**
 * On-track/overdue counts and live backlog for each participating office —
 * the same calculateExpectedDatesForOffice / getOfficeBacklogSummary used by
 * the office dashboard, aggregated across offices.
 */
export async function getCapacitySnapshot(participatingOffices: Array<{ id: number; name: string }>): Promise<{
  onTrack: number;
  overdue: number;
  officeBacklogs: Array<{
    officeId: number;
    officeName: string;
    totalWeight: number;
    dailyCapacity: number | null;
    backlogDays: number;
  }>;
}> {
  const now = Date.now();
  let onTrack = 0;
  let overdue = 0;
  for (const office of participatingOffices) {
    const expectedDates = await calculateExpectedDatesForOffice(office.id);
    expectedDates.forEach((date) => {
      if (date.getTime() < now) overdue++;
      else onTrack++;
    });
  }

  const officeBacklogs = await Promise.all(
    participatingOffices.map(async (office) => ({
      officeId: office.id,
      officeName: office.name,
      ...(await getOfficeBacklogSummary(office.id)),
    })),
  );

  return { onTrack, overdue, officeBacklogs };
}

export async function getRecentActivity(limit = 12): Promise<
  Array<{
    id: string | number;
    action: string;
    label: string;
    type: 'info' | 'success' | 'danger';
    actor: string | null;
    detail: string | null;
    at: Date;
  }>
> {
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
    .limit(limit);

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

  return recentAuditRows.map((row) => {
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
}

/**
 * Live payment snapshot — collected vs outstanding, overall and per document
 * type. Sums use document_requests.fee_amount (the fee snapshotted onto the
 * request at submission time), not document_types.fee_amount — so a later
 * fee change on a document type never retroactively changes what an old
 * paid/unpaid request is reported as owing.
 */
export async function getPaymentReport(): Promise<{
  totals: { collected: number; outstanding: number; paidCount: number; unpaidCount: number };
  byDocumentType: Array<{
    documentTypeId: number;
    name: string;
    code: string;
    paidCount: number;
    paidAmount: number;
    unpaidCount: number;
    unpaidAmount: number;
  }>;
}> {
  const types = await db
    .select({ id: document_types.id, name: document_types.name, code: document_types.code })
    .from(document_types)
    .orderBy(document_types.name);

  const agg = await db
    .select({
      document_type_id: document_requests.document_type_id,
      payment_status: document_requests.payment_status,
      count: sql<number>`count(*)::int`,
      amount: sql<string>`coalesce(sum(${document_requests.fee_amount}::numeric), 0)`,
    })
    .from(document_requests)
    .groupBy(document_requests.document_type_id, document_requests.payment_status);

  const byDocumentType = types.map((t) => {
    const paidRow = agg.find((a) => a.document_type_id === t.id && a.payment_status === 'Paid');
    const unpaidRow = agg.find((a) => a.document_type_id === t.id && a.payment_status === 'Unpaid');
    return {
      documentTypeId: t.id,
      name: t.name,
      code: t.code,
      paidCount: paidRow?.count ?? 0,
      paidAmount: Number(paidRow?.amount ?? 0),
      unpaidCount: unpaidRow?.count ?? 0,
      unpaidAmount: Number(unpaidRow?.amount ?? 0),
    };
  });

  const totals = byDocumentType.reduce(
    (acc, t) => ({
      collected: acc.collected + t.paidAmount,
      outstanding: acc.outstanding + t.unpaidAmount,
      paidCount: acc.paidCount + t.paidCount,
      unpaidCount: acc.unpaidCount + t.unpaidCount,
    }),
    { collected: 0, outstanding: 0, paidCount: 0, unpaidCount: 0 },
  );

  return { totals, byDocumentType };
}
