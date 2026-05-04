import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests } from '@/db/schema';

export async function generateTrackingNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const result = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(document_requests)
    .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);

  const sequence = (result[0].count + 1).toString().padStart(6, '0');
  return `EDOC-${year}-${sequence}`;
}

export function calculateSlaDeadline(workingDays: number): Date {
  const date = new Date();
  let remaining = workingDays;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (day !== 0 && day !== 6) remaining--;
  }

  return date;
}
