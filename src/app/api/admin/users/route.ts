import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

// ── GET /api/admin/users — list every account (Admin only) ─────────────────────

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const rows = await db
      .select({
        id: users.id,
        full_name: users.full_name,
        school_id: users.school_id,
        email: users.email,
        role_name: roles.name,
        status: users.status,
        student_type: users.student_type,
        verification_status: users.verification_status,
        created_at: users.created_at,
      })
      .from(users)
      .innerJoin(roles, eq(users.role_id, roles.id))
      .orderBy(desc(users.created_at));

    return NextResponse.json({ users: rows }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
