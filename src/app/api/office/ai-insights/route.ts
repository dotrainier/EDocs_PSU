import { NextResponse } from 'next/server';
import { getAccessTokenPayload } from '@/lib/auth';
import { generateDashboardInsights } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = await generateDashboardInsights(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
