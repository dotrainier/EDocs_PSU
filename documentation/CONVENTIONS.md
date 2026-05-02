# Project Conventions

Follow these patterns when generating code for this project.

---

## Tech Stack

- Next.js 14 with the App Router
- TypeScript everywhere
- Axios through `@/lib/axios`
- Drizzle ORM for all database queries
- Custom session-based authentication — **no Supabase Auth** (see Auth section below)
- `bcryptjs` for password hashing
- `jose` for JWT signing/verification
- `zod` for all input validation
- `nodemailer` for email notifications
- `nanoid` for verification tokens and serial numbers
- `qrcode` for QR code generation embedded in PDFs
- Shadcn UI components from `@/components/ui`, styled with Tailwind CSS

---

## General Style

- Prefer small, typed functions over untyped helpers
- Keep component logic and page logic close to the file that uses it
- Use clear, explicit return types when they improve readability
- Keep imports grouped by external packages first, then app aliases

---

## Authentication

**Do not use Supabase Auth. Do not import from `@supabase/ssr` or `@supabase/supabase-js`.**

Authentication is fully self-managed using DB sessions and HTTP-only cookies.

### Session flow

1. On login: verify password with `bcryptjs`, create a row in the `sessions` table, set an HTTP-only `Secure` cookie containing the session token.
2. On every request: `proxy.ts` reads the cookie, looks up the session in the DB, validates expiry, reads `role` and `office_id` from the joined user row.
3. On logout: delete the session row and clear the cookie.

### Auth helpers — always import from `@/lib/auth`

```typescript
import { getSession, createSession, destroySession } from '@/lib/auth';

// In a Server Component or API route:
const session = await getSession(request);
if (!session) return redirect('/login');

// Session shape:
type Session = {
  userId: string;
  role: 'Student' | 'Faculty' | 'NonTeachingStaff' | 'OfficeStaff' | 'OfficeHead' | 'Admin';
  officeId: string | null;
  expiresAt: Date;
};
```

### Route protection — `proxy.ts`

`proxy.ts` is the single source of truth for route guards. It enforces both authentication and role. Rules:

```
/                         → public, always allow
/login, /register         → redirect to /dashboard if session exists
/dashboard, /request/*,
/history, /profile        → require session + front-user role
                            (Student | Faculty | NonTeachingStaff)
/office/*                 → require session + OfficeStaff or OfficeHead role
/admin/*                  → require session + Admin role
/verify/*                 → public, always allow
/api/*                    → each route handler calls getSession() independently
```

Never rely on client-side checks for access control. The proxy and API routes are the enforcement layer.

### Password rules

- Always hash with `bcryptjs` at cost factor 12: `await bcrypt.hash(password, 12)`
- Never store plain text. Never log passwords.
- On login: `await bcrypt.compare(plaintext, hash)`

---

## Audit Trail

**Every state-changing action must write an audit log entry. No exceptions.**

Call `logAudit()` from `@/lib/audit` after any of the following actions: login attempt, request submission, status update, clearance action, document generation, document upload, account changes, role/office assignment changes.

```typescript
import { logAudit } from '@/lib/audit';

await logAudit({
  userId: session.userId,
  action: 'REQUEST_SUBMITTED',
  details: { requestId, documentTypeId },
  ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
});
```

- Audit log rows are **append-only**. Never UPDATE or DELETE from `audit_log`.
- `details` must be a plain serialisable object — no class instances, no circular refs.
- Failed attempts (e.g. wrong password) must also be logged with `action: 'LOGIN_FAILED'`.

---

## Document Integrity

Every system-generated PDF (Pattern A) must be tamper-evident.

```typescript
import { hashDocument, verifyDocument } from '@/lib/integrity';

// After generating the PDF buffer:
const hash = await hashDocument(pdfBuffer);
// Store hash in generated_documents.file_hash alongside the file path

// On download — re-hash and compare:
const isValid = await verifyDocument(pdfBuffer, storedHash);
if (!isValid) throw new Error('Document integrity check failed');
```

- Algorithm: SHA-256 via Node.js built-in `crypto` — no external dependency needed.
- Store the hex digest in `generated_documents.file_hash`.
- Serve PDFs only through authenticated API routes — never as raw static file URLs.
- File paths must use `nanoid()` segments so they are non-guessable.

---

## Routing Engine

Document routing is **automated**. When a request is submitted, `createClearanceTasks()` reads `clearance_requirements` for that document type and creates all required `clearance_tasks`. Staff do not manually assign or route requests.

```typescript
import { createClearanceTasks } from '@/lib/routing';

// Called immediately after inserting a DocumentRequest row:
await createClearanceTasks({ requestId, documentTypeId, db });
```

- `sequence_order = null` → parallel tasks (all created at once).
- `sequence_order = 1, 2, 3` → sequential tasks (next task is only created after previous is `Cleared`).
- Adding or removing an office from a document type's routing chain is done through the Admin UI — no code changes needed.

---

## API Calls (client-side)

Always use the `api` helper from `@/lib/axios`; do not use the raw axios instance directly.

```typescript
import { api } from '@/lib/axios';

type LoginResponse = {
  message: string;
  user: { email: string | null } | null;
};

async function submitLogin(username: string, password: string) {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  return response;
}
```

---

## Input Validation

All API route inputs must be validated with `zod` before touching the database.

```typescript
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
});

const parsed = schema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
}
```

---

## Pages

- Use `page.tsx` for route pages
- Use `export default function` for page components
- Keep pages focused on composition and state for that route

---

## Components

- Use function declarations, not arrow functions, for components
- Put the props interface above the component
- Export the component at the bottom of the file

```typescript
interface ButtonProps {
  label: string;
}

function Button({ label }: ButtonProps) {
  return <button>{label}</button>;
}

export default Button;
```

---

## API Routes

- Use the App Router route handler pattern
- Return responses with `NextResponse.json`
- Always call `getSession()` first in protected routes
- Always call `logAudit()` after any state change
- Validate all inputs with `zod` before database access
- Use `try/catch` with `error instanceof Error` for safe error messages

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const schema = z.object({ documentTypeId: z.string().uuid() });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    // ... do work ...

    await logAudit({
      userId: session.userId,
      action: 'REQUEST_SUBMITTED',
      details: parsed.data,
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return NextResponse.json({ message: 'Success' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
```

---

## Error Handling

Use `unknown` in `catch` blocks and narrow before reading `message`.

```typescript
try {
  // work
} catch (err: unknown) {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : 'An unexpected error occurred';
}
```

---

## Database Access

- Use Drizzle query builders instead of hand-written SQL
- Keep all database access in server-side files only (API routes, Server Components, lib files)
- Select only the columns you need
- **Never UPDATE or DELETE from `audit_log`, `request_status_history`, or `document_verifications`** — these tables are append-only by design

```typescript
const user = await db
  .select({ id: users.id, role: roles.name, officeId: officeStaff.officeId })
  .from(users)
  .innerJoin(roles, eq(users.roleId, roles.id))
  .leftJoin(officeStaff, eq(officeStaff.userId, users.id))
  .where(eq(users.email, email))
  .limit(1);
```

---

## File Naming

- Pages: `page.tsx`
- Components: `PascalCase.tsx`
- Utilities and lib files: `camelCase.ts`
- Schema files: `*.schema.ts` inside `src/db/schema/`
- Types: `types.ts` or inline when the type is local to the file
