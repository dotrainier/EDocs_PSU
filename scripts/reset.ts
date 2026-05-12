import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, client } from '../src/db';

async function reset() {
  try {
    await db.execute(sql`DROP SCHEMA public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);

    console.log('Database reset complete');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
