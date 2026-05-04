import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────────────

const AUTH_CONFIG = {
  accessTokenExpiry: '20m',
  refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  refreshTokenExpirySeconds: 7 * 24 * 60 * 60, // 7 days
  accessTokenExpirySeconds: 60 * 20, // 20 minutes
  accessCookieName: 'edocs_access',
  refreshCookieName: 'edocs_refresh',
} as const;

export type UserRole =
  | 'Student'
  | 'Faculty'
  | 'NonTeachingStaff'
  | 'OfficeStaff'
  | 'OfficeHead'
  | 'Admin';

export type AccessTokenPayload = {
  userId: string;
  role: UserRole;
  officeId: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

// ─── Access Token ─────────────────────────────────────────────────────────────

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.accessTokenExpiry)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export function generateRefreshToken(): string {
  return nanoid(64);
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + AUTH_CONFIG.refreshTokenExpiryMs);
}

// ─── Cookie Helpers ──────────────────────────────────────────────────────────

// Used in API routes (Node.js runtime) after login / refresh
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_CONFIG.accessCookieName, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_CONFIG.accessTokenExpirySeconds,
  });

  cookieStore.set(AUTH_CONFIG.refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_CONFIG.refreshTokenExpirySeconds,
  });
}

// Used in API routes for logout
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.accessCookieName);
  cookieStore.delete(AUTH_CONFIG.refreshCookieName);
}

// ─── Read Helpers (for API routes — Node.js runtime) ─────────────────────────

// Gets the verified access token payload from the cookie
// Use this in protected API routes to get the current user
export async function getAccessTokenPayload(request: Request): Promise<AccessTokenPayload | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const token = parseCookieValue(cookieHeader, AUTH_CONFIG.accessCookieName);
  if (!token) return null;
  return verifyAccessToken(token);
}

// Gets the raw refresh token string from the cookie
// Use this only in /api/auth/refresh and /api/auth/signout
export function getRefreshToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return parseCookieValue(cookieHeader, AUTH_CONFIG.refreshCookieName);
}

// ─── Read Helpers (for proxy.ts — Edge runtime) ───────────────────────────────

// Used only in proxy.ts — reads from NextRequest cookies
export function getAccessTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.accessCookieName)?.value ?? null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.refreshCookieName)?.value ?? null;
}

// ─── Response Cookie Helpers (for proxy.ts redirect responses) ───────────────

// Sets cookies on a NextResponse — needed when middleware creates a redirect
export function setAuthCookiesOnResponse(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set(AUTH_CONFIG.accessCookieName, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_CONFIG.accessTokenExpirySeconds,
  });

  response.cookies.set(AUTH_CONFIG.refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_CONFIG.refreshTokenExpirySeconds,
  });
}

export function clearAuthCookiesOnResponse(response: NextResponse): void {
  response.cookies.delete(AUTH_CONFIG.accessCookieName);
  response.cookies.delete(AUTH_CONFIG.refreshCookieName);
}

// ─── Internal helper ─────────────────────────────────────────────────────────

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}
