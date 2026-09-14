// src/app/api/office/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  audit_log,
  clearance_tasks,
  document_requests,
  document_types,
  offices,
  users,
} from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { getSlaStatus } from '@/lib/server_utils';
import { getStudentAcademicSummary } from '@/lib/academic-records';
import { composeFullName } from '@/lib/user-name';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const { id } = await params;

    // 3. Fetch main request row
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
        clearance_form_public_id: document_requests.clearance_form_public_id,
        sla_due_at: document_requests.sla_due_at,
        created_at: document_requests.created_at,
        document_type: document_types.name,
        document_type_code: document_types.code,
        handling_pattern: document_types.handling_pattern,
        document_type_id: document_requests.document_type_id,
        issuing_office: offices.name,
        // Period fields — only populated for COG requests
        school_year: document_requests.school_year,
        semester: document_requests.semester,
        // Requestor info
        requestor_id: users.id,
        requestor_given_name: users.given_name,
        requestor_middle_name: users.middle_name,
        requestor_last_name: users.last_name,
        requestor_name_suffix: users.name_suffix,
        requestor_school_id: users.school_id,
        requestor_email: users.email,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
      .innerJoin(users, eq(document_requests.user_id, users.id))
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const req = requestResult[0];

    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // 4. Fetch all clearance tasks for this request
    const clearedByUsers = users;
    const taskRows = await db
      .select({
        task_id: clearance_tasks.id,
        office_name: offices.name,
        office_id: clearance_tasks.office_id,
        status: clearance_tasks.status,
        sequence_order: clearance_tasks.sequence_order,
        remarks: clearance_tasks.remarks,
        cleared_at: clearance_tasks.cleared_at,
        cleared_by_given_name: clearedByUsers.given_name,
        cleared_by_middle_name: clearedByUsers.middle_name,
        cleared_by_last_name: clearedByUsers.last_name,
        cleared_by_name_suffix: clearedByUsers.name_suffix,
      })
      .from(clearance_tasks)
      .innerJoin(offices, eq(clearance_tasks.office_id, offices.id))
      .leftJoin(clearedByUsers, eq(clearance_tasks.cleared_by, clearedByUsers.id))
      .where(eq(clearance_tasks.request_id, req.id))
      .orderBy(clearance_tasks.sequence_order);

    const tasks = taskRows.map((task) => ({
      task_id: task.task_id,
      office_name: task.office_name,
      office_id: task.office_id,
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

    // 5. Find this office's specific task
    const myTask = tasks.find((t) => t.office_id === Number(session.officeId));

    if (!myTask) {
      return NextResponse.json(
        { message: 'Your office is not involved in this request' },
        { status: 403 },
      );
    }

    // 6. SLA status
    const slaStatus = req.sla_due_at ? getSlaStatus(req.created_at, req.sla_due_at) : 'OnTrack';

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
          id: `task-${task.task_id}`,
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
        ? tasks.find((task) => task.office_id === officeId)?.office_name
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

      if (event.action === 'PAYMENT_CONFIRMED') {
        return {
          id: event.id,
          title: 'Payment confirmed',
          at: event.timestamp,
          subtitle: event.actor ? `By ${event.actor}` : null,
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

    // 7. Academic-records reference panel — Registrar staff only. Sourced
    // entirely through getStudentAcademicSummary(), the sole entry point into
    // the isolated (placeholder) academic-records data source.
    const isRegistrarReviewer = myTask.office_name.toLowerCase().includes('registrar');
    const academicSummary = isRegistrarReviewer
      ? await getStudentAcademicSummary(req.requestor_id)
      : null;

    return NextResponse.json(
      {
        request: {
          tracking_number: req.tracking_number,
          document_type: req.document_type,
          document_type_code: req.document_type_code,
          handling_pattern: req.handling_pattern,
          issuing_office: req.issuing_office,
          purpose: req.purpose,
          copies: req.copies,
          school_year: req.school_year,
          semester: req.semester,
          additional_notes: req.additional_notes,
          status: req.status,
          fee_amount: req.fee_amount,
          payment_status: req.payment_status,
          payment_proof_path: req.payment_proof_path,
          has_clearance_form: !!req.clearance_form_public_id,
          sla_due_at: req.sla_due_at,
          sla_status: slaStatus,
          created_at: req.created_at,
          requestor_name: composeFullName({
            given_name: req.requestor_given_name,
            middle_name: req.requestor_middle_name,
            last_name: req.requestor_last_name,
            name_suffix: req.requestor_name_suffix,
          }),
          requestor_school_id: req.requestor_school_id,
          requestor_email: req.requestor_email,
          clearance_tasks: tasks,
          my_task: myTask ?? null, // ← this office's task specifically
          timeline,
          academic_summary: academicSummary,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
