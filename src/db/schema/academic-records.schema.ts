import { pgSchema, uuid, varchar, date, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// Placeholder academic-records data source standing in for a future live SIS
// (Student Information System) integration. Deliberately isolated in its own
// Postgres schema — never re-exported from `./index` — so it stays fully
// decoupled from the core application schema. The only link back to the core
// schema is the user_id foreign key below; `users` itself is untouched.
//
// The only file allowed to query these tables is src/lib/academic-records.ts.
// When this placeholder is swapped for a real API integration, that module is
// the only thing that needs to change.
export const academicRecordsSchema = pgSchema('academic_records');

export const student_status = academicRecordsSchema.table('student_status', {
  user_id: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  overall_status: varchar('overall_status', { length: 20 }).notNull(),
  graduation_date: date('graduation_date', { mode: 'string' }),
});

export const academic_terms = academicRecordsSchema.table(
  'academic_terms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id),
    school_year: varchar('school_year', { length: 20 }).notNull(),
    semester: varchar('semester', { length: 30 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
  },
  (table) => [
    index('academic_terms_user_id_idx').on(table.user_id),
    uniqueIndex('academic_terms_user_term_uq').on(
      table.user_id,
      table.school_year,
      table.semester,
    ),
  ],
);
