// src/app/api/admin/requests/[id]/route.ts
//
// Minimal Admin-facing request detail (Admin only) — exists solely so the
// admin-only "Mark as Released" action (see .../release/route.ts) has
// somewhere to live. Deliberately not a clone of the staff request-detail
// page: no per-office clearance-task matching, no Clear/Reject/Mark as
// Paid/Generate Document — those stay exactly where they are, authorized
// exactly as before, on the staff side.
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const rows = await db
      .select({
        id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        purpose: document_requests.purpose,
        copies: document_requests.copies,
        status: document_requests.status,
        fee_amount: document_requests.fee_amount,
        payment_status: document_requests.payment_status,
        created_at: document_requests.created_at,
        updated_at: document_requests.updated_at,
        document_type: document_types.name,
        requestor_given_name: users.given_name,
        requestor_middle_name: users.middle_name,
        requestor_last_name: users.last_name,
        requestor_name_suffix: users.name_suffix,
        requestor_email: users.email,
        requestor_school_id: users.school_id,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .innerJoin(users, eq(document_requests.user_id, users.id))
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const req = rows[0];
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        request: {
          tracking_number: req.tracking_number,
          document_type: req.document_type,
          purpose: req.purpose,
          copies: req.copies,
          status: req.status,
          fee_amount: req.fee_amount,
          payment_status: req.payment_status,
          created_at: req.created_at,
          updated_at: req.updated_at,
          requestor_name: composeFullName({
            given_name: req.requestor_given_name,
            middle_name: req.requestor_middle_name,
            last_name: req.requestor_last_name,
            name_suffix: req.requestor_name_suffix,
          }),
          requestor_email: req.requestor_email,
          requestor_school_id: req.requestor_school_id,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
