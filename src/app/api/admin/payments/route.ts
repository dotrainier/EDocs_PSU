// src/app/api/admin/payments/route.ts
//
// Real payment reporting for the admin Payments page (Admin only) — a live
// snapshot, not a historical trend. There isn't enough clean history yet to
// build a trend honestly: every seeded document_requests row shares the same
// created_at (a single seed batch, one distinct day) and there are zero
// PAYMENT_CONFIRMED audit events (every currently-"Paid" row was seeded
// directly with payment_status = 'Paid', not through the real payment
// confirmation flow). Same standard as the Office Dashboard backlog chart
// (a live snapshot, explicitly not a trend) and the Audit Log page.
//
// Sums use document_requests.fee_amount (the fee snapshotted onto the
// request at submission time), not document_types.fee_amount — so a later
// fee change on a document type never retroactively changes what an old
// paid/unpaid request is reported as owing.
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

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

    return NextResponse.json({ totals, byDocumentType }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
