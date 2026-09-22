// src/app/api/portal/requests/[id]/messages/route.ts
//
// Request-scoped message thread — the student's side. Authorization mirrors
// every other portal request-scoped route: the request must belong to the
// signed-in student (eq(document_requests.user_id, session.userId)).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '@/db';
import {
  document_requests,
  document_types,
  clearance_tasks,
  office_staff,
  request_messages,
  users,
} from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { composeFullName } from '@/lib/user-name';
import { createNotification } from '@/lib/notification';

async function findRequestByTracking(id: string) {
  const rows = await db
    .select({
      id: document_requests.id,
      tracking_number: document_requests.tracking_number,
      user_id: document_requests.user_id,
      document_type_id: document_requests.document_type_id,
    })
    .from(document_requests)
    .where(eq(document_requests.tracking_number, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const req = await findRequestByTracking(id);
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (req.user_id !== session.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Viewing the thread as its owner reads every message staff have sent.
    await db
      .update(request_messages)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(request_messages.request_id, req.id),
          ne(request_messages.sender_id, req.user_id),
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

    const { id } = await params;
    const req = await findRequestByTracking(id);
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    if (req.user_id !== session.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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

    // Notify every office currently or previously involved in this request —
    // same "involved offices" set the request-submission fan-out already
    // uses: the issuing office, plus every office with a clearance task.
    // Awaited (not fire-and-forget) since this is just fast DB writes, unlike
    // the submission flow's notification step which also sends email.
    try {
      const docTypeRows = await db
        .select({
          issuing_office_id: document_types.issuing_office_id,
          requires_clearance: document_types.requires_clearance,
        })
        .from(document_types)
        .where(eq(document_types.id, req.document_type_id))
        .limit(1);
      const docType = docTypeRows[0];

      if (docType) {
        const involvedOfficeIds = new Set<number>([docType.issuing_office_id]);
        if (docType.requires_clearance) {
          const tasks = await db
            .select({ office_id: clearance_tasks.office_id })
            .from(clearance_tasks)
            .where(eq(clearance_tasks.request_id, req.id));
          tasks.forEach((t) => involvedOfficeIds.add(t.office_id));
        }

        const staffRows = await db
          .select({ user_id: office_staff.user_id })
          .from(office_staff)
          .where(inArray(office_staff.office_id, [...involvedOfficeIds]));
        const uniqueStaffIds = Array.from(new Set(staffRows.map((r) => r.user_id)));

        const preview =
          parsed.data.body.length > 140 ? `${parsed.data.body.slice(0, 140)}…` : parsed.data.body;

        await Promise.all(
          uniqueStaffIds.map((staffId) =>
            createNotification({
              userId: staffId,
              title: `New message on ${req.tracking_number}`,
              message: preview,
              type: 'new_message',
              requestId: req.id,
            }),
          ),
        );
      }
    } catch {
      // notification errors are non-critical — the message already persisted
    }

    return NextResponse.json({ message: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
