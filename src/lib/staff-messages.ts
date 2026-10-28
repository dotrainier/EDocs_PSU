import { and, asc, desc, eq, exists, gt, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { offices, office_staff, roles, staff_channel_reads, staff_messages, users } from '@/db/schema';
import { composeFullName } from '@/lib/user-name';

export const ALL_STAFF_CHANNEL = 'all';
export const ALL_STAFF_CHANNEL_NAME = 'All Staff';
export const ALL_STAFF_CHANNEL_SUBTITLE = 'Every office, plus admins';

const STAFF_ROLES = ['OfficeStaff', 'OfficeHead'];
const CHAT_ROLES = [...STAFF_ROLES, 'Admin'];
const THREAD_LIMIT = 200;

const ROLE_LABELS: Record<string, string> = {
  OfficeStaff: 'Office Staff',
  OfficeHead: 'Office Head',
  Admin: 'Administrator',
};

export function canUseStaffChat(role: string): boolean {
  return CHAT_ROLES.includes(role);
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  officeCode: string | null;
  officeName: string | null;
}

export interface StaffConversation {
  id: string;
  kind: 'channel' | 'direct';
  name: string;
  subtitle: string;
  lastMessage: { body: string; createdAt: Date; fromMe: boolean; senderName: string } | null;
  unread: number;
}

export interface StaffThreadMessage {
  id: string;
  body: string;
  createdAt: Date;
  senderName: string;
  fromMe: boolean;
  readAt: Date | null;
}

const activeStaff = and(
  eq(users.status, 'active'),
  or(
    eq(roles.name, 'Admin'),
    and(
      inArray(roles.name, STAFF_ROLES),
      exists(
        db
          .select({ id: office_staff.id })
          .from(office_staff)
          .where(eq(office_staff.user_id, users.id)),
      ),
    ),
  ),
);

async function listActiveStaff(): Promise<StaffMember[]> {
  const rows = await db
    .select({
      id: users.id,
      given_name: users.given_name,
      middle_name: users.middle_name,
      last_name: users.last_name,
      name_suffix: users.name_suffix,
      role: roles.name,
      office_code: offices.code,
      office_name: offices.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.role_id, roles.id))
    .leftJoin(office_staff, eq(office_staff.user_id, users.id))
    .leftJoin(offices, eq(offices.id, office_staff.office_id))
    .where(activeStaff)
    .orderBy(asc(users.last_name), asc(users.given_name));

  const byId = new Map<string, StaffMember>();
  for (const r of rows) {
    if (byId.has(r.id)) continue;
    byId.set(r.id, {
      id: r.id,
      name: composeFullName(r),
      role: r.role,
      officeCode: r.office_code,
      officeName: r.office_name,
    });
  }
  return [...byId.values()];
}

export async function findActiveStaff(userId: string): Promise<StaffMember | null> {
  const all = await listActiveStaff();
  return all.find((s) => s.id === userId) ?? null;
}

export function staffSubtitle(member: StaffMember): string {
  const role = ROLE_LABELS[member.role] ?? member.role;
  return member.officeName ? `${role} · ${member.officeName}` : role;
}

async function channelUnreadCount(userId: string): Promise<number> {
  const [readRow] = await db
    .select({ last_read_at: staff_channel_reads.last_read_at })
    .from(staff_channel_reads)
    .where(eq(staff_channel_reads.user_id, userId))
    .limit(1);

  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(staff_messages)
    .where(
      and(
        isNull(staff_messages.recipient_id),
        ne(staff_messages.sender_id, userId),
        readRow ? gt(staff_messages.created_at, readRow.last_read_at) : undefined,
      ),
    );
  return Number(row?.count ?? 0);
}

async function directUnreadBySender(userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ sender_id: staff_messages.sender_id, count: sql<number>`COUNT(*)` })
    .from(staff_messages)
    .innerJoin(users, eq(staff_messages.sender_id, users.id))
    .innerJoin(roles, eq(users.role_id, roles.id))
    .where(and(eq(staff_messages.recipient_id, userId), isNull(staff_messages.read_at), activeStaff))
    .groupBy(staff_messages.sender_id);

  return new Map(rows.map((r) => [r.sender_id, Number(r.count)]));
}

export async function countUnreadStaffMessages(userId: string): Promise<number> {
  const [channel, direct] = await Promise.all([
    channelUnreadCount(userId),
    directUnreadBySender(userId),
  ]);
  return channel + [...direct.values()].reduce((sum, n) => sum + n, 0);
}

async function lastChannelMessage(userId: string): Promise<StaffConversation['lastMessage']> {
  const [row] = await db
    .select({
      body: staff_messages.body,
      created_at: staff_messages.created_at,
      sender_id: staff_messages.sender_id,
      given_name: users.given_name,
      middle_name: users.middle_name,
      last_name: users.last_name,
      name_suffix: users.name_suffix,
    })
    .from(staff_messages)
    .innerJoin(users, eq(staff_messages.sender_id, users.id))
    .where(isNull(staff_messages.recipient_id))
    .orderBy(desc(staff_messages.created_at))
    .limit(1);

  if (!row) return null;
  return {
    body: row.body,
    createdAt: row.created_at,
    fromMe: row.sender_id === userId,
    senderName: composeFullName(row),
  };
}

async function lastDirectMessages(userId: string) {
  const involving = db
    .select({
      peer_id: sql<string>`CASE WHEN ${staff_messages.sender_id} = ${userId} THEN ${staff_messages.recipient_id} ELSE ${staff_messages.sender_id} END`.as(
        'peer_id',
      ),
      body: staff_messages.body,
      created_at: staff_messages.created_at,
      sender_id: staff_messages.sender_id,
    })
    .from(staff_messages)
    .where(
      or(
        and(eq(staff_messages.sender_id, userId), isNotNull(staff_messages.recipient_id)),
        eq(staff_messages.recipient_id, userId),
      ),
    )
    .as('involving');

  const rows = await db
    .selectDistinctOn([involving.peer_id], {
      peer_id: involving.peer_id,
      body: involving.body,
      created_at: involving.created_at,
      sender_id: involving.sender_id,
    })
    .from(involving)
    .orderBy(involving.peer_id, desc(involving.created_at));

  return new Map(rows.map((r) => [r.peer_id, r]));
}

export async function listStaffConversations(
  userId: string,
): Promise<{ conversations: StaffConversation[]; unreadTotal: number }> {
  const [staff, channelUnread, channelLast, directUnread, directLast] = await Promise.all([
    listActiveStaff(),
    channelUnreadCount(userId),
    lastChannelMessage(userId),
    directUnreadBySender(userId),
    lastDirectMessages(userId),
  ]);

  const staffById = new Map(staff.map((s) => [s.id, s]));
  const me = staffById.get(userId);

  const direct: StaffConversation[] = staff
    .filter((s) => s.id !== userId)
    .map((s) => {
      const last = directLast.get(s.id);
      return {
        id: s.id,
        kind: 'direct' as const,
        name: s.name,
        subtitle: staffSubtitle(s),
        lastMessage: last
          ? {
              body: last.body,
              createdAt: last.created_at,
              fromMe: last.sender_id === userId,
              senderName: last.sender_id === userId ? (me?.name ?? 'You') : s.name,
            }
          : null,
        unread: directUnread.get(s.id) ?? 0,
      };
    });

  direct.sort(
    (a, b) =>
      (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0),
  );

  const channel: StaffConversation = {
    id: ALL_STAFF_CHANNEL,
    kind: 'channel',
    name: ALL_STAFF_CHANNEL_NAME,
    subtitle: ALL_STAFF_CHANNEL_SUBTITLE,
    lastMessage: channelLast,
    unread: channelUnread,
  };

  const unreadTotal = channelUnread + direct.reduce((sum, c) => sum + c.unread, 0);
  return { conversations: [channel, ...direct], unreadTotal };
}

function threadCondition(userId: string, peer: string) {
  if (peer === ALL_STAFF_CHANNEL) return isNull(staff_messages.recipient_id);
  return or(
    and(eq(staff_messages.sender_id, userId), eq(staff_messages.recipient_id, peer)),
    and(eq(staff_messages.sender_id, peer), eq(staff_messages.recipient_id, userId)),
  );
}

export async function getStaffThread(userId: string, peer: string): Promise<StaffThreadMessage[]> {
  if (peer === ALL_STAFF_CHANNEL) {
    const now = new Date();
    await db
      .insert(staff_channel_reads)
      .values({ user_id: userId, last_read_at: now })
      .onConflictDoUpdate({ target: staff_channel_reads.user_id, set: { last_read_at: now } });
  } else {
    await db
      .update(staff_messages)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(staff_messages.sender_id, peer),
          eq(staff_messages.recipient_id, userId),
          isNull(staff_messages.read_at),
        ),
      );
  }

  const rows = await db
    .select({
      id: staff_messages.id,
      body: staff_messages.body,
      created_at: staff_messages.created_at,
      read_at: staff_messages.read_at,
      sender_id: staff_messages.sender_id,
      given_name: users.given_name,
      middle_name: users.middle_name,
      last_name: users.last_name,
      name_suffix: users.name_suffix,
    })
    .from(staff_messages)
    .innerJoin(users, eq(staff_messages.sender_id, users.id))
    .where(threadCondition(userId, peer))
    .orderBy(desc(staff_messages.created_at))
    .limit(THREAD_LIMIT);

  return rows.reverse().map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    senderName: composeFullName(r),
    fromMe: r.sender_id === userId,
    readAt: peer === ALL_STAFF_CHANNEL ? null : r.read_at,
  }));
}

export async function sendStaffMessage(senderId: string, peer: string, body: string) {
  const [created] = await db
    .insert(staff_messages)
    .values({
      sender_id: senderId,
      recipient_id: peer === ALL_STAFF_CHANNEL ? null : peer,
      body,
    })
    .returning({ id: staff_messages.id, created_at: staff_messages.created_at });
  return created;
}
