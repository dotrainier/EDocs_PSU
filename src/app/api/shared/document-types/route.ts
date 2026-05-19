// src/app/api/document-types/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_types, offices, roles, document_type_roles } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const roleResult = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, session.role))
      .limit(1);

    const userRoleId = roleResult.length > 0 ? roleResult[0].id : null;

    if (!userRoleId) {
      return NextResponse.json({ docs: [] }, { status: 200 });
    }

    const allowedDocTypeIds = await db
      .select({ document_type_id: document_type_roles.document_type_id })
      .from(document_type_roles)
      .where(eq(document_type_roles.role_id, userRoleId));

    const ids = allowedDocTypeIds.map((r) => r.document_type_id);

    if (ids.length === 0) {
      return NextResponse.json({ docs: [] }, { status: 200 });
    }

    const docs = await db
      .select({
        id: document_types.id,
        name: document_types.name,
        code: document_types.code,
        description: document_types.description,
        fee_amount: document_types.fee_amount,
        sla_working_days: document_types.sla_working_days,
        requires_clearance: document_types.requires_clearance,
        handling_pattern: document_types.handling_pattern,
        period_type: document_types.period_type,
        issuing_office: offices.name,
      })
      .from(document_types)
      .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
      .where(eq(document_types.is_active, true))
      .orderBy(document_types.name);

    const filtered = docs.filter((d) => ids.includes(d.id));

    return NextResponse.json({ docs: filtered }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
