import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, client } from '../src/db';

async function reset() {
  try {
    await db.execute(sql`DROP SCHEMA public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    // Isolated academic-records schema (see src/db/schema/academic-records.schema.ts)
    // lives outside `public`, so it needs its own drop or a fresh reset would
    // leave it behind — orphaned once `public.users` is recreated with new ids.
    await db.execute(sql`DROP SCHEMA IF EXISTS academic_records CASCADE`);

    console.log('Database reset complete');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
