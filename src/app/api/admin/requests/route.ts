// src/app/api/admin/requests/route.ts
//
// Real, system-wide list of document requests for the admin "All Requests"
// page (Admin only). Read-only — no status-changing actions live here; the
// real release action stays on the staff-side request-detail page.
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const rows = await db
      .select({
        id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        status: document_requests.status,
        payment_status: document_requests.payment_status,
        created_at: document_requests.created_at,
        document_type_name: document_types.name,
        requestor_given_name: users.given_name,
        requestor_middle_name: users.middle_name,
        requestor_last_name: users.last_name,
        requestor_name_suffix: users.name_suffix,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(users, eq(document_requests.user_id, users.id))
      .orderBy(desc(document_requests.created_at));

    const requests = rows.map((row) => ({
      id: row.id,
      tracking_number: row.tracking_number,
      status: row.status,
      payment_status: row.payment_status,
      created_at: row.created_at,
      document_type: row.document_type_name,
      requester_name: composeFullName({
        given_name: row.requestor_given_name,
        middle_name: row.requestor_middle_name,
        last_name: row.requestor_last_name,
        name_suffix: row.requestor_name_suffix,
      }),
    }));

    return NextResponse.json({ requests }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
