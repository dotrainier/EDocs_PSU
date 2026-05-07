import { db } from '@/db';
import {
  document_requests,
  document_types,
  users,
  clearance_tasks,
  clearance_requirements,
} from '@/db/schema';

export async function seedRequests() {
  console.log('Seeding document requests...');

  // ─── 1. Get maps ─────────────────────────────────────────────────────────────

  const existingUsers = await db.select().from(users);
  const userMap: Record<string, string> = {};
  existingUsers.forEach((u) => {
    userMap[u.school_id] = u.id;
  });

  const existingDocTypes = await db.select().from(document_types);
  const docMap: Record<string, number> = {};
  existingDocTypes.forEach((d) => {
    docMap[d.code] = d.id;
  });

  // ─── 2. Requests ─────────────────────────────────────────────────────────────

  const requestData = [
    // Juan — Student — multiple statuses for UI testing
    {
      tracking_number: 'EDOC-2026-000001',
      user_id: userMap['2021-00001'],
      document_type_id: docMap['TOR'],
      purpose: 'Employment',
      copies: 2,
      release_mode: 'digital',
      status: 'In Process',
      fee_amount: '150.00',
      payment_status: 'Paid',
      sla_due_at: new Date('2026-05-10'),
    },
    {
      tracking_number: 'EDOC-2026-000002',
      user_id: userMap['2021-00001'],
      document_type_id: docMap['COE'],
      purpose: 'Scholarship Application',
      copies: 1,
      release_mode: 'digital',
      status: 'Ready for Release',
      fee_amount: '50.00',
      payment_status: 'Paid',
      sla_due_at: new Date('2026-05-07'),
    },
    {
      tracking_number: 'EDOC-2026-000003',
      user_id: userMap['2021-00001'],
      document_type_id: docMap['COG'],
      purpose: 'Board Examination',
      copies: 1,
      release_mode: 'digital',
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Unpaid',
      sla_due_at: new Date('2026-05-08'),
    },
    {
      tracking_number: 'EDOC-2026-000004',
      user_id: userMap['2021-00001'],
      document_type_id: docMap['CGMC'],
      purpose: 'Government Requirement',
      copies: 1,
      release_mode: 'physical',
      status: 'Released',
      fee_amount: '50.00',
      payment_status: 'Paid',
      sla_due_at: new Date('2026-05-05'),
    },
    {
      tracking_number: 'EDOC-2026-000005',
      user_id: userMap['2021-00001'],
      document_type_id: docMap['TC'],
      purpose: 'Transfer to another school',
      copies: 1,
      release_mode: 'physical',
      status: 'Action Required',
      fee_amount: '100.00',
      payment_status: 'Pending Verification',
      sla_due_at: new Date('2026-05-09'),
    },
    // Maria — Student
    {
      tracking_number: 'EDOC-2026-000006',
      user_id: userMap['2021-00002'],
      document_type_id: docMap['COE'],
      purpose: 'Loan Application',
      copies: 1,
      release_mode: 'digital',
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Unpaid',
      sla_due_at: new Date('2026-05-11'),
    },
    // Pedro — Faculty
    {
      tracking_number: 'EDOC-2026-000007',
      user_id: userMap['FAC-2019-001'],
      document_type_id: docMap['SR'],
      purpose: 'Personal Record',
      copies: 1,
      release_mode: 'physical',
      status: 'In Process',
      fee_amount: '0.00',
      payment_status: 'Paid',
      sla_due_at: new Date('2026-05-09'),
    },
    // Rosa — NonTeachingStaff
    {
      tracking_number: 'EDOC-2026-000008',
      user_id: userMap['NTS-2020-001'],
      document_type_id: docMap['COEMPL'],
      purpose: 'Bank Requirement',
      copies: 2,
      release_mode: 'digital',
      status: 'Pending',
      fee_amount: '0.00',
      payment_status: 'Paid',
      sla_due_at: new Date('2026-05-08'),
    },
  ];

  await db.insert(document_requests).values(requestData).onConflictDoNothing();

  console.log(`  Document requests: ${requestData.length}`);

  // ─── 3. Clearance tasks for In Process requests ───────────────────────────

  console.log('Seeding clearance tasks...');

  const insertedRequests = await db.select().from(document_requests);
  const reqMap: Record<string, string> = {};
  insertedRequests.forEach((r) => {
    reqMap[r.tracking_number] = r.id;
  });

  const existingOffices = await db.select().from(clearance_requirements);

  // TOR (EDOC-2026-000001) — In Process
  // parallel tasks: LIB cleared, UCF cleared, PSO pending, OSAS pending
  // OUR not created yet
  const torReqs = existingOffices.filter((r) => r.document_type_id === docMap['TOR']);

  const torTasks = torReqs
    .filter((r) => r.sequence_order === null)
    .map((r) => ({
      request_id: reqMap['EDOC-2026-000001'],
      office_id: r.office_id,
      status: 'Pending',
      sequence_order: null,
    }));

  if (torTasks.length > 0) {
    await db.insert(clearance_tasks).values(torTasks).onConflictDoNothing();
  }

  // COE (EDOC-2026-000002) — Ready for Release
  // OUR already cleared
  const coeReqs = existingOffices.filter((r) => r.document_type_id === docMap['COE']);

  const coeTasks = coeReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000002'],
    office_id: r.office_id,
    status: 'Cleared',
    sequence_order: r.sequence_order,
  }));

  if (coeTasks.length > 0) {
    await db.insert(clearance_tasks).values(coeTasks).onConflictDoNothing();
  }

  console.log('Done! Request seed summary:');
  console.log(`  Document requests: ${requestData.length}`);
}
