import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types, offices } from '@/db/schema';

// Statuses that still occupy an office's processing capacity. Requests that
// are Ready for Release, Released, Cancelled, or blocked on the student
// (Action Required) are no longer competing for today's throughput.
const QUEUE_STATUSES = ['Pending', 'In Process'];

// Fallback for offices with no daily_capacity configured yet (the column is
// nullable; Admins set it per office under Capacity Settings).
const DEFAULT_DAILY_CAPACITY = 20;

/**
 * The single source of truth for turning a queue position into a calendar
 * date: MAX(ceil(queueWeight / dailyCapacity), slaWorkingDays) business days
 * projected forward from `from`, skipping weekends.
 */
export function calculateExpectedDate(params: {
  queueWeight: number;
  dailyCapacity: number | null;
  slaWorkingDays: number;
  from: Date;
}): Date {
  const capacity =
    params.dailyCapacity && params.dailyCapacity > 0 ? params.dailyCapacity : DEFAULT_DAILY_CAPACITY;
  const queueDays = Math.ceil(params.queueWeight / capacity);
  const totalDays = Math.max(queueDays, params.slaWorkingDays);

  const date = new Date(params.from);
  let remaining = totalDays;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date;
}

async function getOfficeDailyCapacity(officeId: number): Promise<number | null> {
  const rows = await db
    .select({ daily_capacity: offices.daily_capacity })
    .from(offices)
    .where(eq(offices.id, officeId))
    .limit(1);
  return rows[0]?.daily_capacity ?? null;
}

/**
 * Expected date for every currently-queued request at an office, computed
 * together in one pass so each request's position reflects the ones ahead of
 * it — used by the office queue table.
 */
export async function calculateExpectedDatesForOffice(
  officeId: number,
): Promise<Map<string, Date>> {
  const [dailyCapacity, queued] = await Promise.all([
    getOfficeDailyCapacity(officeId),
    db
      .select({
        id: document_requests.id,
        created_at: document_requests.created_at,
        capacity_weight: document_types.capacity_weight,
        sla_working_days: document_types.sla_working_days,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(
        and(
          eq(document_types.issuing_office_id, officeId),
          inArray(document_requests.status, QUEUE_STATUSES),
        ),
      )
      .orderBy(asc(document_requests.created_at)),
  ]);

  const result = new Map<string, Date>();
  let cumulativeWeight = 0;
  for (const req of queued) {
    cumulativeWeight += req.capacity_weight;
    result.set(
      req.id,
      calculateExpectedDate({
        queueWeight: cumulativeWeight,
        dailyCapacity,
        slaWorkingDays: req.sla_working_days,
        from: req.created_at,
      }),
    );
  }
  return result;
}

/**
 * Expected date for a single existing request. Delegates to
 * calculateExpectedDatesForOffice so a queued request's date accounts for
 * everything ahead of it; a request no longer in the active queue (Released,
 * Cancelled, etc.) falls back to a standalone calculation from its own
 * weight and created_at.
 */
export async function calculateExpectedDateForRequest(requestId: string): Promise<Date | null> {
  const rows = await db
    .select({
      created_at: document_requests.created_at,
      capacity_weight: document_types.capacity_weight,
      sla_working_days: document_types.sla_working_days,
      issuing_office_id: document_types.issuing_office_id,
    })
    .from(document_requests)
    .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
    .where(eq(document_requests.id, requestId))
    .limit(1);

  const req = rows[0];
  if (!req) return null;

  const datesForOffice = await calculateExpectedDatesForOffice(req.issuing_office_id);
  const queued = datesForOffice.get(requestId);
  if (queued) return queued;

  const dailyCapacity = await getOfficeDailyCapacity(req.issuing_office_id);
  return calculateExpectedDate({
    queueWeight: req.capacity_weight,
    dailyCapacity,
    slaWorkingDays: req.sla_working_days,
    from: req.created_at,
  });
}

/**
 * Pre-submission preview (Step4Review): what the expected date would be if
 * the student submitted this document type right now — the hypothetical
 * request's weight added on top of everything currently queued at its
 * issuing office, projected forward from today.
 */
export async function calculateExpectedDateForNewRequest(documentTypeId: number): Promise<Date | null> {
  const rows = await db
    .select({
      capacity_weight: document_types.capacity_weight,
      sla_working_days: document_types.sla_working_days,
      issuing_office_id: document_types.issuing_office_id,
    })
    .from(document_types)
    .where(eq(document_types.id, documentTypeId))
    .limit(1);

  const docType = rows[0];
  if (!docType) return null;

  const [dailyCapacity, pendingWeightRows] = await Promise.all([
    getOfficeDailyCapacity(docType.issuing_office_id),
    db
      .select({ weight: sql<number>`COALESCE(SUM(${document_types.capacity_weight}), 0)` })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(
        and(
          eq(document_types.issuing_office_id, docType.issuing_office_id),
          inArray(document_requests.status, QUEUE_STATUSES),
        ),
      ),
  ]);

  const pendingWeight = Number(pendingWeightRows[0]?.weight ?? 0);

  return calculateExpectedDate({
    queueWeight: pendingWeight + docType.capacity_weight,
    dailyCapacity,
    slaWorkingDays: docType.sla_working_days,
    from: new Date(),
  });
}

/**
 * Current backlog at an office, expressed in days: the same
 * queueWeight/dailyCapacity ratio calculateExpectedDate() uses internally,
 * surfaced on its own for the office dashboard — a live snapshot, not a
 * historical trend (see the office dashboard route for why).
 */
export async function getOfficeBacklogSummary(officeId: number): Promise<{
  totalWeight: number;
  dailyCapacity: number | null;
  backlogDays: number;
}> {
  const [dailyCapacity, weightRows] = await Promise.all([
    getOfficeDailyCapacity(officeId),
    db
      .select({ weight: sql<number>`COALESCE(SUM(${document_types.capacity_weight}), 0)` })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(
        and(
          eq(document_types.issuing_office_id, officeId),
          inArray(document_requests.status, QUEUE_STATUSES),
        ),
      ),
  ]);

  const totalWeight = Number(weightRows[0]?.weight ?? 0);
  const capacity =
    dailyCapacity && dailyCapacity > 0 ? dailyCapacity : DEFAULT_DAILY_CAPACITY;

  return { totalWeight, dailyCapacity, backlogDays: Math.ceil(totalWeight / capacity) };
}
