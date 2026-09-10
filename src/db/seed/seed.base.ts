import { db } from '@/db';
import { users, office_staff, offices, roles } from '@/db/schema';
import bcrypt from 'bcryptjs';

const roleData = [
  { name: 'Student' },
  { name: 'Faculty' },
  { name: 'NonTeachingStaff' },
  { name: 'OfficeStaff' },
  { name: 'OfficeHead' },
  { name: 'Admin' },
];

const officeData = [
  { name: 'Office of the University Registrar', code: 'OUR' },
  { name: 'University Cashier / Finance', code: 'UCF' },
  { name: 'University Library', code: 'LIB' },
  { name: 'Property / Supply Office', code: 'PSO' },
  { name: 'MIS / IT Office', code: 'MIS' },
  { name: "Dean's / College Office", code: 'DCO' },
  { name: 'Guidance / OSAS', code: 'OSAS' },
  { name: 'HRMO', code: 'HRMO' },
];

export async function seedBase() {
  // ─── 1. Roles ───────────────────────────────────────────────────────────────
  console.log('Seeding roles...');

  await db.insert(roles).values(roleData).onConflictDoNothing();

  const existingRoles = await db.select().from(roles);
  const roleMap: Record<string, number> = {};
  existingRoles.forEach((r) => {
    roleMap[r.name] = r.id;
  });

  // ─── 2. Offices ─────────────────────────────────────────────────────────────
  console.log('Seeding offices...');

  await db.insert(offices).values(officeData).onConflictDoNothing();

  const existingOffices = await db.select().from(offices);
  const officeMap: Record<string, number> = {};
  existingOffices.forEach((o) => {
    officeMap[o.code] = o.id;
  });

  // ─── 3. Users ───────────────────────────────────────────────────────────────
  console.log('Hashing passwords...');
  const defaultPassword = await bcrypt.hash('password123', 12);

  console.log('Seeding users...');

  const userData = [
    {
      school_id: '2021307001',
      email: 'juan.delacruz@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Juan Dela Cruz',
      role_id: roleMap['Student'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: '2021307002',
      email: 'maria.santos@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Maria Santos',
      role_id: roleMap['Student'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'FAC-2019-001',
      email: 'pedro.reyes@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Pedro Reyes',
      role_id: roleMap['Faculty'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'NTS-2020-001',
      email: 'rosa.garcia@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Rosa Garcia',
      role_id: roleMap['NonTeachingStaff'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-001',
      email: 'registrar.staff@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Ana Reyes',
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-002',
      email: 'cashier.staff@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Ben Torres',
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-003',
      email: 'library.staff@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Clara Mendoza',
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-004',
      email: 'property.staff@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Diego Lim',
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2018-005',
      email: 'mis.staff@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Elena Cruz',
      role_id: roleMap['OfficeStaff'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2015-001',
      email: 'registrar.head@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Francis Aquino',
      role_id: roleMap['OfficeHead'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'EMP-2015-002',
      email: 'hrmo.head@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'Grace Villanueva',
      role_id: roleMap['OfficeHead'],
      status: 'active',
      verification_status: 'approved',
    },
    {
      school_id: 'ADM-2024-001',
      email: 'admin@psu.edu.ph',
      password_hash: defaultPassword,
      full_name: 'System Administrator',
      role_id: roleMap['Admin'],
      status: 'active',
      verification_status: 'approved',
    },
  ];

  await db.insert(users).values(userData).onConflictDoNothing();

  const existingUsers = await db.select({ id: users.id, school_id: users.school_id }).from(users);
  const userMap: Record<string, string> = {};
  existingUsers.forEach((u) => {
    if (u.school_id) userMap[u.school_id] = u.id;
  });

  // ─── 4. Office Staff Assignments ────────────────────────────────────────────
  console.log('Seeding office staff assignments...');

  const officeStaffData = [
    { user_id: userMap['EMP-2018-001'], office_id: officeMap['OUR'], is_office_head: false },
    { user_id: userMap['EMP-2018-002'], office_id: officeMap['UCF'], is_office_head: false },
    { user_id: userMap['EMP-2018-003'], office_id: officeMap['LIB'], is_office_head: false },
    { user_id: userMap['EMP-2018-004'], office_id: officeMap['PSO'], is_office_head: false },
    { user_id: userMap['EMP-2018-005'], office_id: officeMap['MIS'], is_office_head: false },
    { user_id: userMap['EMP-2015-001'], office_id: officeMap['OUR'], is_office_head: true },
    { user_id: userMap['EMP-2015-002'], office_id: officeMap['HRMO'], is_office_head: true },
  ];

  await db.insert(office_staff).values(officeStaffData).onConflictDoNothing();

  console.log('Done! Seed summary:');
  console.log(`  Roles:        ${roleData.length}`);
  console.log(`  Offices:      ${officeData.length}`);
  console.log(`  Users:        ${userData.length}`);
  console.log(`  Office staff: ${officeStaffData.length}`);
  console.log('\nDefault password for all accounts: password123');
}
