import { pgTable, serial, boolean, uuid, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users, offices } from './index';

export const office_staff = pgTable(
  'office_staff',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    office_id: integer('office_id')
      .notNull()
      .references(() => offices.id, { onDelete: 'cascade' }),
    is_office_head: boolean('is_office_head').notNull().default(false),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // A staff member can only be assigned to a given office once — also backs
    // the onConflictDoUpdate() call in seeding.
    uniqueIndex('office_staff_user_office_uq').on(table.user_id, table.office_id),
  ],
);
