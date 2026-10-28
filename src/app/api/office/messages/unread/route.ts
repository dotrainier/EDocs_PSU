import { NextResponse } from 'next/server';
import { getAccessTokenPayload } from '@/lib/auth';
import { countUnreadStaffMessages } from '@/lib/staff-messages';

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const unread = await countUnreadStaffMessages(session.userId);
    return NextResponse.json({ unread }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
