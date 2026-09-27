// src/app/api/admin/dashboard/route.ts
//
// Real, system-wide overview for the admin dashboard (Admin only). Every
// number here is a genuine query — no fabricated trends or counts. Where a
// stat is currently backed by only one office (OUR is the only office with
// any document type routed to it — see seed.document.ts), the response
// makes that explicit via `participatingOffices` instead of pretending the
// system spans more offices than it currently does.
//
// The queries themselves live in src/lib/admin-reports.ts, shared with the
// Admin Assistant's toolset.
import { NextResponse } from 'next/server';
import { getAccessTokenPayload } from '@/lib/auth';
import {
  getRegistrationFunnel,
  getRequestVolume,
  getCompletedToday,
  getParticipatingOffices,
  getCapacitySnapshot,
  getRecentActivity,
} from '@/lib/admin-reports';

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const [{ totalUsers, registrationFunnel }, volume, completedToday, participatingOffices] =
      await Promise.all([
        getRegistrationFunnel(),
        getRequestVolume(),
        getCompletedToday(),
        getParticipatingOffices(),
      ]);

    const [{ onTrack, overdue, officeBacklogs }, recentActivity] = await Promise.all([
      getCapacitySnapshot(participatingOffices),
      getRecentActivity(12),
    ]);

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalRequests: volume.totalRequests,
          pendingRequests: volume.pendingRequests,
          completedToday,
          onTrack,
          overdue,
        },
        registrationFunnel,
        requestsByStatus: volume.requestsByStatus,
        documentTypeVolume: volume.documentTypeVolume.slice(0, 5),
        participatingOffices,
        officeBacklogs,
        recentActivity,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Admin dashboard error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
