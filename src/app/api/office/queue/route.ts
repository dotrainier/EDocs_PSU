// src/app/api/office/queue/route.ts
import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests, document_types, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { calculateExpectedDatesForOffice } from '@/lib/expected-date';
import { composeFullName } from '@/lib/user-name';

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
        created_at: document_requests.created_at,

        // Document type
        document_type: document_types.name,
        handling_pattern: document_types.handling_pattern,

        // Requestor
        requestor_given_name: users.given_name,
        requestor_middle_name: users.middle_name,
        requestor_last_name: users.last_name,
        requestor_name_suffix: users.name_suffix,
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

    const tasks = taskRows.map(
      ({
        requestor_given_name,
        requestor_middle_name,
        requestor_last_name,
        requestor_name_suffix,
        ...task
      }) => ({
        ...task,
        requestor_name: composeFullName({
          given_name: requestor_given_name,
          middle_name: requestor_middle_name,
          last_name: requestor_last_name,
          name_suffix: requestor_name_suffix,
        }),
      }),
    );

    const expectedDates = await calculateExpectedDatesForOffice(Number(session.officeId));
    const tasksWithExpectedDate = tasks.map((t) => ({
      ...t,
      expected_date: expectedDates.get(t.request_id) ?? null,
    }));

    const stats = { total_pending: tasksWithExpectedDate.length };

    return NextResponse.json({ tasks: tasksWithExpectedDate, stats }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
