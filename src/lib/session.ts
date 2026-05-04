// src/lib/session.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/db';
import { users, roles, office_staff } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type SessionUser = {
  id: string;
  fullName: string;
  firstName: string;
  schoolId: string;
  role: string;
  officeId: string | null;
  initials: string;
};

export async function requireSession(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('edocs_access')?.value ?? null;
  const payload = accessToken ? await verifyAccessToken(accessToken) : null;

  if (!payload) redirect('/signin');

  const result = await db
    .select({
      id: users.id,
      full_name: users.full_name,
      school_id: users.school_id,
      role_name: roles.name,
      office_id: office_staff.office_id,
    })
    .from(users)
    .innerJoin(roles, eq(users.role_id, roles.id))
    .leftJoin(office_staff, eq(office_staff.user_id, users.id))
    .where(eq(users.id, payload.userId))
    .limit(1);

  const user = result[0];
  if (!user) redirect('/signin');

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return {
    id: user.id,
    fullName: user.full_name,
    firstName: user.full_name.split(' ')[0],
    schoolId: user.school_id,
    role: user.role_name,
    officeId: user.office_id ? String(user.office_id) : null,
    initials,
  };
}
