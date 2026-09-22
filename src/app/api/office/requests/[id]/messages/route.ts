// src/app/api/office/requests/[id]/messages/route.ts
//
// Request-scoped message thread — the staff side. Authorization mirrors the
// request-detail GET route: OfficeStaff/OfficeHead with a clearance_tasks
// row for this request matching their office — any office ever involved,
// not just the currently-pending one.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, clearance_tasks, request_messages, users } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';
import { createNotification } from '@/lib/notification';

async function findRequestByTracking(id: string) {
  const rows = await db
    .select({
      id: document_requests.id,
      tracking_number: document_requests.tracking_number,
      user_id: document_requests.user_id,
    })
    .from(document_requests)
    .where(eq(document_requests.tracking_number, id))
    .limit(1);

  return rows[0] ?? null;
}

async function officeIsInvolved(requestId: string, officeId: number) {
  const taskRows = await db
    .select({ office_id: clearance_tasks.office_id })
    .from(clearance_tasks)
    .where(and(eq(clearance_tasks.request_id, requestId), eq(clearance_tasks.office_id, officeId)))
    .limit(1);
  return taskRows.length > 0;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const { id } = await params;
    const req = await findRequestByTracking(id);
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (!(await officeIsInvolved(req.id, Number(session.officeId)))) {
      return NextResponse.json(
        { message: 'Your office is not involved in this request' },
        { status: 403 },
      );
    }

    // Viewing the thread from the staff side reads every message the
    // student sent — regardless of which staff member happens to open it.
    await db
      .update(request_messages)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(request_messages.request_id, req.id),
          eq(request_messages.sender_id, req.user_id),
          isNull(request_messages.read_at),
        ),
      );

    const rows = await db
      .select({
        id: request_messages.id,
        body: request_messages.body,
        created_at: request_messages.created_at,
        sender_id: request_messages.sender_id,
        sender_given_name: users.given_name,
        sender_middle_name: users.middle_name,
        sender_last_name: users.last_name,
        sender_name_suffix: users.name_suffix,
      })
      .from(request_messages)
      .innerJoin(users, eq(request_messages.sender_id, users.id))
      .where(eq(request_messages.request_id, req.id))
      .orderBy(asc(request_messages.created_at));

    const messages = rows.map((m) => ({
      id: m.id,
      body: m.body,
      created_at: m.created_at,
      is_staff: m.sender_id !== req.user_id,
      sender_name: composeFullName({
        given_name: m.sender_given_name,
        middle_name: m.sender_middle_name,
        last_name: m.sender_last_name,
        name_suffix: m.sender_name_suffix,
      }),
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

const postSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const { id } = await params;
    const req = await findRequestByTracking(id);
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (!(await officeIsInvolved(req.id, Number(session.officeId)))) {
      return NextResponse.json(
        { message: 'Your office is not involved in this request' },
        { status: 403 },
      );
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid message' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(request_messages)
      .values({ request_id: req.id, sender_id: session.userId, body: parsed.data.body })
      .returning();

    try {
      const preview =
        parsed.data.body.length > 140 ? `${parsed.data.body.slice(0, 140)}…` : parsed.data.body;
      await createNotification({
        userId: req.user_id,
        title: `New message on ${req.tracking_number}`,
        message: preview,
        type: 'new_message',
        requestId: req.id,
      });
    } catch {
      // notification errors are non-critical — the message already persisted
    }

    return NextResponse.json({ message: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
