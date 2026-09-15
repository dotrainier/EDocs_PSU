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
