import { pgTable, uuid, integer, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { document_requests, offices, users } from './index';

export const clearance_tasks = pgTable(
  'clearance_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    request_id: uuid('request_id')
      .notNull()
      .references(() => document_requests.id, { onDelete: 'cascade' }),
    office_id: integer('office_id')
      .notNull()
      .references(() => offices.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    sequence_order: integer('sequence_order'),
    remarks: text('remarks'),
    cleared_by: uuid('cleared_by').references(() => users.id),
    cleared_at: timestamp('cleared_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // A request can only ever have one clearance task per office (parallel or
    // sequential) — this also backs the onConflictDoNothing() calls in seeding.
    uniqueIndex('clearance_tasks_request_office_uq').on(table.request_id, table.office_id),
  ],
);
