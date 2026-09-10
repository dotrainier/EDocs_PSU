import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { isUniqueViolation } from '@/lib/db-errors';

const updateCourseSchema = z.object({
  name: z.string().trim().min(1, 'Program name is required').optional(),
  major: z.string().trim().nullable().optional(),
  code: z.string().trim().min(1, 'Code is required').optional(),
  is_active: z.boolean().optional(),
});

async function requireAdmin(request: Request) {
  const session = await getAccessTokenPayload(request);
  if (!session) return { error: NextResponse.json({ message: 'Unauthorised' }, { status: 401 }) };
  if (session.role !== 'Admin') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

// ── PATCH /api/admin/courses/[id] — update fields and/or toggle is_active ──────

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const courseId = Number(id);
    if (!Number.isInteger(courseId)) {
      return NextResponse.json({ message: 'Invalid course id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid course details' },
        { status: 400 },
      );
    }

    // Only touch fields actually present in the request body — a PATCH that only
    // toggles is_active must not clear name/major/code, and vice versa.
    const updateData: Partial<typeof courses.$inferInsert> = {};
    if ('name' in body) updateData.name = parsed.data.name;
    if ('major' in body) updateData.major = parsed.data.major?.trim() ? parsed.data.major : null;
    if ('code' in body) updateData.code = parsed.data.code;
    if ('is_active' in body) updateData.is_active = parsed.data.is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes provided' }, { status: 400 });
    }

    const [updated] = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, courseId))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course: updated }, { status: 200 });
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
