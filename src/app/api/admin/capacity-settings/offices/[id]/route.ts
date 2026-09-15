import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { offices } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

async function requireAdmin(request: Request) {
  const session = await getAccessTokenPayload(request);
  if (!session) return { error: NextResponse.json({ message: 'Unauthorised' }, { status: 401 }) };
  if (session.role !== 'Admin') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

// null clears the value back to "not set yet" — offices without a configured
// daily_capacity fall back to a default inside calculateExpectedDate().
const updateSchema = z.object({
  daily_capacity: z.union([z.number().int().positive(), z.null()]),
});

// ── PATCH /api/admin/capacity-settings/offices/[id] — how many requests this
// office can process per day (drives the live expected-date calculation) ───────

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const officeId = Number(id);
    if (!Number.isInteger(officeId)) {
      return NextResponse.json({ message: 'Invalid office id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid daily capacity' },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(offices)
      .set({ daily_capacity: parsed.data.daily_capacity })
      .where(eq(offices.id, officeId))
      .returning({ id: offices.id, daily_capacity: offices.daily_capacity });

    if (!updated) {
      return NextResponse.json({ message: 'Office not found' }, { status: 404 });
    }

    return NextResponse.json({ office: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
