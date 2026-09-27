// src/app/api/admin/assistant/route.ts
//
// Admin Assistant chat endpoint (Admin only). Stateless: the client sends the
// text-only conversation for the current page visit alongside each new
// message. Nothing is persisted, and the assistant's toolset is read-only
// (see src/lib/admin-assistant.ts).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccessTokenPayload } from '@/lib/auth';
import { askAdminAssistant, toolLabel } from '@/lib/admin-assistant';

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
    if (session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // Gemini requires history to start with a user turn and alternate roles.
    const { message, history } = parsed.data;
    const validHistory = history.every((t, i) => t.role === (i % 2 === 0 ? 'user' : 'model'));
    if (!validHistory) {
      return NextResponse.json({ message: 'Invalid conversation history' }, { status: 400 });
    }

    const result = await askAdminAssistant(history, message);
    return NextResponse.json({ ...result, toolsUsed: result.toolsUsed.map(toolLabel) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
