import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { users, sessions, roles, office_staff } from '@/db/schema';
import {
  signAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  setAuthCookies,
} from '@/lib/auth';
import type { UserRole } from '@/types/user.type';
import { composeFullName } from '@/lib/user-name';

const signinSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required').trim(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const result = await db
      .select({
        id: users.id,
        school_id: users.school_id,
        email: users.email,
        password_hash: users.password_hash,
        status: users.status,
        verification_status: users.verification_status,
        given_name: users.given_name,
        middle_name: users.middle_name,
        last_name: users.last_name,
        name_suffix: users.name_suffix,
        role_id: users.role_id,
        role_name: roles.name,
        office_id: office_staff.office_id,
      })
      .from(users)
      .leftJoin(office_staff, eq(users.id, office_staff.user_id))
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(or(eq(users.email, username), eq(users.school_id, username)))
      .limit(1);

    const user = result[0];

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    if (user.verification_status === 'pending') {
      return NextResponse.json(
        { message: 'Your registration is still pending review. Please wait for admin approval before signing in.' },
        { status: 403 },
      );
    }

    if (user.verification_status === 'rejected') {
      return NextResponse.json(
        {
          message:
            'Your registration was not approved. Please contact the administrator for more information.',
        },
        { status: 403 },
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { message: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role_name as UserRole,
      officeId: user.office_id ? String(user.office_id) : null,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await db.insert(sessions).values({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });

    await setAuthCookies(accessToken, refreshToken);

    const full_name = composeFullName(user);

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          full_name,
          email: user.email,
          role: user.role_name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[signin] Unexpected error:', errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
