// src/app/api/portal/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types, offices, clearance_tasks, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { getSlaStatus } from '@/lib/server_utils';

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
        release_mode: document_requests.release_mode,
        additional_notes: document_requests.additional_notes,
        status: document_requests.status,
        fee_amount: document_requests.fee_amount,
        payment_status: document_requests.payment_status,
        payment_proof_path: document_requests.payment_proof_path,
        sla_due_at: document_requests.sla_due_at,
        created_at: document_requests.created_at,
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

    const tasks = await db
      .select({
        office_name: offices.name,
        status: clearance_tasks.status,
        sequence_order: clearance_tasks.sequence_order,
        remarks: clearance_tasks.remarks,
        cleared_at: clearance_tasks.cleared_at,
        cleared_by: users.full_name,
      })
      .from(clearance_tasks)
      .innerJoin(offices, eq(clearance_tasks.office_id, offices.id))
      .leftJoin(users, eq(clearance_tasks.cleared_by, users.id))
      .where(eq(clearance_tasks.request_id, req.id))
      .orderBy(clearance_tasks.sequence_order);

    const slaStatus = req.sla_due_at ? getSlaStatus(req.created_at, req.sla_due_at) : 'OnTrack';

    return NextResponse.json(
      {
        request: {
          tracking_number: req.tracking_number,
          document_type: req.document_type,
          handling_pattern: req.handling_pattern,
          issuing_office: req.issuing_office,
          purpose: req.purpose,
          copies: req.copies,
          release_mode: req.release_mode,
          additional_notes: req.additional_notes,
          status: req.status,
          fee_amount: req.fee_amount,
          payment_status: req.payment_status,
          payment_proof_path: req.payment_proof_path,
          sla_due_at: req.sla_due_at,
          sla_status: slaStatus,
          created_at: req.created_at,
          clearance_tasks: tasks,
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
