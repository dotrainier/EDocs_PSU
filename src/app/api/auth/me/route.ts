import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = await getAccessTokenPayload(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ id: payload.userId, role: payload.role });
}