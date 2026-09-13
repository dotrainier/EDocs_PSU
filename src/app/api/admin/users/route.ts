import { NextResponse } from 'next/server';
import { desc, eq, and, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { users, roles, courses } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';

const VALID_VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'];

// ── GET /api/admin/users — list every account (Admin only) ─────────────────────
// Optional ?verification_status=pending|approved|rejected to narrow the list —
// used by the Pending Registrations queue so it doesn't have to filter client-side.

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const verificationParam = searchParams.get('verification_status');

    const conditions: SQL[] = [];
    if (verificationParam && VALID_VERIFICATION_STATUSES.includes(verificationParam)) {
      conditions.push(eq(users.verification_status, verificationParam));
    }

    const rows = await db
      .select({
        id: users.id,
        given_name: users.given_name,
        middle_name: users.middle_name,
        last_name: users.last_name,
        name_suffix: users.name_suffix,
        school_id: users.school_id,
        email: users.email,
        role_name: roles.name,
        status: users.status,
        student_type: users.student_type,
        year_level: users.year_level,
        year_graduated: users.year_graduated,
        course_name: courses.name,
        course_major: courses.major,
        course_code: courses.code,
        course_other_note: users.course_other_note,
        verification_status: users.verification_status,
        created_at: users.created_at,
      })
      .from(users)
      .innerJoin(roles, eq(users.role_id, roles.id))
      .leftJoin(courses, eq(users.course_id, courses.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.created_at));

    const usersWithFullName = rows.map((row) => ({ ...row, full_name: composeFullName(row) }));

    return NextResponse.json({ users: usersWithFullName }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
