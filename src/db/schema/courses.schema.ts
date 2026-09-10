import { pgTable, serial, varchar, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const courses = pgTable(
  'courses',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    major: varchar('major', { length: 255 }),
    code: varchar('code', { length: 50 }).notNull(),
    is_active: boolean('is_active').notNull().default(true),
  },
  (table) => [
    index('courses_id_idx').on(table.id),
    uniqueIndex('courses_code_uq').on(table.code),
    index('courses_active_idx').on(table.is_active),
  ],
);
