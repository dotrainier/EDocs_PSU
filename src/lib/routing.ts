import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_requirements, clearance_tasks, document_requests } from '@/db/schema';
import { logAudit } from '@/lib/audit';

export async function advanceRouting(
  requestId: string,
  documentTypeId: number,
  clearedByUserId: string,
): Promise<void> {
  const existingTasks = await db
    .select()
    .from(clearance_tasks)
    .where(eq(clearance_tasks.request_id, requestId));

  const pendingParallel = existingTasks.filter(
    (t) => t.sequence_order === null && t.status === 'Pending',
  );

  if (pendingParallel.length > 0) {
    return;
  }

  const completedSequential = existingTasks
    .filter((t) => t.sequence_order !== null && t.status === 'Cleared')
    .map((t) => t.sequence_order as number);

  const lastCompleted = completedSequential.length > 0 ? Math.max(...completedSequential) : 0;

  const nextReq = await db
    .select()
    .from(clearance_requirements)
    .where(
      and(
        eq(clearance_requirements.document_type_id, documentTypeId),
        eq(clearance_requirements.sequence_order, lastCompleted + 1),
      ),
    )
    .limit(1);

  if (nextReq[0]) {
    await db.insert(clearance_tasks).values({
      request_id: requestId,
      office_id: nextReq[0].office_id,
      status: 'Pending',
      sequence_order: nextReq[0].sequence_order,
    });
    return;
  }

  await db
    .update(document_requests)
    .set({ status: 'Ready for Release', updated_at: new Date() })
    .where(eq(document_requests.id, requestId));

  await logAudit({
    userId: clearedByUserId,
    action: 'REQUEST_READY_FOR_RELEASE',
    details: { requestId },
  });
}
