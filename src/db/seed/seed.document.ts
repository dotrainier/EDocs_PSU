import { sql, inArray, notInArray, and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import {
  document_types,
  clearance_requirements,
  offices,
  roles,
  document_type_roles,
  document_requests,
} from '@/db/schema';

export async function seedDocuments() {
  console.log('Seeding document types...');

  const existingOffices = await db.select().from(offices);
  const officeMap: Record<string, number> = {};
  existingOffices.forEach((o) => {
    officeMap[o.code] = o.id;
  });

  const required = ['OUR', 'UCF', 'LIB', 'PSO', 'MIS', 'DCO', 'OSAS'];
  for (const code of required) {
    if (!officeMap[code]) {
      throw new Error(`Office "${code}" not found. Run seedBase() first.`);
    }
  }

  const documentTypeData = [
    // ── Registrar documents ──
    {
      name: 'Transcript of Records',
      code: 'TOR',
      description:
        'Official academic record showing all courses taken, units earned, and grades obtained throughout enrollment.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'UPLOAD',
      fee_amount: '150.00',
      sla_working_days: 7,
      // TOR takes noticeably longer to prepare than a generated certificate —
      // weighted higher so it consumes more of OUR's daily capacity per request.
      capacity_weight: 2,
      requires_clearance: true,
      period_type: null,
      eligible_student_types: null,
      is_active: true,
    },
    {
      name: 'Certificate of Enrollment',
      code: 'COE',
      description:
        'Certifies that the student is currently enrolled in a specific program and academic year.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'GENERATE',
      fee_amount: '50.00',
      sla_working_days: 3,
      capacity_weight: 1,
      requires_clearance: true,
      period_type: null,
      eligible_student_types: 'active_only',
      is_active: true,
    },
    {
      name: 'Certificate of Grades',
      code: 'COG',
      description: 'Official record of grades for a specific past semester or academic year.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'GENERATE',
      fee_amount: '50.00',
      sla_working_days: 3,
      capacity_weight: 1,
      requires_clearance: true,
      period_type: 'semester_past_only',
      eligible_student_types: null,
      is_active: true,
    },
    {
      name: 'Certificate of Registration',
      code: 'COR',
      description:
        'Certifies the courses and units a student is officially registered for in the current semester.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'GENERATE',
      fee_amount: '50.00',
      sla_working_days: 1,
      capacity_weight: 1,
      requires_clearance: true,
      period_type: null,
      eligible_student_types: 'active_only',
      is_active: true,
    },
  ];

  const activeCodes = documentTypeData.map((d) => d.code);

  // Remove document types no longer supported (and, via cascade, their
  // document_type_roles and clearance_requirements rows) so re-running the
  // seed without a full reset converges to the current supported list.
  const staleDocTypes = await db
    .select({ id: document_types.id })
    .from(document_types)
    .where(notInArray(document_types.code, activeCodes));
  const staleDocTypeIds = staleDocTypes.map((d) => d.id);

  if (staleDocTypeIds.length > 0) {
    // document_requests has no cascade on document_type_id, so stale demo
    // requests (and, via cascade, their clearance_tasks/notifications) must
    // be cleared first or the delete below violates the FK constraint.
    await db.delete(document_requests).where(inArray(document_requests.document_type_id, staleDocTypeIds));
  }

  await db.delete(document_types).where(notInArray(document_types.code, activeCodes));

  // Upsert on code so re-running the seed (without db:fresh) stays in sync
  await db.insert(document_types).values(documentTypeData).onConflictDoUpdate({
    target: document_types.code,
    set: {
      name: sql`excluded.name`,
      description: sql`excluded.description`,
      issuing_office_id: sql`excluded.issuing_office_id`,
      handling_pattern: sql`excluded.handling_pattern`,
      fee_amount: sql`excluded.fee_amount`,
      sla_working_days: sql`excluded.sla_working_days`,
      capacity_weight: sql`excluded.capacity_weight`,
      requires_clearance: sql`excluded.requires_clearance`,
      period_type: sql`excluded.period_type`,
      eligible_student_types: sql`excluded.eligible_student_types`,
      is_active: sql`excluded.is_active`,
    },
  });

  const existingDocTypes = await db.select().from(document_types);
  const docMap: Record<string, number> = {};
  existingDocTypes.forEach((d) => {
    docMap[d.code] = d.id;
  });

  const existingRoles = await db.select().from(roles);
  const roleMap: Record<string, number> = {};
  existingRoles.forEach((r) => {
    roleMap[r.name] = r.id;
  });

  const documentTypeRolesData = [
    // TOR → Student only
    { document_type_id: docMap['TOR'], role_id: roleMap['Student'] },

    // COE → Student only
    { document_type_id: docMap['COE'], role_id: roleMap['Student'] },

    // COG → Student only
    { document_type_id: docMap['COG'], role_id: roleMap['Student'] },

    // COR → Student only
    { document_type_id: docMap['COR'], role_id: roleMap['Student'] },
  ];

  await db.insert(document_type_roles).values(documentTypeRolesData).onConflictDoNothing();

  console.log('Seeding clearance requirements...');

  // TOR moved from multi-office routing (Library/Cashier/Property/Guidance) to
  // Registrar-only. Drop its old office rows so re-running the seed without a
  // full reset (db:fresh) still converges to the current model, same as the
  // stale-document-types cleanup above.
  await db
    .delete(clearance_requirements)
    .where(
      and(
        eq(clearance_requirements.document_type_id, docMap['TOR']),
        ne(clearance_requirements.office_id, officeMap['OUR']),
      ),
    );

  const clearanceData = [
    // ── TOR: Registrar-only. Clearance is satisfied by the student uploading a
    // clearance form (reviewed by Registrar staff), not by routing through
    // Library/Cashier/Property/Guidance — same single-office pattern as COE/COG. ──
    {
      document_type_id: docMap['TOR'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── COE: OUR head approval only ──
    {
      document_type_id: docMap['COE'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── COG: OUR head approval only (client mentioned security trail) ──
    {
      document_type_id: docMap['COG'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── COR: OUR head approval only — same single-office pattern as COE/COG ──
    {
      document_type_id: docMap['COR'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },
  ];

  // Upsert on (document_type_id, office_id) so re-running the seed keeps
  // sequence_order/is_required in sync — same reasoning as document_types above.
  await db.insert(clearance_requirements).values(clearanceData).onConflictDoUpdate({
    target: [clearance_requirements.document_type_id, clearance_requirements.office_id],
    set: {
      sequence_order: sql`excluded.sequence_order`,
      is_required: sql`excluded.is_required`,
    },
  });

  console.log('Done! Document seed summary:');
  console.log(`  Document types:         ${documentTypeData.length}`);
  console.log(`  Document type roles:    ${documentTypeRolesData.length}`);
  console.log(`  Clearance requirements: ${clearanceData.length}`);
}
