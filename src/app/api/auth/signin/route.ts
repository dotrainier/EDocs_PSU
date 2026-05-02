// src/app/api/auth/login/route.ts
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
  type UserRole,
} from '@/lib/auth';

const signinSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
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
        full_name: users.full_name,
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
      officeId: String(user.office_id) ?? null,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await db.insert(sessions).values({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json(
      {
        message: 'Login successful',
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
