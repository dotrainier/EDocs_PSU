import { NextResponse, type NextRequest } from 'next/server';
import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  verifyAccessToken,
} from '@/lib/auth';
import { getDashboardByRole } from '@/lib/utils';
import type { UserRole } from '@/types/user.type';

const PUBLIC_PATHS = ['/', '/verify'];
const AUTH_PATHS = ['/signin', '/register'];

const FRONT_USER_ROLES: UserRole[] = ['Student'];
const OFFICE_ROLES: UserRole[] = ['OfficeStaff', 'OfficeHead'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // 2. Always allow API routes — each handler checks session itself
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 3. Read access token
  const accessToken = getAccessTokenFromRequest(request);
  const payload = accessToken ? await verifyAccessToken(accessToken) : null;

  // 4. Handle auth pages (/login, /register)
  //    If already logged in → redirect to their dashboard
  if (AUTH_PATHS.includes(pathname)) {
    if (payload) {
      return NextResponse.redirect(new URL(getDashboardByRole(payload.role), request.url));
    }
    return NextResponse.next();
  }

  // 5. Access token missing or expired → only protect known routes
  if (!payload) {
    const isProtectedPath =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/request') ||
      pathname.startsWith('/history') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/office') ||
      pathname.startsWith('/admin');

    // Unknown path + no session → just pass through (will 404 normally)
    if (!isProtectedPath) {
      return NextResponse.next();
    }

    const refreshToken = getRefreshTokenFromRequest(request);

    if (refreshToken) {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      refreshUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(refreshUrl);
    }

    const loginUrl = new URL('/signin', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Token is valid — enforce role-based access
  const { role, officeId } = payload;

  // /dashboard, /request/*, /history, /profile → front users only
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/request') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/profile')
  ) {
    if (!FRONT_USER_ROLES.includes(role)) {
      return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
    }
    return NextResponse.next();
  }

  // /office/* → OfficeStaff or OfficeHead only + must have officeId
  if (pathname.startsWith('/office')) {
    if (!OFFICE_ROLES.includes(role) || !officeId) {
      return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
    }
    return NextResponse.next();
  }

  // /admin/* → Admin only
  if (pathname.startsWith('/admin')) {
    if (role !== 'Admin') {
      return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
    }
    return NextResponse.next();
  }

  // 7. Any other path — allow through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
