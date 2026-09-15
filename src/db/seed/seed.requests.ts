import { inArray, isNotNull, sql } from 'drizzle-orm';
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
    },
    {
      tracking_number: 'EDOC-2026-000003',
      user_id: userMap['2021307001'],
      document_type_id: docMap['COG'],
      purpose: 'Board Examination',
      copies: 1,
      // Matches one of Juan's actual enrolled terms (see seed.academic-records.ts)
      // — demonstrates the COG academic-records panel confirming the requested
      // term is on file.
      school_year: '2024-2025',
      semester: '2nd Semester',
      // All tasks will be seeded as Pending below.
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Unpaid',
    },
    {
      tracking_number: 'EDOC-2026-000004',
      user_id: userMap['2021307001'],
      document_type_id: docMap['COR'],
      purpose: 'Scholarship Application',
      copies: 1,
      // COR now mirrors COE (single OUR clearance requirement) — all
      // requirements cleared, consistent with 'Ready for Release'.
      status: 'Ready for Release',
      fee_amount: '50.00',
      payment_status: 'Paid',
    },
    // Maria — Student (graduated) — requesting a TOR for employment
    {
      tracking_number: 'EDOC-2026-000005',
      user_id: userMap['2021307002'],
      document_type_id: docMap['COE'],
      purpose: 'Loan Application',
      copies: 1,
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Unpaid',
    },
    {
      tracking_number: 'EDOC-2026-000007',
      user_id: userMap['2021307002'],
      document_type_id: docMap['TOR'],
      purpose: 'Employment',
      copies: 2,
      status: 'Pending',
      fee_amount: '150.00',
      payment_status: 'Paid',
    },
    // Carlo — Student (transferred out) — requesting a TOR to transfer credits
    {
      tracking_number: 'EDOC-2026-000006',
      user_id: userMap['2020307003'],
      document_type_id: docMap['TOR'],
      purpose: 'Transfer to another university',
      copies: 2,
      status: 'Pending',
      fee_amount: '150.00',
      payment_status: 'Paid',
    },
    // Carlo — requesting a COG for the last term he actually completed, for
    // credential evaluation at his new school.
    {
      tracking_number: 'EDOC-2026-000008',
      user_id: userMap['2020307003'],
      document_type_id: docMap['COG'],
      purpose: 'Credential Evaluation',
      copies: 1,
      school_year: '2023-2024',
      semester: '1st Semester',
      status: 'Pending',
      fee_amount: '50.00',
      payment_status: 'Paid',
    },
  ];

  // Upsert on tracking_number so re-running the seed (without db:fresh) keeps
  // these demo requests in sync as their fields evolve — same pattern as
  // users/document_types in the other seed files.
  await db.insert(document_requests).values(requestData).onConflictDoUpdate({
    target: document_requests.tracking_number,
    set: {
      user_id: sql`excluded.user_id`,
      document_type_id: sql`excluded.document_type_id`,
      purpose: sql`excluded.purpose`,
      copies: sql`excluded.copies`,
      status: sql`excluded.status`,
      fee_amount: sql`excluded.fee_amount`,
      payment_status: sql`excluded.payment_status`,
      school_year: sql`excluded.school_year`,
      semester: sql`excluded.semester`,
      updated_at: new Date(),
    },
  });

  // ─── 3. Clearance tasks ───────────────────────────────────────────────────────

  console.log('Seeding clearance tasks...');

  const insertedRequests = await db.select().from(document_requests);
  const reqMap: Record<string, string> = {};
  const trackingByRequestId: Record<string, string> = {};
  insertedRequests.forEach((r) => {
    reqMap[r.tracking_number] = r.id;
    trackingByRequestId[r.id] = r.tracking_number;
  });

  const existingOffices = await db.select().from(clearance_requirements);

  let totalTasks = 0;

  // ── TOR (EDOC-2026-000001) — Pending ──────────────────────────────────────
  // TOR is Registrar-only (single sequential requirement at OUR) — mirrors
  // what createClearanceTasks() does for real requests since there are no
  // parallel requirements to wait on.
  const torReqs = existingOffices.filter((r) => r.document_type_id === docMap['TOR']);
  const torTasks = torReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000001'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (torTasks.length > 0) {
    await db.insert(clearance_tasks).values(torTasks).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
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
    await db.insert(clearance_tasks).values(coeTasks).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
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
    await db.insert(clearance_tasks).values(cogTasks).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
    totalTasks += cogTasks.length;
  }

  // ── COR (EDOC-2026-000004) — Ready for Release ───────────────────────────
  // All requirements cleared — consistent with 'Ready for Release' status,
  // same pattern as COE's EDOC-2026-000002 above.
  const corReqs = existingOffices.filter((r) => r.document_type_id === docMap['COR']);
  const corTasks = corReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000004'],
    office_id: r.office_id,
    status: 'Cleared',
    sequence_order: r.sequence_order,
  }));

  if (corTasks.length > 0) {
    await db.insert(clearance_tasks).values(corTasks).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
    totalTasks += corTasks.length;
  }

  // ── TOR (EDOC-2026-000006) — Carlo — Pending ─────────────────────────────
  // Reusing TOR's (Registrar-only) requirement; task pending.
  const torTasksCarlo = torReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000006'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (torTasksCarlo.length > 0) {
    await db.insert(clearance_tasks).values(torTasksCarlo).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
    totalTasks += torTasksCarlo.length;
  }

  // ── COE Maria (EDOC-2026-000005) — Pending ───────────────────────────────
  // Reusing COE requirements; all tasks pending.
  const coe2Tasks = coeReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000005'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (coe2Tasks.length > 0) {
    await db.insert(clearance_tasks).values(coe2Tasks).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
    totalTasks += coe2Tasks.length;
  }

  // ── TOR (EDOC-2026-000007) — Maria — Pending ─────────────────────────────
  // Reusing TOR's (Registrar-only) requirement; task pending.
  const torTasksMaria = torReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000007'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (torTasksMaria.length > 0) {
    await db.insert(clearance_tasks).values(torTasksMaria).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
    totalTasks += torTasksMaria.length;
  }

  // ── COG (EDOC-2026-000008) — Carlo — Pending ─────────────────────────────
  // Reusing COG requirements; all tasks pending.
  const cogTasksCarlo = cogReqs.map((r) => ({
    request_id: reqMap['EDOC-2026-000008'],
    office_id: r.office_id,
    status: 'Pending',
    sequence_order: r.sequence_order,
  }));

  if (cogTasksCarlo.length > 0) {
    await db.insert(clearance_tasks).values(cogTasksCarlo).onConflictDoUpdate({
      target: [clearance_tasks.request_id, clearance_tasks.office_id],
      set: { status: sql`excluded.status`, sequence_order: sql`excluded.sequence_order` },
    });
    totalTasks += cogTasksCarlo.length;
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

    // Deterministic per-run key — re-seeding hits the same row instead of
    // inserting a new duplicate each time (see audit_log.seed_key).
    const seedKey = `REQUEST_SUBMITTED:${request.tracking_number}:seed`;

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
      seed_key: seedKey,
    }).onConflictDoNothing({ target: audit_log.seed_key, where: isNotNull(audit_log.seed_key) });
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
    const trackingNumber = trackingByRequestId[task.request_id];

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
        seed_key: `CLEARANCE_CLEARED:${trackingNumber}:${officeCode}:seed`,
      }).onConflictDoNothing({ target: audit_log.seed_key, where: isNotNull(audit_log.seed_key) });
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
        seed_key: `CLEARANCE_REJECTED:${trackingNumber}:${officeCode}:seed`,
      }).onConflictDoNothing({ target: audit_log.seed_key, where: isNotNull(audit_log.seed_key) });
    }
  }

  console.log('  Audit logs seeded.');
}
