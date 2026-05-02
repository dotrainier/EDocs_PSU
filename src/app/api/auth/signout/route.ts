import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { getRefreshToken, clearAuthCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. Read refresh token from cookie
    const refreshToken = getRefreshToken(request);

    // 2. Delete session row from DB if token exists
    if (refreshToken) {
      await db.delete(sessions).where(eq(sessions.token, refreshToken));
    }

    // 3. Clear both cookies regardless
    await clearAuthCookies();

    return NextResponse.json({ message: 'Signed out successfully' }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
