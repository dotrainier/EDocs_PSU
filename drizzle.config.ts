import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

export default defineConfig({
  // Globbed (rather than pointed at schema/index.ts) so drizzle-kit also picks
  // up src/db/schema/academic-records.schema.ts, which is intentionally kept
  // out of the index barrel — see that file for why.
  schema: './src/db/schema/*.schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Defaults to ['public'] — must be extended so drizzle-kit also manages the
  // isolated `academic_records` schema (see academic-records.schema.ts).
  schemaFilter: ['public', 'academic_records'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
