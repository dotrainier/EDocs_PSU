import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { courses } from '@/db/schema';

// ── GET /api/courses — public catalog of active courses, used by the registration form ──

export async function GET() {
  try {
    const rows = await db
      .select({
        id: courses.id,
        name: courses.name,
        major: courses.major,
        code: courses.code,
      })
      .from(courses)
      .where(eq(courses.is_active, true))
      .orderBy(courses.name, courses.major);

    return NextResponse.json({ courses: rows }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
