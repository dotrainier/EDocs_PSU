import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { document_requests } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

const schema = z.object({
  trackingNumber: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const { trackingNumber } = parsed.data;

    const rows = await db
      .select({ id: document_requests.id, user_id: document_requests.user_id, payment_status: document_requests.payment_status })
      .from(document_requests)
      .where(eq(document_requests.tracking_number, trackingNumber))
      .limit(1);

    const req = rows[0];
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (req.user_id !== session.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (req.payment_status === 'Paid') {
      return NextResponse.json({ message: 'Already paid' }, { status: 409 });
    }

    await db
      .update(document_requests)
      .set({ payment_status: 'Paid', updated_at: new Date() })
      .where(eq(document_requests.id, req.id));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
