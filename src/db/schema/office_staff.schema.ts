import { pgTable, varchar, serial, boolean, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { users, offices } from './index';

export const office_staff = pgTable('office_staff', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  office_id: integer('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  is_office_head: boolean('is_office_head').notNull().default(false),
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
});
