import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface RequiredVar {
  key: string;
  description: string;
}

// Treats every uncommented KEY= line in .env.example as required, using the
// comment block directly above it (if any) as the human-readable description.
// This is the only source of truth for what setup checks — keeping
// .env.example current is what keeps this check current too.
function parseRequiredVars(envExampleContent: string): RequiredVar[] {
  const vars: RequiredVar[] = [];
  let pendingComment: string[] = [];

  for (const rawLine of envExampleContent.split('\n')) {
    const line = rawLine.trim();

    if (line === '') {
      pendingComment = [];
      continue;
    }

    if (line.startsWith('#')) {
      pendingComment.push(line.replace(/^#\s?/, ''));
      continue;
    }

    const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (match) {
      vars.push({ key: match[1], description: pendingComment.join(' ') });
      pendingComment = [];
    }
  }

  return vars;
}

function run(command: string) {
  execSync(command, { stdio: 'inherit' });
}

function main() {
  const root = process.cwd();
  const envExamplePath = path.join(root, '.env.example');
  const envPath = path.join(root, '.env');

  if (!fs.existsSync(envExamplePath)) {
    console.error('Cannot find .env.example in the project root — nothing to check against.');
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    console.log('No .env file found.\n');
    console.log('Create one by copying .env.example, then fill in the values:\n');
    console.log('  cp .env.example .env\n');
    console.log('Then run `npm run setup` again.');
    process.exit(1);
  }

  const requiredVars = parseRequiredVars(fs.readFileSync(envExamplePath, 'utf-8'));
  const missing = requiredVars.filter(
    ({ key }) => !process.env[key] || process.env[key]!.trim() === '',
  );

  if (missing.length > 0) {
    console.log("Setup can't continue — the following required value(s) are missing from .env:\n");
    missing.forEach(({ key, description }) => {
      console.log(`  - ${key}${description ? `: ${description}` : ''}`);
    });
    console.log('\nFill these in, then run `npm run setup` again.');
    process.exit(1);
  }

  console.log('All required environment variables are present.\n');

  console.log('Pushing database schema...\n');
  run('npx drizzle-kit push');

  console.log('\nSeeding demo data...\n');
  run('npm run seed');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('\nSetup complete!\n');
  console.log('Next steps:');
  console.log('  1. npm run dev');
  console.log(`  2. Open ${appUrl}\n`);
  console.log('Demo logins (password: password123):');
  console.log('  Student:      juan.delacruz@psu.edu.ph');
  console.log('  Office Staff: registrar.staff@psu.edu.ph');
  console.log('  Office Head:  registrar.head@psu.edu.ph');
  console.log('  Admin:        admin@psu.edu.ph');
}

main();
