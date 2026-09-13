import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, or, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { users, roles, courses } from '@/db/schema';

const currentYear = new Date().getFullYear();

const baseFields = {
  given_name: z.string().trim().min(1, 'Given name is required'),
  middle_name: z.string().trim().min(1, 'Middle name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  name_suffix: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  course_id: z.coerce.number().int().positive().optional(),
  course_other_note: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  password: z.string().min(8, 'Password must be at least 8 characters'),
};

const studentIdSchema = z
  .string()
  .trim()
  .min(1, 'Student ID is required')
  .regex(/^\d{10}$/, 'Student ID must be a 10-digit number (e.g. 2022307072)');

const activeStudentSchema = z.object({
  student_type: z.literal('active'),
  student_id: studentIdSchema,
  ...baseFields,
  year_level: z.string().trim().min(1, 'Year level is required'),
  email: z.string().trim().min(1, 'School email address is required').email('Enter a valid email address'),
});

const alumniSchema = z.object({
  student_type: z.literal('alumni'),
  ...baseFields,
  year_graduated: z.coerce
    .number()
    .int('Year graduated must be a whole number')
    .min(1950, 'Enter a valid year')
    .max(currentYear, 'Year graduated cannot be in the future'),
  email: z.string().trim().min(1, 'Email address is required').email('Enter a valid email address'),
});

const registerSchema = z
  .discriminatedUnion('student_type', [activeStudentSchema, alumniSchema])
  .superRefine((data, ctx) => {
    const hasCourseId = data.course_id !== undefined;
    const hasOtherNote = !!data.course_other_note;
    if (hasCourseId === hasOtherNote) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a course, or choose "Other" and specify it',
        path: ['course_id'],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? 'Invalid registration details', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const [studentRole] = await db.select().from(roles).where(eq(roles.name, 'Student')).limit(1);

    if (!studentRole) {
      return NextResponse.json(
        { message: 'Registration is temporarily unavailable. Please contact the administrator.' },
        { status: 500 },
      );
    }

    const conflictConditions =
      data.student_type === 'active'
        ? or(eq(users.email, data.email), eq(users.school_id, data.student_id))
        : eq(users.email, data.email);

    const [existingUser] = await db.select({ id: users.id }).from(users).where(conflictConditions).limit(1);

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            data.student_type === 'active'
              ? 'An account with this email or Student ID already exists.'
              : 'An account with this email already exists.',
        },
        { status: 409 },
      );
    }

    if (data.course_id !== undefined) {
      const [selectedCourse] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.id, data.course_id), eq(courses.is_active, true)))
        .limit(1);

      if (!selectedCourse) {
        return NextResponse.json({ message: 'Selected course is not available.' }, { status: 400 });
      }
    }

    const password_hash = await bcrypt.hash(data.password, 12);

    await db.insert(users).values({
      email: data.email,
      password_hash,
      role_id: studentRole.id,
      given_name: data.given_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      name_suffix: data.name_suffix ?? null,
      course_id: data.course_id ?? null,
      course_other_note: data.course_other_note ?? null,
      student_type: data.student_type,
      school_id: data.student_type === 'active' ? data.student_id : null,
      year_level: data.student_type === 'active' ? data.year_level : null,
      year_graduated: data.student_type === 'alumni' ? data.year_graduated : null,
      verification_status: 'pending',
    });

    return NextResponse.json(
      {
        message:
          'Your registration has been submitted and is pending review. You will be able to sign in once an administrator approves your account.',
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[register] Unexpected error:', errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
