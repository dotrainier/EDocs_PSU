import {
  pgTable,
  varchar,
  uuid,
  integer,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { roles, courses } from './index';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    school_id: varchar('school_id', { length: 50 }).unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    role_id: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    full_name: varchar('full_name', { length: 255 }).notNull(),
    given_name: varchar('given_name', { length: 100 }),
    middle_name: varchar('middle_name', { length: 100 }),
    last_name: varchar('last_name', { length: 100 }),
    name_suffix: varchar('name_suffix', { length: 20 }),
    // 'active' = currently enrolled student, 'alumni' = graduated / inactive student
    student_type: varchar('student_type', { length: 20 }),
    course_id: integer('course_id').references(() => courses.id),
    // Free-text fallback used when the desired course isn't in the catalog yet
    course_other_note: text('course_other_note'),
    // Populated only when student_type = 'active'
    year_level: varchar('year_level', { length: 20 }),
    // Populated only when student_type = 'alumni'
    year_graduated: integer('year_graduated'),
    // 'pending' | 'approved' | 'rejected' — gates signin until an admin reviews the registration
    verification_status: varchar('verification_status', { length: 20 })
      .notNull()
      .default('pending'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_id_idx').on(table.id),
    uniqueIndex('users_school_id_uq').on(table.school_id),
    uniqueIndex('users_email_uq').on(table.email),
  ],
);
