import { pgTable, uuid, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users, document_types } from './index';

export const document_requests = pgTable('document_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  tracking_number: varchar('tracking_number', { length: 30 }).notNull().unique(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id),
  document_type_id: integer('document_type_id')
    .notNull()
    .references(() => document_types.id),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  copies: integer('copies').notNull().default(1),
  additional_notes: text('additional_notes'),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  fee_amount: varchar('fee_amount', { length: 20 }),
  payment_status: varchar('payment_status', { length: 20 }).notNull().default('Unpaid'),
  payment_proof_path: varchar('payment_proof_path', { length: 500 }),
  sla_due_at: timestamp('sla_due_at', { withTimezone: true }),
  // Period fields — populated when the document type's period_type is 'semester_past_only' (COG)
  school_year: varchar('school_year', { length: 20 }),   // e.g. '2024-2025'
  semester: varchar('semester', { length: 30 }),          // e.g. '1st Semester'
  date_from: varchar('date_from', { length: 20 }),        // unused — no current document type has a date-range period
  date_to: varchar('date_to', { length: 20 }),            // unused — no current document type has a date-range period
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
