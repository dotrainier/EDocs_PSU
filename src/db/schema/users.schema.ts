import { pgTable, varchar, uuid, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { roles } from './index';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: varchar('school_id', { length: 50 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    role_id: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    full_name: varchar('full_name', { length: 255 }).notNull(),
  },
  (table) => [
    index('users_id_idx').on(table.id),
    uniqueIndex('users_school_id_uq').on(table.school_id),
    uniqueIndex('users_email_uq').on(table.email),
  ],
);
