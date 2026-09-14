import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
// Seeding is part of standing up the placeholder academic-records data set
// itself, so this fixture script imports the isolated schema directly.
// Application/runtime code must go through src/lib/academic-records.ts
// instead — see src/db/schema/academic-records.schema.ts for why.
import { student_status, academic_terms } from '@/db/schema/academic-records.schema';

export async function seedAcademicRecords() {
  console.log('Seeding academic records (placeholder SIS data)...');

  const existingUsers = await db.select({ id: users.id, school_id: users.school_id }).from(users);
  const userMap: Record<string, string> = {};
  existingUsers.forEach((u) => {
    if (u.school_id) userMap[u.school_id] = u.id;
  });

  const juanId = userMap['2021307001']; // continuing/active student
  const mariaId = userMap['2021307002']; // graduated student
  const carloId = userMap['2020307003']; // transferred-out student

  if (!juanId || !mariaId || !carloId) {
    throw new Error('Expected demo students not found. Run seedBase() first.');
  }

  // ─── 1. Overall status per student ───────────────────────────────────────────
  const statusData = [
    { user_id: juanId, overall_status: 'active', graduation_date: null },
    { user_id: mariaId, overall_status: 'graduated', graduation_date: '2025-06-15' },
    { user_id: carloId, overall_status: 'transferred', graduation_date: null },
  ];

  // Upsert on user_id (the primary key) so re-running the seed keeps status
  // in sync as it evolves — same reasoning as document_requests.
  await db.insert(student_status).values(statusData).onConflictDoUpdate({
    target: student_status.user_id,
    set: {
      overall_status: sql`excluded.overall_status`,
      graduation_date: sql`excluded.graduation_date`,
    },
  });

  // ─── 2. Per-term enrollment history ──────────────────────────────────────────
  const termData = [
    // Juan — continuing/active student; multi-term history building up to
    // the current term (2025-2026, 1st Semester).
    { user_id: juanId, school_year: '2022-2023', semester: '1st Semester', status: 'enrolled' },
    { user_id: juanId, school_year: '2022-2023', semester: '2nd Semester', status: 'enrolled' },
    { user_id: juanId, school_year: '2023-2024', semester: '1st Semester', status: 'enrolled' },
    { user_id: juanId, school_year: '2023-2024', semester: '2nd Semester', status: 'enrolled' },
    { user_id: juanId, school_year: '2024-2025', semester: '1st Semester', status: 'enrolled' },
    { user_id: juanId, school_year: '2024-2025', semester: '2nd Semester', status: 'enrolled' },
    { user_id: juanId, school_year: '2025-2026', semester: '1st Semester', status: 'enrolled' },

    // Maria — graduated; full history leading up to her last enrolled term
    // before graduating.
    { user_id: mariaId, school_year: '2021-2022', semester: '1st Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2021-2022', semester: '2nd Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2022-2023', semester: '1st Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2022-2023', semester: '2nd Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2023-2024', semester: '1st Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2023-2024', semester: '2nd Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2024-2025', semester: '1st Semester', status: 'enrolled' },
    { user_id: mariaId, school_year: '2024-2025', semester: '2nd Semester', status: 'enrolled' },

    // Carlo — went on leave of absence then transferred out.
    { user_id: carloId, school_year: '2023-2024', semester: '1st Semester', status: 'enrolled' },
    { user_id: carloId, school_year: '2023-2024', semester: '2nd Semester', status: 'loa' },
  ];

  // Upsert on (user_id, school_year, semester) so re-running the seed keeps
  // status in sync as it evolves.
  await db.insert(academic_terms).values(termData).onConflictDoUpdate({
    target: [academic_terms.user_id, academic_terms.school_year, academic_terms.semester],
    set: { status: sql`excluded.status` },
  });

  console.log('Done! Academic records seed summary:');
  console.log(`  Student status rows: ${statusData.length}`);
  console.log(`  Academic term rows:  ${termData.length}`);
}
