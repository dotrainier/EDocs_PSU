import { pgTable, varchar, serial, boolean, integer } from 'drizzle-orm/pg-core';

export const offices = pgTable('offices', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  is_active: boolean('is_active').notNull().default(true),
  // Working-day throughput this office can process across all its document
  // types combined, in capacity_weight units. Drives the live expected-date
  // calculation (see src/lib/expected-date.ts). Nullable — offices without a
  // configured value fall back to a default there. Admin-editable UI is a
  // separate follow-up task.
  daily_capacity: integer('daily_capacity'),
});
