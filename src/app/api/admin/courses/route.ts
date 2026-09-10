import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { isUniqueViolation } from '@/lib/db-errors';

const createCourseSchema = z.object({
  name: z.string().trim().min(1, 'Program name is required'),
  major: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  code: z.string().trim().min(1, 'Code is required'),
});

// ── GET /api/admin/courses — list every course (active + inactive) ─────────────

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
      .select()
      .from(courses)
      .orderBy(courses.name, courses.major);

    return NextResponse.json({ courses: rows }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ── POST /api/admin/courses — create a new course row ──────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid course details' },
        { status: 400 },
      );
    }

    const { name, major, code } = parsed.data;

    const [created] = await db
      .insert(courses)
      .values({ name, major: major ?? null, code, is_active: true })
      .returning();

    return NextResponse.json({ course: created }, { status: 201 });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { message: 'A course with this code already exists.' },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
