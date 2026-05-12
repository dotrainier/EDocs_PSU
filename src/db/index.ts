import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });
const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client);
export { client };
