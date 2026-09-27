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
// The query lives in getPaymentReport() (src/lib/admin-reports.ts), shared
// with the Admin Assistant's toolset.
import { NextResponse } from 'next/server';
import { getAccessTokenPayload } from '@/lib/auth';
import { getPaymentReport } from '@/lib/admin-reports';

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(await getPaymentReport(), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
