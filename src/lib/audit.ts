/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db';
import { audit_log } from '@/db/schema';

interface AuditEntry {
  userId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  await db.insert(audit_log).values({
    user_id: entry.userId,
    action: entry.action,
    details: entry.details,
    ip_address: entry.ipAddress,
    timestamp: new Date(),
  });
}
