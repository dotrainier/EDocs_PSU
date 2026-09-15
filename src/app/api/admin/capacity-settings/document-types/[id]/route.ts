import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

async function requireAdmin(request: Request) {
  const session = await getAccessTokenPayload(request);
  if (!session) return { error: NextResponse.json({ message: 'Unauthorised' }, { status: 401 }) };
  if (session.role !== 'Admin') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

// The raw capacity_weight multiplier is never exposed to the admin — the UI
// only offers a plain-language effort level, which maps to this fixed set of
// underlying values. Keep in sync with EFFORT_OPTIONS in the admin page.
const ALLOWED_WEIGHTS = [1, 2] as const;

const updateSchema = z.object({
  capacity_weight: z.union([z.literal(1), z.literal(2)]),
});

// ── PATCH /api/admin/capacity-settings/document-types/[id] — how much of an
// office's daily capacity this document type consumes per request ──────────────

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const documentTypeId = Number(id);
    if (!Number.isInteger(documentTypeId)) {
      return NextResponse.json({ message: 'Invalid document type id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            `Effort level must be one of: ${ALLOWED_WEIGHTS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(document_types)
      .set({ capacity_weight: parsed.data.capacity_weight })
      .where(eq(document_types.id, documentTypeId))
      .returning({ id: document_types.id, capacity_weight: document_types.capacity_weight });

    if (!updated) {
      return NextResponse.json({ message: 'Document type not found' }, { status: 404 });
    }

    return NextResponse.json({ documentType: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
