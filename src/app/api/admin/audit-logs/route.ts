// src/app/api/admin/audit-logs/route.ts
//
// Real, paginated audit trail for the admin Audit Logs page (Admin only).
// Supports filtering by action type and a date range; actor search was left
// out for now — see the note above the `where` clause below.
import { NextResponse } from 'next/server';
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { audit_log, users, offices } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';
import { describeAuditEvent, KNOWN_AUDIT_ACTIONS } from '@/lib/audit-labels';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const actionParam = searchParams.get('action');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE),
    );

    const conditions: SQL[] = [];

    if (actionParam && (KNOWN_AUDIT_ACTIONS as readonly string[]).includes(actionParam)) {
      conditions.push(eq(audit_log.action, actionParam));
    }

    // The client sends full instants (already converted from its local
    // calendar day) rather than bare dates, so the day boundary matches what
    // the admin sees in the (locally rendered) Timestamp column.
    if (fromParam && !Number.isNaN(new Date(fromParam).getTime())) {
      conditions.push(gte(audit_log.timestamp, new Date(fromParam)));
    }

    if (toParam && !Number.isNaN(new Date(toParam).getTime())) {
      conditions.push(lte(audit_log.timestamp, new Date(toParam)));
    }

    // Actor search is deliberately not implemented yet. Action-type and
    // date-range filters are plain WHERE clauses on audit_log's own columns.
    // Actor search would need to match a *computed* full name
    // (given/middle/last/suffix concatenated) or email on the joined users
    // row — the first free-text search in this app that isn't done by
    // fetching everything and filtering client-side (every other admin list
    // does that). Adding it properly means a raw ILIKE-on-concat clause with
    // no existing pattern to follow here, so it's left for a follow-up rather
    // than bolted on.

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(audit_log)
      .where(where);

    const rows = await db
      .select({
        id: audit_log.id,
        action: audit_log.action,
        details: audit_log.details,
        timestamp: audit_log.timestamp,
        actor_given_name: users.given_name,
        actor_middle_name: users.middle_name,
        actor_last_name: users.last_name,
        actor_name_suffix: users.name_suffix,
        actor_email: users.email,
      })
      .from(audit_log)
      .leftJoin(users, eq(audit_log.user_id, users.id))
      .where(where)
      .orderBy(desc(audit_log.timestamp))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Offices table is tiny (a handful of rows) — fetched in full rather
    // than joined per-row-via-jsonb, since `details.officeId` lives inside
    // a jsonb column rather than a real foreign key.
    const officeRows = await db.select({ id: offices.id, name: offices.name }).from(offices);
    const officeNameById = new Map(officeRows.map((o) => [o.id, o.name]));

    const logs = rows.map((row) => {
      const details = (row.details ?? {}) as Record<string, unknown>;
      const officeId = details.officeId ? Number(details.officeId) : null;
      const officeName = officeId ? (officeNameById.get(officeId) ?? null) : null;
      const actorName = row.actor_given_name
        ? composeFullName({
            given_name: row.actor_given_name,
            middle_name: row.actor_middle_name,
            last_name: row.actor_last_name,
            name_suffix: row.actor_name_suffix,
          })
        : null;

      const { title, subtitle } = describeAuditEvent({
        action: row.action,
        details: row.details as Record<string, unknown> | null,
        actorName,
        officeName,
      });

      return {
        id: row.id,
        action: row.action,
        label: title,
        detail: subtitle,
        details: row.details,
        actor_name: actorName,
        actor_email: row.actor_email,
        timestamp: row.timestamp,
      };
    });

    return NextResponse.json(
      {
        logs,
        page,
        pageSize,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / pageSize)),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
