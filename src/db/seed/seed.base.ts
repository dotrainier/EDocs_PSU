import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, office_staff, offices, roles } from '@/db/schema';
import bcrypt from 'bcryptjs';

const roleData = [
  { name: 'Student' },
  { name: 'OfficeStaff' },
  { name: 'OfficeHead' },
  { name: 'Admin' },
];

const officeData = [
  // daily_capacity: placeholder assumption (40 capacity_weight units/day for
  // OUR — adjust once real registrar throughput is known). Other offices are
  // left null; Admins set real values for them under Capacity Settings.
  { name: 'Office of the University Registrar', code: 'OUR', daily_capacity: 40 },
  { name: 'University Cashier / Finance', code: 'UCF' },
  { name: 'University Library', code: 'LIB' },
  { name: 'Property / Supply Office', code: 'PSO' },
  { name: 'MIS / IT Office', code: 'MIS' },
  { name: "Dean's / College Office", code: 'DCO' },
  { name: 'Guidance / OSAS', code: 'OSAS' },
];

export async function seedBase() {
  console.log('Seeding roles...');

  await db.insert(roles).values(roleData).onConflictDoNothing();

  const existingRoles = await db.select().from(roles);
  const roleMap: Record<string, number> = {};
  existingRoles.forEach((r) => {
    roleMap[r.name] = r.id;
  });

  console.log('Seeding offices...');

  // Upsert on code so re-running the seed (without db:fresh) keeps
  // daily_capacity in sync as the placeholder value is adjusted.
  await db.insert(offices).values(officeData).onConflictDoUpdate({
    target: offices.code,
    set: {
      name: sql`excluded.name`,
      daily_capacity: sql`excluded.daily_capacity`,
    },
  });

  const existingOffices = await db.select().from(offices);
  const officeMap: Record<string, number> = {};
  existingOffices.forEach((o) => {
    officeMap[o.code] = o.id;
  });

  console.log('Hashing passwords...');
  const defaultPassword = await bcrypt.hash('password123', 12);

  console.log('Seeding users...');

  // Structured name parts for every seeded user — given_name/middle_name/
  // last_name/name_suffix are the only stored source of truth for a name.
  // Full names are computed with composeFullName() only where read (e.g.
  // src/lib/session.ts), never written here.
  const nameData = {
    'juan.delacruz@psu.edu.ph': { given_name: 'Juan', middle_name: 'Garcia', last_name: 'Dela Cruz' },
    'maria.santos@psu.edu.ph': { given_name: 'Maria', middle_name: 'Reyes', last_name: 'Santos' },
    'carlo.ramirez@psu.edu.ph': { given_name: 'Carlo', middle_name: 'Fernandez', last_name: 'Ramirez' },
    'registrar.staff@psu.edu.ph': { given_name: 'Ana', middle_name: 'Bautista', last_name: 'Reyes' },
    'cashier.staff@psu.edu.ph': { given_name: 'Ben', middle_name: 'Villareal', last_name: 'Torres' },
    'library.staff@psu.edu.ph': { given_name: 'Clara', middle_name: 'Santiago', last_name: 'Mendoza' },
    'property.staff@psu.edu.ph': { given_name: 'Diego', middle_name: 'Uy', last_name: 'Lim' },
    'mis.staff@psu.edu.ph': { given_name: 'Elena', middle_name: 'Navarro', last_name: 'Cruz' },
    'registrar.head@psu.edu.ph': { given_name: 'Francis', middle_name: 'Domingo', last_name: 'Aquino' },
    'hrmo.head@psu.edu.ph': { given_name: 'Grace', middle_name: 'Manalo', last_name: 'Villanueva' },
    'admin@psu.edu.ph': { given_name: 'System', last_name: 'Administrator' },
  } as const;

  const userData = [
    {
      school_id: '2021307001',
      email: 'juan.delacruz@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['juan.delacruz@psu.edu.ph'],
      role_id: roleMap['Student'],
      status: 'active',
      student_type: 'active',
      year_level: '3rd Year',
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: '2021307002',
      email: 'maria.santos@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['maria.santos@psu.edu.ph'],
      role_id: roleMap['Student'],
      status: 'active',
      student_type: 'alumni',
      year_level: null,
      year_graduated: 2023,
      verification_status: 'approved',
    },
    {
      school_id: '2020307003',
      email: 'carlo.ramirez@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['carlo.ramirez@psu.edu.ph'],
      role_id: roleMap['Student'],
      status: 'active',
      student_type: 'alumni',
      year_level: null,
      year_graduated: 2022,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-001',
      email: 'registrar.staff@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['registrar.staff@psu.edu.ph'],
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-002',
      email: 'cashier.staff@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['cashier.staff@psu.edu.ph'],
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-003',
      email: 'library.staff@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['library.staff@psu.edu.ph'],
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-004',
      email: 'property.staff@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['property.staff@psu.edu.ph'],
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-005',
      email: 'mis.staff@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['mis.staff@psu.edu.ph'],
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2015-001',
      email: 'registrar.head@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['registrar.head@psu.edu.ph'],
      role_id: roleMap['OfficeHead'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2015-002',
      email: 'hrmo.head@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['hrmo.head@psu.edu.ph'],
      role_id: roleMap['OfficeHead'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
    {
      school_id: 'ADM-2024-001',
      email: 'admin@psu.edu.ph',
      password_hash: defaultPassword,
      ...nameData['admin@psu.edu.ph'],
      role_id: roleMap['Admin'],
      status: 'active',
      student_type: null,
      year_level: null,
      year_graduated: null,
      verification_status: 'approved',
    },
  ];

  // Upsert on email so re-running the seed (without db:fresh) keeps names
  // and student_type in sync as those fields evolve.
  await db.insert(users).values(userData).onConflictDoUpdate({
    target: users.email,
    set: {
      school_id: sql`excluded.school_id`,
      given_name: sql`excluded.given_name`,
      middle_name: sql`excluded.middle_name`,
      last_name: sql`excluded.last_name`,
      role_id: sql`excluded.role_id`,
      status: sql`excluded.status`,
      student_type: sql`excluded.student_type`,
      year_level: sql`excluded.year_level`,
      year_graduated: sql`excluded.year_graduated`,
      verification_status: sql`excluded.verification_status`,
    },
  });

  const existingUsers = await db.select({ id: users.id, school_id: users.school_id }).from(users);
  const userMap: Record<string, string> = {};
  existingUsers.forEach((u) => {
    if (u.school_id) userMap[u.school_id] = u.id;
  });

  console.log('Seeding office staff assignments...');

  const officeStaffData = [
    { user_id: userMap['EMP-2018-001'], office_id: officeMap['OUR'], is_office_head: false },
    { user_id: userMap['EMP-2018-002'], office_id: officeMap['UCF'], is_office_head: false },
    { user_id: userMap['EMP-2018-003'], office_id: officeMap['LIB'], is_office_head: false },
    { user_id: userMap['EMP-2018-004'], office_id: officeMap['PSO'], is_office_head: false },
    { user_id: userMap['EMP-2018-005'], office_id: officeMap['MIS'], is_office_head: false },
    { user_id: userMap['EMP-2015-001'], office_id: officeMap['OUR'], is_office_head: true },
  ];

  // Upsert on (user_id, office_id) so re-running the seed keeps
  // is_office_head in sync instead of silently duplicating assignments.
  await db.insert(office_staff).values(officeStaffData).onConflictDoUpdate({
    target: [office_staff.user_id, office_staff.office_id],
    set: { is_office_head: sql`excluded.is_office_head` },
  });

  console.log('Done! Seed summary:');
  console.log(`  Roles:        ${roleData.length}`);
  console.log(`  Offices:      ${officeData.length}`);
  console.log(`  Users:        ${userData.length}`);
  console.log(`  Office staff: ${officeStaffData.length}`);
  console.log('\nDefault password for all accounts: password123');
}
