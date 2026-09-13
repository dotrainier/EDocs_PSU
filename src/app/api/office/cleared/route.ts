// src/app/api/office/cleared/route.ts
import { NextResponse } from 'next/server';
import { eq, and, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { clearance_tasks, document_requests, document_types, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';

const requestor = alias(users, 'requestor');
const clearedBy = alias(users, 'cleared_by_user');

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const taskRows = await db
      .select({
        task_id: clearance_tasks.id,
        task_status: clearance_tasks.status,
        sequence_order: clearance_tasks.sequence_order,
        remarks: clearance_tasks.remarks,
        cleared_at: clearance_tasks.cleared_at,
        cleared_by_given_name: clearedBy.given_name,
        cleared_by_middle_name: clearedBy.middle_name,
        cleared_by_last_name: clearedBy.last_name,
        cleared_by_name_suffix: clearedBy.name_suffix,
        request_id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        status: document_requests.status,
        purpose: document_requests.purpose,
        sla_due_at: document_requests.sla_due_at,
        created_at: document_requests.created_at,
        document_type: document_types.name,
        requestor_given_name: requestor.given_name,
        requestor_middle_name: requestor.middle_name,
        requestor_last_name: requestor.last_name,
        requestor_name_suffix: requestor.name_suffix,
        requestor_school_id: requestor.school_id,
      })
      .from(clearance_tasks)
      .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(requestor, eq(document_requests.user_id, requestor.id))
      .leftJoin(clearedBy, eq(clearance_tasks.cleared_by, clearedBy.id))
      .where(
        and(
          eq(clearance_tasks.office_id, Number(session.officeId)),
          or(eq(clearance_tasks.status, 'Cleared'), eq(clearance_tasks.status, 'Rejected')),
        ),
      )
      .orderBy(desc(clearance_tasks.cleared_at));

    const tasks = taskRows.map(
      ({
        cleared_by_given_name,
        cleared_by_middle_name,
        cleared_by_last_name,
        cleared_by_name_suffix,
        requestor_given_name,
        requestor_middle_name,
        requestor_last_name,
        requestor_name_suffix,
        ...task
      }) => ({
        ...task,
        cleared_by_name: composeFullName({
          given_name: cleared_by_given_name,
          middle_name: cleared_by_middle_name,
          last_name: cleared_by_last_name,
          name_suffix: cleared_by_name_suffix,
        }),
        requestor_name: composeFullName({
          given_name: requestor_given_name,
          middle_name: requestor_middle_name,
          last_name: requestor_last_name,
          name_suffix: requestor_name_suffix,
        }),
      }),
    );

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
