import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccessTokenPayload } from '@/lib/auth';
import { askStaffAssistant, staffToolLabel } from '@/lib/staff-assistant';

const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().min(1).max(4000) }))
    .max(40)
    .default([]),
});

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const { message, history } = parsed.data;
    const validHistory = history.every((t, i) => t.role === (i % 2 === 0 ? 'user' : 'model'));
    if (!validHistory) {
      return NextResponse.json({ message: 'Invalid conversation history' }, { status: 400 });
    }

    const result = await askStaffAssistant(
      { userId: session.userId, role: session.role, officeId: Number(session.officeId) },
      history,
      message,
    );
    return NextResponse.json({ ...result, toolsUsed: result.toolsUsed.map(staffToolLabel) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
