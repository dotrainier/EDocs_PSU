import { NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/db';
import { sessions, users, roles, office_staff } from '@/db/schema';
import {
  signAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  getRefreshToken,
  clearAuthCookies,
  setAuthCookies,
  type UserRole,
} from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const next = new URL(request.url).searchParams.get('next') ?? '/dashboard';

    const refreshToken = getRefreshToken(request);

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const result = await db
      .select({
        session_id: sessions.id,
        user_id: users.id,
        full_name: users.full_name,
        status: users.status,
        role_name: roles.name,
        office_id: office_staff.office_id,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.user_id, users.id))
      .innerJoin(roles, eq(users.role_id, roles.id))
      .leftJoin(office_staff, eq(office_staff.user_id, users.id))
      .where(and(eq(sessions.token, refreshToken), gt(sessions.expires_at, new Date())))
      .limit(1);

    const session = result[0];

    if (!session) {
      await clearAuthCookies();
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    if (session.status !== 'active') {
      await db.delete(sessions).where(eq(sessions.id, session.session_id));
      await clearAuthCookies();
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const newAccessToken = await signAccessToken({
      userId: session.user_id,
      role: session.role_name as UserRole,
      officeId: String(session.office_id) ?? null,
    });

    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = getRefreshTokenExpiry();

    await db.delete(sessions).where(eq(sessions.id, session.session_id));
    await db.insert(sessions).values({
      user_id: session.user_id,
      token: newRefreshToken,
      expires_at: newExpiresAt,
    });

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
