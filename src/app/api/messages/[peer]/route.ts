import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccessTokenPayload, type AccessTokenPayload } from '@/lib/auth';
import {
  ALL_STAFF_CHANNEL,
  ALL_STAFF_CHANNEL_NAME,
  ALL_STAFF_CHANNEL_SUBTITLE,
  canUseStaffChat,
  findActiveStaff,
  getStaffThread,
  sendStaffMessage,
  staffSubtitle,
} from '@/lib/staff-messages';

const peerSchema = z.union([z.literal(ALL_STAFF_CHANNEL), z.uuid()]);

const postSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

type PeerResolution =
  | { ok: true; peer: string; name: string; subtitle: string }
  | { ok: false; response: NextResponse };

async function resolvePeer(session: AccessTokenPayload, rawPeer: string): Promise<PeerResolution> {
  const parsed = peerSchema.safeParse(rawPeer);
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ message: 'Invalid conversation' }, { status: 400 }) };
  }

  const peer = parsed.data;
  if (peer === ALL_STAFF_CHANNEL) {
    return { ok: true, peer, name: ALL_STAFF_CHANNEL_NAME, subtitle: ALL_STAFF_CHANNEL_SUBTITLE };
  }
  if (peer === session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ message: "You can't message yourself" }, { status: 400 }),
    };
  }

  const member = await findActiveStaff(peer);
  if (!member) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Staff member not found' }, { status: 404 }),
    };
  }
  return { ok: true, peer, name: member.name, subtitle: staffSubtitle(member) };
}

export async function GET(request: Request, { params }: { params: Promise<{ peer: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (!canUseStaffChat(session.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const resolved = await resolvePeer(session, (await params).peer);
    if (!resolved.ok) return resolved.response;

    const messages = await getStaffThread(session.userId, resolved.peer);
    return NextResponse.json(
      {
        conversation: {
          id: resolved.peer,
          kind: resolved.peer === ALL_STAFF_CHANNEL ? 'channel' : 'direct',
          name: resolved.name,
          subtitle: resolved.subtitle,
        },
        messages,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ peer: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }
    if (!canUseStaffChat(session.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const resolved = await resolvePeer(session, (await params).peer);
    if (!resolved.ok) return resolved.response;

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid message' },
        { status: 400 },
      );
    }

    const created = await sendStaffMessage(session.userId, resolved.peer, parsed.data.body);
    return NextResponse.json({ message: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
