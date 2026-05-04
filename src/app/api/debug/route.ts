// src/app/api/debug/route.ts  ← delete this file after debugging
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allUsers = await db
    .select({
      id: users.id,
      school_id: users.school_id,
      email: users.email,
      status: users.status,
      role_id: users.role_id,
      role_name: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.role_id, roles.id));

  return NextResponse.json({ count: allUsers.length, users: allUsers });
}
