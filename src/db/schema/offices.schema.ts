import { pgTable, varchar, serial, boolean } from 'drizzle-orm/pg-core';

export const offices = pgTable('offices', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  is_active: boolean('is_active').notNull().default(true),
});
