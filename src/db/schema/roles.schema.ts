import { pgTable, serial, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
  },
  (table) => [index('roles_id_idx').on(table.id), uniqueIndex('roles_name_uq').on(table.name)],
);
