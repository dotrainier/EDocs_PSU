// src/lib/session.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/db';
import { users, roles, office_staff, offices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { composeFullName } from '@/lib/user-name';

export type SessionUser = {
  id: string;
  fullName: string;
  firstName: string;
  schoolId: string | null;
  role: string;
  studentType: string | null;
  officeId: string | null;
  initials: string;
  officeCode: string;
};

export async function requireSession(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('edocs_access')?.value ?? null;
  const payload = accessToken ? await verifyAccessToken(accessToken) : null;

  if (!payload) redirect('/signin');

  const result = await db
    .select({
      id: users.id,
      given_name: users.given_name,
      middle_name: users.middle_name,
      last_name: users.last_name,
      name_suffix: users.name_suffix,
      school_id: users.school_id,
      student_type: users.student_type,
      role_name: roles.name,
      office_id: office_staff.office_id,
      office_code: offices.code,
    })
    .from(users)
    .innerJoin(roles, eq(users.role_id, roles.id))
    .leftJoin(office_staff, eq(office_staff.user_id, users.id))
    .leftJoin(offices, eq(offices.id, office_staff.office_id))
    .where(eq(users.id, payload.userId))
    .limit(1);

  const user = result[0];
  if (!user) redirect('/signin');

  const fullName = composeFullName(user);
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return {
    id: user.id,
    fullName,
    firstName: user.given_name ?? fullName.split(' ')[0],
    schoolId: user.school_id,
    role: user.role_name,
    studentType: user.student_type,
    officeId: user.office_id ? String(user.office_id) : null,
    initials,
    officeCode: user.office_code ?? '',
  };
}
