# Implementation Guide

This document describes every file that needs to be created or replaced as part of the security and routing overhaul. Follow the sections in order — each section depends on the one before it.

---

## 1. Dependencies

### Remove

```
bcryptjs          — password hashing (cost factor 12)
@types/bcryptjs   — TypeScript types (devDependency)
jose              — JWT signing and verification (session tokens)
zod               — input validation on all API routes
nanoid            — verification tokens, serial numbers, file path segments
qrcode            — QR code generation as base64 data URLs for PDF embedding
@types/qrcode     — TypeScript types (devDependency)
nodemailer        — SMTP email notifications
@types/nodemailer — TypeScript types (devDependency)
drizzle-orm
drizzle-kit
postgres
axios
next
react
react-dom
tailwindcss
lucide-react
shadcn / radix-ui
```

## 2. Environment Variables

```env
# Database
DATABASE_URL=

# Auth — generate with: openssl rand -hex 32
SESSION_SECRET=
JWT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# AI API
AI_API_KEY=
AI_API_URL=
```

---

## 3. Database Schema

### Create — `src/db/schema/`

One file per domain. All exported from `src/db/schema/index.ts`.

#### `identity.schema.ts`

Tables: `roles`, `users`, `sessions`, `data_privacy_consents`

| Table                   | Key columns                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roles`                 | `id`, `name` (Student \| Faculty \| NonTeachingStaff \| OfficeStaff \| OfficeHead \| Admin)                                                                                 |
| `users`                 | `id`, `full_name`, `email`, `password_hash`, `role_id`, `student_or_employee_id`, `course_program`, `year_level`, `status` (Active \| Inactive), `created_at`, `updated_at` |
| `sessions`              | `id`, `user_id`, `token` (unique), `expires_at`, `created_at`                                                                                                               |
| `data_privacy_consents` | `id`, `user_id`, `consented_at`, `consent_version`                                                                                                                          |

#### `office.schema.ts`

Tables: `offices`, `office_staff`

| Table          | Key columns                                                   |
| -------------- | ------------------------------------------------------------- |
| `offices`      | `id`, `name`, `code`, `contact_email`, `is_active`            |
| `office_staff` | `id`, `user_id`, `office_id`, `is_office_head`, `assigned_at` |

#### `document-config.schema.ts`

Tables: `document_types`, `document_templates`, `clearance_requirements`

| Table                    | Key columns                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document_types`         | `id`, `name`, `description`, `issuing_office_id`, `handling_pattern` (GENERATE \| UPLOAD), `template_id`, `fee_amount`, `sla_working_days`, `requires_clearance`, `is_active` |
| `document_templates`     | `id`, `name`, `component_path`, `variable_schema` (jsonb), `version`, `is_active`                                                                                             |
| `clearance_requirements` | `id`, `document_type_id`, `office_id`, `sequence_order` (nullable — null = parallel), `is_required`                                                                           |

#### `request.schema.ts`

Tables: `document_requests`, `clearance_tasks`, `request_status_history`, `internal_notes`

| Table                    | Key columns                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document_requests`      | `id`, `tracking_number`, `user_id`, `document_type_id`, `purpose`, `status`, `priority`, `ai_classification`, `ai_confidence`, `payment_proof_path`, `sla_due_at`, `created_at`, `updated_at` |
| `clearance_tasks`        | `id`, `request_id`, `office_id`, `status` (Pending \| Cleared \| Rejected), `remarks`, `cleared_by`, `cleared_at`, `sequence_order`                                                           |
| `request_status_history` | `id`, `request_id`, `status`, `remarks`, `changed_by`, `changed_at` — **append-only**                                                                                                         |
| `internal_notes`         | `id`, `request_id`, `author_user_id`, `body`, `created_at`                                                                                                                                    |

#### `document-output.schema.ts`

Tables: `generated_documents`, `document_attachments`, `document_verifications`

| Table                    | Key columns                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generated_documents`    | `id`, `request_id`, `serial_number`, `file_path`, `file_hash` (SHA-256 hex), `verification_token` (unique nanoid), `generated_by`, `generated_at`, `is_revoked`, `revoked_at`, `revoked_reason` |
| `document_attachments`   | `id`, `request_id`, `file_path`, `file_type`, `file_size`, `uploaded_by`, `uploaded_at`                                                                                                         |
| `document_verifications` | `id`, `generated_document_id`, `scanned_at`, `ip_address`, `user_agent` — **append-only**                                                                                                       |

#### `notification.schema.ts`

Tables: `notifications`, `audit_log`

| Table           | Key columns                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `notifications` | `id`, `user_id`, `request_id`, `type`, `message`, `is_read`, `created_at`, `sent_via_email` |
| `audit_log`     | `id`, `user_id`, `action`, `details` (jsonb), `ip_address`, `timestamp` — **append-only**   |

### `src/db/schema/index.ts`

Re-export everything:

```typescript
export * from './identity.schema';
export * from './office.schema';
export * from './document-config.schema';
export * from './request.schema';
export * from './document-output.schema';
export * from './notification.schema';
```

### Migration

After updating the schema files, run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 4. Library Files — `src/lib/`

### Delete

```
src/lib/supabase/          (entire folder)
```

### Create

#### `src/lib/auth.ts`

Purpose: Custom session management — no Supabase.

Exports:

- `createSession(userId, response)` — inserts a row in `sessions`, sets HTTP-only `edocs_session` cookie (Secure, SameSite=Strict, 7-day expiry)
- `getSession(request)` — reads cookie, queries `sessions` joined with `users` and `roles`, returns `Session | null`
- `destroySession(request, response)` — deletes session row, clears cookie

Libraries used: `jose` (token signing), `drizzle-orm`, native `cookies()` from Next.js

Session token structure (signed JWT stored in cookie):

```
{ sessionId, userId }  signed with JWT_SECRET
```

The actual role and officeId are always read fresh from the DB on each request — never trusted from the cookie payload alone.

#### `src/lib/integrity.ts`

Purpose: SHA-256 document hashing for tamper detection.

Exports:

- `hashDocument(buffer: Buffer): Promise<string>` — returns hex digest
- `verifyDocument(buffer: Buffer, storedHash: string): Promise<boolean>`

Libraries used: Node.js built-in `crypto` — no extra package needed.

#### `src/lib/audit.ts`

Purpose: Centralised, append-only audit logger.

Exports:

- `logAudit(entry: AuditEntry): Promise<void>`

```typescript
type AuditEntry = {
  userId: string | null; // null for unauthenticated actions (e.g. failed login)
  action: AuditAction;
  details: Record<string, unknown>;
  ipAddress: string;
};

type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_CANCELLED'
  | 'STATUS_UPDATED'
  | 'CLEARANCE_CLEARED'
  | 'CLEARANCE_REJECTED'
  | 'DOCUMENT_GENERATED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_REVOKED'
  | 'DOCUMENT_UPLOADED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_CHANGED'
  | 'OFFICE_CREATED'
  | 'OFFICE_UPDATED'
  | 'OFFICE_DEACTIVATED'
  | 'TEMPLATE_UPDATED'
  | 'CLEARANCE_REQUIREMENT_CHANGED'
  | 'VERIFICATION_SCANNED';
```

Libraries used: `drizzle-orm`

#### `src/lib/routing.ts`

Purpose: Automated clearance task creation — the routing engine.

Exports:

- `createClearanceTasks(params: { requestId: string; documentTypeId: string; db: DrizzleDB }): Promise<void>`

Logic:

1. Query `clearance_requirements` for the given `documentTypeId`, ordered by `sequence_order ASC NULLS FIRST`.
2. If all requirements have `sequence_order = null` → insert all `clearance_tasks` with status `Pending` at once (parallel).
3. If any have numbered `sequence_order` → insert only `sequence_order = 1` now; subsequent tasks are created by `advanceRouting()` when the previous task is `Cleared`.

- `advanceRouting(params: { requestId: string; completedSequenceOrder: number; db: DrizzleDB }): Promise<void>` — called by the clearance action handler after a task is marked Cleared.

Libraries used: `drizzle-orm`

#### `src/lib/mailer.ts`

Purpose: Send transactional email notifications via SMTP.

Exports:

- `sendMail(to: string, subject: string, html: string): Promise<void>`

Libraries used: `nodemailer`
Config reads from: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

#### `src/lib/ai.ts`

Purpose: Wrapper for the external AI API (Gemini 2.0 Flash).

Exports:

- `classifyRequest(purpose: string, availableTypes: string[]): Promise<{ type: string; confidence: number }>`
- `autofillTemplate(userProfile: object, documentType: string): Promise<Record<string, string>>`
- `checkCompleteness(formData: object): Promise<{ issues: string[] }>`
- `suggestPriority(requestData: object): Promise<'Normal' | 'High' | 'Urgent'>`

Config reads from: `AI_API_KEY`, `AI_API_URL`
All AI results are suggestions only — staff always have final say.

#### `src/lib/sla.ts`

Purpose: SLA working-day calculator.

Exports:

- `getSlaDeadline(submittedAt: Date, workingDays: number): Date` — excludes weekends
- `getSlaStatus(submittedAt: Date, deadline: Date): 'OnTrack' | 'AtRisk' | 'Breached'`
  - `OnTrack` = < 75% of working days elapsed
  - `AtRisk` = ≥ 75% elapsed
  - `Breached` = past deadline

Libraries used: none (pure date math)

#### `src/lib/utils.ts`

Purpose: General helpers.

Exports:

- `cn(...classes)` — clsx + tailwind-merge
- `formatDate(date: Date): string` — `DD MMMM YYYY`
- `generateTrackingNumber(): string` — format `EDOC-YYYY-NNNNNN`
- `generateSerialNumber(officeCode: string, docTypeCode: string): string` — format `PSU-{officeCode}-{docTypeCode}-YYYY-NNNNNN`

---

## 5. Route Protection — `proxy.ts`

Replace the entire file. No Supabase imports.

Structure:

```
proxy.ts
├── Read cookie → verify JWT → extract sessionId
├── Query sessions JOIN users JOIN roles JOIN office_staff
├── Check expiry → if expired, clear cookie + redirect /login
└── Route matching:
    ├── public paths → NextResponse.next()
    ├── /login + /register → if session, redirect by role:
    │     Student/Faculty/NonTeachingStaff → /dashboard
    │     OfficeStaff/OfficeHead → /office/dashboard
    │     Admin → /admin/dashboard
    ├── /dashboard, /request/*, /history, /profile
    │     → require Student | Faculty | NonTeachingStaff
    ├── /office/*
    │     → require OfficeStaff | OfficeHead
    ├── /admin/*
    │     → require Admin
    └── /api/* → pass through (each handler checks session itself)
```

Libraries: `jose`, `drizzle-orm`, `next/server`

---

## 6. API Routes — `src/app/api/`

### Auth

#### `auth/login/route.ts` — replace existing

- `POST`: parse body with zod, query user by email/username, `bcrypt.compare()`, call `createSession()`, call `logAudit('LOGIN_SUCCESS')`, return user info
- On wrong password: `logAudit('LOGIN_FAILED')`, return 401

#### `auth/register/route.ts` — create

- `POST`: validate with zod, check email uniqueness, `bcrypt.hash(password, 12)`, insert user, record `data_privacy_consent`, call `logAudit('REGISTER')`, return 201

#### `auth/logout/route.ts` — create

- `POST`: call `destroySession()`, call `logAudit('LOGOUT')`, return 200

### Requests

#### `requests/route.ts` — create

- `GET`: list requests scoped to the session user
- `POST`: validate, insert `document_request`, call `createClearanceTasks()`, call AI classification, call `logAudit('REQUEST_SUBMITTED')`, send confirmation email via `sendMail()`

#### `requests/[id]/route.ts` — create

- `GET`: fetch single request with status history and clearance tasks
- `PATCH`: update status (staff only), call `logAudit('STATUS_UPDATED')`, insert `request_status_history` row
- `DELETE`: cancel if still in Pending (user only), call `logAudit('REQUEST_CANCELLED')`

#### `requests/[id]/clearance/route.ts` — create

- `PATCH`: mark clearance task Cleared or Rejected (office staff, scoped to their office), call `advanceRouting()` if Cleared, call `logAudit('CLEARANCE_CLEARED' | 'CLEARANCE_REJECTED')`, notify user

### Documents

#### `documents/generate/route.ts` — create

- `POST`: render PDF via Puppeteer, call `hashDocument()`, store hash in `generated_documents.file_hash`, embed QR code, call `logAudit('DOCUMENT_GENERATED')`

#### `documents/download/[id]/route.ts` — create

- `GET`: require session, fetch file, call `verifyDocument()` (fail hard if hash mismatch), stream file, call `logAudit('DOCUMENT_DOWNLOADED')`

#### `documents/upload/route.ts` — create

- `POST`: Pattern B scan upload, validate file type and size, store under `/uploads/scans/{nanoid()}.pdf`, call `logAudit('DOCUMENT_UPLOADED')`

### Verify (public)

#### `verify/[token]/route.ts` — create

- `GET`: no auth required, look up `generated_documents` by `verification_token`, insert `document_verifications` row (scan log), call `logAudit('VERIFICATION_SCANNED')` with userId null, return masked document info

### Admin

#### `admin/users/route.ts` — create

- `GET` / `POST`: list and create users (Admin only), call `logAudit()`

#### `admin/users/[id]/route.ts` — create

- `PATCH`: edit user or role, call `logAudit('USER_UPDATED' | 'ROLE_CHANGED')`
- `DELETE`: deactivate (soft delete), call `logAudit('USER_DEACTIVATED')`

#### `admin/offices/route.ts` — create

- `GET` / `POST` / `PATCH`: manage offices, call `logAudit()`

#### `admin/document-types/route.ts` — create

- `GET` / `POST` / `PATCH`: manage document types and clearance requirements (the routing config), call `logAudit('CLEARANCE_REQUIREMENT_CHANGED')`

#### `admin/reports/route.ts` — create

- `GET`: aggregate stats — requests by status, type, office; SLA breach rates; average processing time

#### `admin/audit-logs/route.ts` — create

- `GET`: paginated audit log (Admin only), supports filter by action, user, date range

### Notifications

#### `notifications/route.ts` — create

- `GET`: list unread notifications for the session user
- `PATCH`: mark as read

---

## 7. Summary — Files to Delete

```
src/db/schema/profiles.schema.ts
src/lib/supabase/              (entire folder)
drizzle/0000_*.sql             (old migrations — regenerate from scratch)
drizzle/0001_*.sql
drizzle/0002_*.sql
drizzle/meta/                  (regenerated by drizzle-kit)
```

---

## 8. Files to Keep Unchanged

```
drizzle.config.ts
next.config.ts
tsconfig.json
.gitignore
src/lib/axios.ts
src/app/page.tsx               (landing page — no auth dependency)
src/components/ui/             (shadcn primitives)
globals.css
```
