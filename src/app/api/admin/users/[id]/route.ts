import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { render } from 'react-email';
import { db } from '@/db';
import { users, roles, courses } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { sendMail } from '@/lib/lib-mailer';
import { RegistrationApprovedEmail } from '@/email-templates/RegistrationApproved';
import { RegistrationRejectedEmail } from '@/email-templates/RegistrationRejected';

async function requireAdmin(request: Request) {
  const session = await getAccessTokenPayload(request);
  if (!session) return { error: NextResponse.json({ message: 'Unauthorised' }, { status: 401 }) };
  if (session.role !== 'Admin') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

// ── GET /api/admin/users/[id] — full profile for the details view ──────────────

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const [row] = await db
      .select({
        id: users.id,
        full_name: users.full_name,
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
        course_other_note: users.course_other_note,
        verification_status: users.verification_status,
        created_at: users.created_at,
      })
      .from(users)
      .innerJoin(roles, eq(users.role_id, roles.id))
      .leftJoin(courses, eq(users.course_id, courses.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: row }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

const updateSchema = z.object({
  verification_status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// ── PATCH /api/admin/users/[id] — approve / reject a registration ──────────────

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 },
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ message: 'No changes provided' }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        verification_status: users.verification_status,
      });

    if (!updated) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Fire-and-forget: the approve/reject email must never block the response.
    if (
      (updated.verification_status === 'approved' || updated.verification_status === 'rejected') &&
      updated.email
    ) {
      void (async () => {
        try {
          const isApproved = updated.verification_status === 'approved';
          const html = await render(
            isApproved
              ? RegistrationApprovedEmail({
                  userName: updated.full_name,
                  signinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
                })
              : RegistrationRejectedEmail({ userName: updated.full_name }),
          );

          await sendMail({
            to: updated.email,
            subject: isApproved
              ? 'Your e-Docs registration has been approved'
              : 'An update on your e-Docs registration',
            html,
          });
        } catch {
          // email errors are non-critical — the verification decision already persisted
        }
      })();
    }

    return NextResponse.json(
      { user: { id: updated.id, verification_status: updated.verification_status } },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
