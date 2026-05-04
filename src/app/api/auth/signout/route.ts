import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { getRefreshToken, clearAuthCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshToken(request);

    if (refreshToken) {
      await db.delete(sessions).where(eq(sessions.token, refreshToken));
    }

    await clearAuthCookies();

    return NextResponse.json({ message: 'Signed out successfully' }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
