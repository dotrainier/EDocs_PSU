import { db } from '@/db';
import {
  document_types,
  clearance_requirements,
  offices,
  roles,
  document_type_roles,
} from '@/db/schema';

export async function seedDocuments() {
  // ─── 1. Get office map ───────────────────────────────────────────────────────
  console.log('Seeding document types...');

  const existingOffices = await db.select().from(offices);
  const officeMap: Record<string, number> = {};
  existingOffices.forEach((o) => {
    officeMap[o.code] = o.id;
  });

  const required = ['OUR', 'UCF', 'LIB', 'PSO', 'MIS', 'DCO', 'OSAS', 'HRMO'];
  for (const code of required) {
    if (!officeMap[code]) {
      throw new Error(`Office "${code}" not found. Run seedBase() first.`);
    }
  }

  // ─── 2. Document types ───────────────────────────────────────────────────────

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
      requires_clearance: true,
      is_active: true,
    },
    {
      name: 'Diploma Duplicate',
      code: 'DIPLOMA',
      description:
        'Replacement copy of the official diploma for graduates who have lost their original.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'UPLOAD',
      fee_amount: '500.00',
      sla_working_days: 14,
      requires_clearance: true,
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
      requires_clearance: true, // ← OUR head approval before release
      is_active: true,
    },
    {
      name: 'Certificate of Grades',
      code: 'COG',
      description: 'Official record of grades for a specific semester or academic year.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'GENERATE',
      fee_amount: '50.00',
      sla_working_days: 3,
      requires_clearance: true, // ← client specifically mentioned COG security trail
      is_active: true,
    },
    {
      name: 'Certificate of Units Earned',
      code: 'CUE',
      description: 'Certifies the total number of academic units earned by the student.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'GENERATE',
      fee_amount: '50.00',
      sla_working_days: 5,
      requires_clearance: true, // ← OUR head approval before release
      is_active: true,
    },
    {
      name: 'Transfer Credential',
      code: 'TC',
      description:
        'Official document for students transferring to another institution, certifying honorable dismissal.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'UPLOAD',
      fee_amount: '100.00',
      sla_working_days: 5,
      requires_clearance: true,
      is_active: true,
    },
    {
      name: 'General Clearance',
      code: 'GENCLR',
      description:
        'University-wide clearance certifying no outstanding obligations across all offices.',
      issuing_office_id: officeMap['OUR'],
      handling_pattern: 'GENERATE',
      fee_amount: '0.00',
      sla_working_days: 7,
      requires_clearance: true,
      is_active: true,
    },
    // ── OSAS documents ──
    {
      name: 'Certificate of Good Moral Character',
      code: 'CGMC',
      description:
        'Certifies the good moral standing and conduct of the student within the university.',
      issuing_office_id: officeMap['OSAS'],
      handling_pattern: 'GENERATE',
      fee_amount: '50.00',
      sla_working_days: 3,
      requires_clearance: true, // ← OSAS head approval before release
      is_active: true,
    },
    // ── HRMO documents ──
    {
      name: 'Service Record',
      code: 'SR',
      description:
        'Official record of employment history, positions held, and tenure within the university.',
      issuing_office_id: officeMap['HRMO'],
      handling_pattern: 'UPLOAD',
      fee_amount: '0.00',
      sla_working_days: 5,
      requires_clearance: true,
      is_active: true,
    },
    {
      name: 'Certificate of Employment',
      code: 'COEMPL',
      description:
        'Certifies active employment status, position, and salary grade of a university employee.',
      issuing_office_id: officeMap['HRMO'],
      handling_pattern: 'GENERATE',
      fee_amount: '0.00',
      sla_working_days: 3,
      requires_clearance: true, // ← HRMO head approval before release
      is_active: true,
    },
  ];

  await db.insert(document_types).values(documentTypeData).onConflictDoNothing();

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

    // DIPLOMA → Student only
    { document_type_id: docMap['DIPLOMA'], role_id: roleMap['Student'] },

    // COE → Student only
    { document_type_id: docMap['COE'], role_id: roleMap['Student'] },

    // COG → Student only
    { document_type_id: docMap['COG'], role_id: roleMap['Student'] },

    // CUE → Student only
    { document_type_id: docMap['CUE'], role_id: roleMap['Student'] },

    // TC → Student only
    { document_type_id: docMap['TC'], role_id: roleMap['Student'] },

    // GENCLR → Student, Faculty, NonTeachingStaff
    { document_type_id: docMap['GENCLR'], role_id: roleMap['Student'] },
    { document_type_id: docMap['GENCLR'], role_id: roleMap['Faculty'] },
    { document_type_id: docMap['GENCLR'], role_id: roleMap['NonTeachingStaff'] },

    // CGMC → Student only
    { document_type_id: docMap['CGMC'], role_id: roleMap['Student'] },

    // SR → Faculty, NonTeachingStaff
    { document_type_id: docMap['SR'], role_id: roleMap['Faculty'] },
    { document_type_id: docMap['SR'], role_id: roleMap['NonTeachingStaff'] },

    // COEMPL → Faculty, NonTeachingStaff
    { document_type_id: docMap['COEMPL'], role_id: roleMap['Faculty'] },
    { document_type_id: docMap['COEMPL'], role_id: roleMap['NonTeachingStaff'] },
  ];

  await db.insert(document_type_roles).values(documentTypeRolesData).onConflictDoNothing();

  // ─── 3. Clearance requirements ───────────────────────────────────────────────
  console.log('Seeding clearance requirements...');

  const clearanceData = [
    // ── TOR: parallel clearances → OUR final ──
    {
      document_type_id: docMap['TOR'],
      office_id: officeMap['LIB'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TOR'],
      office_id: officeMap['UCF'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TOR'],
      office_id: officeMap['PSO'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TOR'],
      office_id: officeMap['OSAS'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TOR'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── DIPLOMA: parallel clearances → OUR final ──
    {
      document_type_id: docMap['DIPLOMA'],
      office_id: officeMap['LIB'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['DIPLOMA'],
      office_id: officeMap['UCF'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['DIPLOMA'],
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

    // ── CUE: OUR head approval only ──
    {
      document_type_id: docMap['CUE'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── TC: parallel clearances → OUR final ──
    {
      document_type_id: docMap['TC'],
      office_id: officeMap['LIB'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TC'],
      office_id: officeMap['UCF'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TC'],
      office_id: officeMap['PSO'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TC'],
      office_id: officeMap['OSAS'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TC'],
      office_id: officeMap['DCO'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['TC'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── GENCLR: all offices parallel → OUR final ──
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['LIB'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['UCF'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['PSO'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['MIS'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['OSAS'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['HRMO'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['GENCLR'],
      office_id: officeMap['OUR'],
      sequence_order: 1,
      is_required: true,
    },

    // ── CGMC: OSAS head approval only ──
    {
      document_type_id: docMap['CGMC'],
      office_id: officeMap['OSAS'],
      sequence_order: 1,
      is_required: true,
    },

    // ── SR: Cashier clearance → HRMO final ──
    {
      document_type_id: docMap['SR'],
      office_id: officeMap['UCF'],
      sequence_order: null,
      is_required: true,
    },
    {
      document_type_id: docMap['SR'],
      office_id: officeMap['HRMO'],
      sequence_order: 1,
      is_required: true,
    },

    // ── COEMPL: HRMO head approval only ──
    {
      document_type_id: docMap['COEMPL'],
      office_id: officeMap['HRMO'],
      sequence_order: 1,
      is_required: true,
    },
  ];

  await db.insert(clearance_requirements).values(clearanceData).onConflictDoNothing();

  console.log('Done! Document seed summary:');
  console.log(`  Document types:         ${documentTypeData.length}`);
  console.log(`  Document type roles:    ${documentTypeRolesData.length}`);
  console.log(`  Clearance requirements: ${clearanceData.length}`);
}
