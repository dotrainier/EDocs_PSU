import { pgTable, uuid, varchar, jsonb, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { users, document_requests } from './index';

export const audit_log = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  details: jsonb('details'),
  ip_address: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    request_id: uuid('request_id').references(() => document_requests.id, { onDelete: 'cascade' }),
    type: varchar('type', {
      length: 50,
      enum: [
        'document_submitted',
        'document_approved',
        'document_rejected',
        'document_ready',
        'clearance_requested',
        'clearance_cleared',
        'clearance_rejected',
        'payment_required',
        'sla_warning',
        'sla_breached',
        'system_alert',
        'announcement',
        'maintenance',
        'account_notice',
        'password_expiring',
        'office_closure',
      ],
    }),
    title: varchar('title', { length: 100 }).notNull(),
    message: varchar('message', { length: 500 }).notNull(),
    is_read: boolean('is_read').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    read_at: timestamp('read_at', { withTimezone: true }),
    related_id: uuid('related_id'),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.user_id),
    index('notifications_request_id_idx').on(table.request_id),
    index('notifications_type_idx').on(table.type),
  ],
);
