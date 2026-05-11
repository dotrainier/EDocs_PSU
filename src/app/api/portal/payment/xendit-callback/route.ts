import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests } from '@/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tracking = searchParams.get('tracking');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!tracking) {
    return NextResponse.redirect(`${appUrl}/dashboard`);
  }

  try {
    await db
      .update(document_requests)
      .set({ payment_status: 'Paid', updated_at: new Date() })
      .where(eq(document_requests.tracking_number, tracking));
  } catch {
    // best-effort; redirect regardless
  }

  return NextResponse.redirect(`${appUrl}/requests/${tracking}?payment=success`);
}
