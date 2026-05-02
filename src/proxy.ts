import { NextResponse, type NextRequest } from 'next/server';
import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  verifyAccessToken,
  type UserRole,
} from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/verify'];
const AUTH_PATHS = ['/login', '/register'];

const FRONT_USER_ROLES: UserRole[] = ['Student', 'Faculty', 'NonTeachingStaff'];
const OFFICE_ROLES: UserRole[] = ['OfficeStaff', 'OfficeHead'];

function getDashboardByRole(role: UserRole): string {
  if (OFFICE_ROLES.includes(role)) return '/office/dashboard';
  if (role === 'Admin') return '/admin/dashboard';
  return '/dashboard';
}

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

  // 5. Access token missing or expired → check for refresh token
  if (!payload) {
    const refreshToken = getRefreshTokenFromRequest(request);

    if (refreshToken) {
      // Silent refresh — redirect to refresh endpoint, come back after
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      refreshUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(refreshUrl);
    }

    // No refresh token either → send to login
    const loginUrl = new URL('/login', request.url);
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
