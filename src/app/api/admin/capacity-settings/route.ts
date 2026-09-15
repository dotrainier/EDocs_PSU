import { NextResponse } from 'next/server';
import { db } from '@/db';
import { offices, document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

async function requireAdmin(request: Request) {
  const session = await getAccessTokenPayload(request);
  if (!session) return { error: NextResponse.json({ message: 'Unauthorised' }, { status: 401 }) };
  if (session.role !== 'Admin') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

// ── GET /api/admin/capacity-settings — current values behind the live
// expected-date calculation (see src/lib/expected-date.ts) ─────────────────────

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const officeRows = await db
      .select({
        id: offices.id,
        name: offices.name,
        code: offices.code,
        daily_capacity: offices.daily_capacity,
      })
      .from(offices)
      .orderBy(offices.name);

    const documentTypeRows = await db
      .select({
        id: document_types.id,
        name: document_types.name,
        code: document_types.code,
        capacity_weight: document_types.capacity_weight,
      })
      .from(document_types)
      .orderBy(document_types.name);

    return NextResponse.json(
      { offices: officeRows, documentTypes: documentTypeRows },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
