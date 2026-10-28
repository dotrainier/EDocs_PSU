import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './index';

export const staff_messages = pgTable(
  'staff_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sender_id: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipient_id: uuid('recipient_id').references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    read_at: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    index('staff_messages_sender_idx').on(table.sender_id),
    index('staff_messages_recipient_idx').on(table.recipient_id),
    index('staff_messages_created_at_idx').on(table.created_at),
  ],
);

export const staff_channel_reads = pgTable('staff_channel_reads', {
  user_id: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  last_read_at: timestamp('last_read_at', { withTimezone: true }).notNull(),
});
