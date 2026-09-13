import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { offices, roles } from './index';

export const document_types = pgTable(
  'document_types',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: varchar('description', { length: 500 }),
    issuing_office_id: integer('issuing_office_id')
      .notNull()
      .references(() => offices.id),
    handling_pattern: varchar('handling_pattern', { length: 20 }).notNull().default('GENERATE'), // 'GENERATE' | 'UPLOAD'
    fee_amount: decimal('fee_amount', { precision: 10, scale: 2 }), // null = free
    sla_working_days: integer('sla_working_days').notNull().default(3),
    requires_clearance: boolean('requires_clearance').notNull().default(false),
    // Controls which extra period fields are collected on the request form:
    // 'semester_past_only' → school_year + semester required, restricted to past terms (COG)
    // null                 → no period fields, uses the current period (COR, COE, TOR)
    period_type: varchar('period_type', { length: 30 }),
    // Restricts who may request this document type:
    // 'active_only' → only users with users.student_type = 'active' (COE, COR — they certify current enrollment)
    // null          → available to both active students and alumni (TOR, COG)
    eligible_student_types: varchar('eligible_student_types', { length: 20 }),
    is_active: boolean('is_active').notNull().default(true),
  },
  (table) => [
    index('document_types_id_idx').on(table.id),
    uniqueIndex('document_types_code_uq').on(table.code),
    uniqueIndex('document_types_name_uq').on(table.name),
    index('document_types_office_idx').on(table.issuing_office_id),
    index('document_types_active_idx').on(table.is_active),
  ],
);

export const document_type_roles = pgTable(
  'document_type_roles',
  {
    id: serial('id').primaryKey(),
    document_type_id: integer('document_type_id')
      .notNull()
      .references(() => document_types.id, { onDelete: 'cascade' }),
    role_id: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('doc_type_roles_id_idx').on(table.id),
    index('doc_type_roles_doc_type_idx').on(table.document_type_id),
    index('doc_type_roles_role_idx').on(table.role_id),
    uniqueIndex('doc_type_roles_doc_role_uq').on(table.document_type_id, table.role_id),
  ],
);

export const clearance_requirements = pgTable(
  'clearance_requirements',
  {
    id: serial('id').primaryKey(),
    document_type_id: integer('document_type_id')
      .notNull()
      .references(() => document_types.id, { onDelete: 'cascade' }),
    office_id: integer('office_id')
      .notNull()
      .references(() => offices.id),
    sequence_order: integer('sequence_order'),
    is_required: boolean('is_required').notNull().default(true),
  },
  (table) => [
    index('clearance_req_id_idx').on(table.id),
    index('clearance_req_doc_type_idx').on(table.document_type_id),
    index('clearance_req_office_idx').on(table.office_id),
    uniqueIndex('clearance_req_doc_office_uq').on(table.document_type_id, table.office_id),
  ],
);
