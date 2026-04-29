// src/db/schema.ts
import { pgTable, uuid, varchar, timestamp, pgSchema } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .defaultRandom()
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
