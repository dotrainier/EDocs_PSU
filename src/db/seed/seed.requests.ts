import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  document_requests,
  document_types,
  users,
  offices,
  clearance_tasks,
  clearance_requirements,
  audit_log,
} from '@/db/schema';

export async function seedRequests() {
  console.log('Seeding document requests...');

  // ─── 1. Get maps ─────────────────────────────────────────────────────────────

  const existingUsers = await db.select().from(users);
  const userMap: Record<string, string> = {};
  existingUsers.forEach((u) => {
    if (u.school_id) userMap[u.school_id] = u.id;
  });

  const existingDocTypes = await db.select().from(document_types);
  const docMap: Record<string, number> = {};
  existingDocTypes.forEach((d) => {
    docMap[d.code] = d.id;
  });

  // ─── 2. Requests ─────────────────────────────────────────────────────────────

  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  const requestData = [
    // Juan — Student — multiple statuses for UI testing
    {
      tracking_number: 'EDOC-2026-000001',
      user_id: userMap['2021307001'],
      document_type_id: docMap['TOR'],
      purpose: 'Employment',
      copies: 2,
      // All clearance tasks are Pending — no work started yet.
      status: 'Pending',
      fee_amount: '150.00',
      payment_status: 'Paid',
      sla_due_at: daysFromNow(-9), // overdue — SLA breached
    },
    {
      tracking_number: 'EDOC-2026-000002',
      user_id: userMap['2021307001'],
      document_type_id: docMap['COE'],
      purpose: 'Scholarship Application',
      copies: 1,
      // All clearance tasks are Cleared → Ready for Release is correct.
      status: 'Ready for Release',
      fee_amount: '50.00',
      payment_status: 'Paid',
      sla_due_at: daysFromNow(-12), // overdue — SLA breached
    },
    {
      tracking_number: 'EDOC-2026-000003',
      user_id: userMap['2021307001'],
      document_type_id: docMap['COG'],
      purpose: 'Board Examination',
      copies: 1,
      // All tasks will be seeded as Pending below.
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Unpaid',
      sla_due_at: daysFromNow(1), // due tomorrow — SLA warning
    },
    {
      tracking_number: 'EDOC-2026-000004',
      user_id: userMap['2021307001'],
      document_type_id: docMap['COR'],
      purpose: 'Scholarship Application',
      copies: 1,
      // COR requires no clearance — goes straight to Released.
      status: 'Released',
      fee_amount: '0.00',
      payment_status: 'Paid',
      sla_due_at: daysFromNow(-6), // completed — for historical data
    },
    // Maria — Student
    {
      tracking_number: 'EDOC-2026-000005',
      user_id: userMap['2021307002'],
      document_type_id: docMap['COE'],
      purpose: 'Loan Application',
      copies: 1,
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Unpaid',
      sla_due_at: daysFromNow(3), // within SLA — comfortable
    },
  ];

  await db.insert(document_requests).values(requestData).onConflictDoNothing();

  // ─── 3. Clearance tasks ───────────────────────────────────────────────────────

  console.log('Seeding clearance tasks...');

  const insertedRequests = await db.select().from(document_requests);
  const reqMap: Record<string, string> = {};
  insertedRequests.forEach((r) => {
    reqMap[r.tracking_number] = r.id;
  });

  const existingOffices = await db.select().from(clearance_requirements);

  let totalTasks = 0;

  // ── TOR (EDOC-2026-000001) — Pending ──────────────────────────────────────
  // Seeding only parallel requirements (sequence_order === null).
  // Sequential requirements are intentionally excluded for TOR; they are
  // created programmatically after all parallel offices have cleared.
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
    totalTasks += torTasks.length;
  }

  // ── COE (EDOC-2026-000002) — Ready for Release ────────────────────────────
  // All requirements cleared — consistent with 'Ready for Release' status.
  const coeReqs = existingOffices.filter((r) => r.document_type_id === docMap['COE']);
  const coeTasks = coeReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000002'],
    office_id: r.office_id,
    status: 'Cleared',
    sequence_order: r.sequence_order,
  }));

  if (coeTasks.length > 0) {
    await db.insert(clearance_tasks).values(coeTasks).onConflictDoNothing();
    totalTasks += coeTasks.length;
  }

  // ── COG (EDOC-2026-000003) — Pending ─────────────────────────────────────
  // All requirements pending — consistent with 'Pending' status.
  const cogReqs = existingOffices.filter((r) => r.document_type_id === docMap['COG']);
  const cogTasks = cogReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000003'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (cogTasks.length > 0) {
    await db.insert(clearance_tasks).values(cogTasks).onConflictDoNothing();
    totalTasks += cogTasks.length;
  }

  // ── COR (EDOC-2026-000004) — Released ────────────────────────────────────
  // COR has no clearance_requirements rows, so no clearance tasks are seeded.

  // ── COE Maria (EDOC-2026-000005) — Pending ───────────────────────────────
  // Reusing COE requirements; all tasks pending.
  const coe2Tasks = coeReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000005'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (coe2Tasks.length > 0) {
    await db.insert(clearance_tasks).values(coe2Tasks).onConflictDoNothing();
    totalTasks += coe2Tasks.length;
  }

  // ─── 4. Summary ──────────────────────────────────────────────────────────────

  console.log('Done! Request seed summary:');
  console.log(`  Document requests: ${requestData.length}`);
  console.log(`  Clearance tasks:   ${totalTasks}`);

  // ─── 5. Audit logs ───────────────────────────────────────────────────────────

  console.log('Seeding audit logs...');

  // System Administrator as fallback actor for unattributed actions.
  const systemActorId = userMap['ADM-2024-001'];

  // Office code → responsible staff user_id (mirrors seedBase officeStaffData).
  // Using OfficeHead where available, otherwise assigned OfficeStaff.
  // DCO and OSAS have no assigned staff in seed — fall back to system admin.
  const officeActor: Record<string, string> = {
    OUR: userMap['EMP-2015-001'], // Francis Aquino — OUR Head
    UCF: userMap['EMP-2018-002'], // Ben Torres — Cashier Staff
    LIB: userMap['EMP-2018-003'], // Clara Mendoza — Library Staff
    PSO: userMap['EMP-2018-004'], // Diego Lim — Property Staff
    MIS: userMap['EMP-2018-005'], // Elena Cruz — MIS Staff
    DCO: systemActorId,
    OSAS: systemActorId,
  };

  // Build officeId (number) → office code map for actor resolution.
  const allOffices = await db.select().from(offices);
  const officeIdToCode: Record<number, string> = {};
  allOffices.forEach((o) => {
    officeIdToCode[o.id] = o.code;
  });

  // ── REQUEST_SUBMITTED — one entry per request ─────────────────────────────
  for (const request of requestData) {
    const requestId = reqMap[request.tracking_number];
    if (!requestId || !request.user_id) continue;

    await db.insert(audit_log).values({
      user_id: request.user_id,
      action: 'REQUEST_SUBMITTED',
      details: {
        requestId,
        trackingNumber: request.tracking_number,
        documentTypeId: request.document_type_id,
        purpose: request.purpose,
      },
      ip_address: 'seed',
    }).onConflictDoNothing();
  }

  // ── CLEARANCE_CLEARED / CLEARANCE_REJECTED — one entry per relevant task ──
  const seededTasks = await db
    .select()
    .from(clearance_tasks)
    .where(
      inArray(
        clearance_tasks.request_id,
        requestData.map((r) => reqMap[r.tracking_number]).filter(Boolean) as string[],
      ),
    );

  for (const task of seededTasks) {
    const officeCode = officeIdToCode[task.office_id];
    const actorId = officeActor[officeCode] ?? systemActorId;

    if (task.status === 'Cleared') {
      await db.insert(audit_log).values({
        user_id: actorId,
        action: 'CLEARANCE_CLEARED',
        details: {
          taskId: task.id,
          requestId: task.request_id,
          officeId: task.office_id,
          remarks: 'Seeded as cleared',
        },
        ip_address: 'seed',
      }).onConflictDoNothing();
    }

    // Action Required maps to CLEARANCE_REJECTED in the real app flow.
    if (task.status === 'Action Required') {
      await db.insert(audit_log).values({
        user_id: actorId,
        action: 'CLEARANCE_REJECTED',
        details: {
          taskId: task.id,
          requestId: task.request_id,
          officeId: task.office_id,
          remarks: 'Seeded as action required — student response needed',
        },
        ip_address: 'seed',
      }).onConflictDoNothing();
    }
  }

  console.log('  Audit logs seeded.');
}
