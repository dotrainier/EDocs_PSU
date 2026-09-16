// src/app/api/portal/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  audit_log,
  document_requests,
  document_types,
  offices,
  clearance_tasks,
  users,
} from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { calculateExpectedDateForRequest } from '@/lib/expected-date';
import { composeFullName } from '@/lib/user-name';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;

    const requestResult = await db
      .select({
        id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        purpose: document_requests.purpose,
        copies: document_requests.copies,
        additional_notes: document_requests.additional_notes,
        status: document_requests.status,
        fee_amount: document_requests.fee_amount,
        payment_status: document_requests.payment_status,
        payment_proof_path: document_requests.payment_proof_path,
        created_at: document_requests.created_at,
        updated_at: document_requests.updated_at,
        user_id: document_requests.user_id,
        document_type: document_types.name,
        handling_pattern: document_types.handling_pattern,
        issuing_office: offices.name,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const req = requestResult[0];

    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (req.user_id !== session.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const clearanceTaskRows = await db
      .select({
        office_name: offices.name,
        status: clearance_tasks.status,
        sequence_order: clearance_tasks.sequence_order,
        remarks: clearance_tasks.remarks,
        cleared_at: clearance_tasks.cleared_at,
        cleared_by_given_name: users.given_name,
        cleared_by_middle_name: users.middle_name,
        cleared_by_last_name: users.last_name,
        cleared_by_name_suffix: users.name_suffix,
      })
      .from(clearance_tasks)
      .innerJoin(offices, eq(clearance_tasks.office_id, offices.id))
      .leftJoin(users, eq(clearance_tasks.cleared_by, users.id))
      .where(eq(clearance_tasks.request_id, req.id))
      .orderBy(clearance_tasks.sequence_order);

    const tasks = clearanceTaskRows.map((task) => ({
      office_name: task.office_name,
      status: task.status,
      sequence_order: task.sequence_order,
      remarks: task.remarks,
      cleared_at: task.cleared_at,
      cleared_by: composeFullName({
        given_name: task.cleared_by_given_name,
        middle_name: task.cleared_by_middle_name,
        last_name: task.cleared_by_last_name,
        name_suffix: task.cleared_by_name_suffix,
      }),
    }));

    const expectedDate = await calculateExpectedDateForRequest(req.id);

    const toTimestamp = (value: Date | string | null) => (value ? new Date(value).getTime() : 0);

    const fallbackTimeline = [
      {
        id: `request-created-${req.id}`,
        title: 'Request submitted',
        at: req.created_at,
        subtitle: `Tracking #${req.tracking_number}`,
      },
      ...tasks
        .filter((task) => !!task.cleared_at)
        .map((task) => ({
          id: `task-${task.office_name}`,
          title: `${task.office_name} ${task.status.toLowerCase()}`,
          at: task.cleared_at,
          subtitle: task.cleared_by ? `By ${task.cleared_by}` : null,
        })),
    ]
      .filter((event) => !!event.at)
      .sort((a, b) => toTimestamp(b.at) - toTimestamp(a.at));

    const auditEventRows = await db
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
      .where(sql`${audit_log.details} ->> 'requestId' = ${req.id}`)
      .orderBy(audit_log.timestamp);

    const auditEvents = auditEventRows.map((event) => ({
      id: event.id,
      action: event.action,
      details: event.details,
      timestamp: event.timestamp,
      actor: composeFullName({
        given_name: event.actor_given_name,
        middle_name: event.actor_middle_name,
        last_name: event.actor_last_name,
        name_suffix: event.actor_name_suffix,
      }),
    }));

    const auditTimeline = auditEvents.map((event) => {
      const details = (event.details ?? {}) as Record<string, unknown>;
      const officeId = details.officeId ? Number(details.officeId) : null;
      const officeName = officeId
        ? tasks.find((task) => task.office_name && officeId)?.office_name
        : null;

      if (event.action === 'REQUEST_SUBMITTED') {
        return {
          id: event.id,
          title: 'Request submitted',
          at: event.timestamp,
          subtitle: `Tracking #${req.tracking_number}`,
        };
      }

      if (event.action === 'CLEARANCE_CLEARED') {
        return {
          id: event.id,
          title: `${officeName ?? 'Office'} cleared`,
          at: event.timestamp,
          subtitle: event.actor ? `By ${event.actor}` : null,
        };
      }

      if (event.action === 'CLEARANCE_REJECTED') {
        const remark = typeof details.remarks === 'string' ? details.remarks : null;
        return {
          id: event.id,
          title: `${officeName ?? 'Office'} rejected`,
          at: event.timestamp,
          subtitle: remark ?? (event.actor ? `By ${event.actor}` : null),
        };
      }

      if (event.action === 'REQUEST_RELEASED') {
        return {
          id: event.id,
          title: 'Document released',
          at: event.timestamp,
          subtitle: 'Ready for pickup confirmed complete',
        };
      }

      return {
        id: event.id,
        title: event.action,
        at: event.timestamp,
        subtitle: event.actor ? `By ${event.actor}` : null,
      };
    }).reverse();

    const timeline = auditTimeline.length ? auditTimeline : fallbackTimeline;

    return NextResponse.json(
      {
        request: {
          tracking_number: req.tracking_number,
          document_type: req.document_type,
          handling_pattern: req.handling_pattern,
          issuing_office: req.issuing_office,
          purpose: req.purpose,
          copies: req.copies,
          additional_notes: req.additional_notes,
          status: req.status,
          fee_amount: req.fee_amount,
          payment_status: req.payment_status,
          payment_proof_path: req.payment_proof_path,
          expected_date: expectedDate,
          created_at: req.created_at,
          updated_at: req.updated_at,
          clearance_tasks: tasks,
          timeline,
          documents: [],
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
