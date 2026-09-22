import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { document_requests, users } from './index';

export const request_messages = pgTable(
  'request_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    request_id: uuid('request_id')
      .notNull()
      .references(() => document_requests.id, { onDelete: 'cascade' }),
    sender_id: uuid('sender_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    // Set once the OTHER side of the conversation has viewed the thread —
    // powers the unread indicator. A request has exactly two sides (the
    // student, and staff collectively), so one column is enough: the
    // portal thread route marks staff-sent messages read, the office
    // thread route marks the student's messages read — see those routes.
    read_at: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [index('request_messages_request_id_idx').on(table.request_id)],
);
