# Implementation Guide

This document describes every file that needs to be created or replaced as part of the security and routing overhaul. Follow the sections in order — each section depends on the one before it.

---

## 1. Dependencies

### Remove

```
@supabase/ssr
@supabase/supabase-js
```

### Add

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
```

### Keep

```
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

---

## 2. Environment Variables

Replace `.env` with the following. Remove all `SUPABASE_*` keys.

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

### Delete

```
src/db/schema/profiles.schema.ts
```

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

- `createClearanceTasks(requestId, documentTypeId)` — called on submission, creates initial clearance tasks
- `advanceRouting(requestId, documentTypeId)` — called after every clearance action, decides what happens next

Libraries used: `drizzle-orm`

---

## Routing Engine — How `sequence_order` Works

`sequence_order` in `clearance_requirements` controls **when a task is created**, not just its order.

| Value  | Meaning                | When task is created              |
| ------ | ---------------------- | --------------------------------- |
| `null` | Parallel task          | Immediately on request submission |
| `1`    | First sequential step  | After ALL null tasks are Cleared  |
| `2`    | Second sequential step | After sequence_order 1 is Cleared |
| `3`    | Third sequential step  | After sequence_order 2 is Cleared |

**Important:** `sequence_order = 1` does NOT mean "created first". It means "first in the sequential chain". It is always created AFTER all parallel (null) tasks are done.

### createClearanceTasks() logic

```
On submission:
  1. Read clearance_requirements for documentTypeId
  2. Separate into:
       parallelReqs  = rows where sequence_order IS NULL
       sequentialReqs = rows where sequence_order IS NOT NULL
  3. Insert ALL parallelReqs as clearance_tasks immediately
  4. If parallelReqs is empty → insert sequence_order = 1 immediately
     If parallelReqs is NOT empty → do NOT insert any sequential tasks yet
                                     wait for advanceRouting()
```

### advanceRouting() logic

```
Called after every task is marked Cleared:
  1. Get all existing clearance_tasks for this request
  2. Count pending parallel tasks (sequence_order = null AND status = Pending)
  3. If pendingParallel > 0 → do nothing, still waiting
  4. If pendingParallel = 0 → all parallel done
       Find highest completed sequential number (lastCompleted)
       Look for clearance_requirement where sequence_order = lastCompleted + 1
       If found → insert next sequential clearance_task
       If not found → no more tasks → update request status to Ready for Release
```

---

## Full Process Flow — From Submission to Download

This is the complete end-to-end flow for a **TOR request** as an example. All document types follow this same flow — only the number of offices involved changes.

### Actors

- **Juan** — Student (requestor)
- **Ana** — Cashier staff (UCF)
- **Clara** — Library staff (LIB)
- **Diego** — Property staff (PSO)
- **Elena** — OSAS staff
- **Francis** — Registrar / OUR Head

---

### Phase 1 — Submission (Portal)

```
Juan logs in → /request/new
  Step 1: Selects "Transcript of Records"
  Step 2: Purpose = Employment, Copies = 2, Release = Digital
  Step 3: Agrees to Data Privacy Notice
  Step 4: Reviews and clicks Submit

POST /api/portal/requests
  → generateTrackingNumber()     → EDOC-2026-000124
  → calculateSlaDeadline(7)      → 7 working days from today
  → INSERT document_requests:
       tracking_number = EDOC-2026-000124
       status          = Pending
       fee_amount      = 150.00
       payment_status  = Unpaid
  → createClearanceTasks():
       INSERT clearance_tasks:
         LIB  → Pending (null)
         UCF  → Pending (null)
         PSO  → Pending (null)
         OSAS → Pending (null)
         OUR  → NOT CREATED YET
  → logAudit(REQUEST_SUBMITTED)

Response to Juan:
  trackingNumber = EDOC-2026-000124
  feeAmount      = 150.00

Juan sees success modal → clicks View My Request
→ redirected to /request/EDOC-2026-000124
```

---

### Phase 2 — Payment (Portal)

```
Juan is on /request/EDOC-2026-000124
  Status: Pending
  Payment: Unpaid ← highlighted warning

Juan pays ₱150 via GCash
Juan uploads screenshot on the request page

PATCH /api/portal/requests/[id]/payment
  → document_requests updated:
       payment_proof_path = /uploads/proofs/req-abc.jpg
       payment_status     = Pending Verification
  → logAudit(PAYMENT_PROOF_UPLOADED)
```

---

### Phase 3 — Parallel Clearance (Office)

All 4 offices (LIB, UCF, PSO, OSAS) work independently at the same time. Order does not matter.

```
Ana (UCF) logs in → /office/queue
  Sees: EDOC-2026-000124 | TOR | Juan Dela Cruz | Pending
  Clicks View → verifies payment proof → marks Cleared

PATCH /api/office/clearance/[taskId]
  → clearance_tasks: UCF → Cleared, cleared_by = Ana
  → advanceRouting():
       pendingParallel = [LIB, PSO, OSAS]  ← still 3 left
       → do nothing

Clara (LIB) marks Cleared
  → advanceRouting():
       pendingParallel = [PSO, OSAS]  ← still 2 left
       → do nothing

Diego (PSO) marks Cleared
  → advanceRouting():
       pendingParallel = [OSAS]  ← still 1 left
       → do nothing

OSAS staff marks Cleared  ← last parallel task
  → advanceRouting():
       pendingParallel = []  ← ALL DONE
       lastCompleted = 0
       nextReq = OUR (sequence_order = 1)
       → INSERT clearance_task: OUR → Pending (sequence_order = 1)
       → document_requests: status = In Process
  → logAudit(CLEARANCE_CLEARED) for each
```

---

### Phase 4 — Registrar Processing (Office)

```
Francis (OUR Head) logs in → /office/queue
  Sees: EDOC-2026-000124 | TOR | Juan Dela Cruz | Pending
  All 4 clearances are done ✓
  Francis processes the physical TOR document
  Francis scans it and uploads the PDF

POST /api/office/documents/upload
  → document_attachments:
       file_path = /uploads/scans/tor-req-abc-nanoid.pdf
  → logAudit(DOCUMENT_UPLOADED)

Francis marks OUR clearance task as Cleared

PATCH /api/office/clearance/[taskId]
  → clearance_tasks: OUR → Cleared
  → advanceRouting():
       pendingParallel = []
       lastCompleted = 1
       nextReq = none  ← no sequence_order = 2 exists
       → NO MORE TASKS
       → document_requests: status = Ready for Release
  → logAudit(CLEARANCE_CLEARED)
  → notify Juan via email: Your TOR is ready for release
```

---

### Phase 5 — Release (Portal)

```
Juan receives email notification
Juan logs in → /request/EDOC-2026-000124
  Status: Ready for Release
  Clearance Progress:
    Library    ✓ Cleared
    Cashier    ✓ Cleared
    Property   ✓ Cleared
    OSAS       ✓ Cleared
    Registrar  ✓ Cleared

Juan clicks Download

GET /api/portal/documents/download/[id]
  → verify session
  → fetch file from storage
  → verifyDocument(buffer, storedHash)  ← tamper check
       if hash mismatch → ERROR: document has been tampered
       if hash matches  → stream file to browser
  → document_requests: status = Released
  → logAudit(DOCUMENT_DOWNLOADED)
  → logAudit(STATUS_UPDATED → Released)
```

---

### Phase 6 — Verification (Public, no login)

```
Juan's employer scans the QR code on the TOR PDF

GET /verify/[token]  ← public route, no login required
  → look up generated_documents by verification_token
  → INSERT document_verifications:
       scanned_at  = now
       ip_address  = employer's IP
       user_agent  = employer's browser
  → logAudit(VERIFICATION_SCANNED, userId = null)
  → return public verification page:
       Document: Transcript of Records
       Issued by: Office of the University Registrar
       Issued to: J*** D*** C***  ← masked name
       Date issued: May 4, 2026
       Status: VALID ✓
```

---

### Summary Timeline

```
Day 1  Juan submits            → 4 parallel tasks created (LIB, UCF, PSO, OSAS)
Day 1  Juan uploads payment    → payment_status = Pending Verification
Day 2  Cashier verifies + clears → 3 parallel still pending
Day 2  Library clears          → 2 parallel still pending
Day 3  Property clears         → 1 parallel still pending
Day 3  OSAS clears             → ALL parallel done → OUR task created
Day 4  Registrar uploads + clears → no more tasks → Ready for Release
Day 4  Juan downloads TOR      → status = Released
Day 5  Employer scans QR       → verification log recorded
```

---

### Tables touched per phase

| Phase        | Tables written                                          |
| ------------ | ------------------------------------------------------- |
| Submission   | `document_requests`, `clearance_tasks`, `audit_log`     |
| Payment      | `document_requests`, `audit_log`                        |
| Clearance    | `clearance_tasks`, `document_requests`, `audit_log`     |
| Upload       | `document_attachments`, `audit_log`                     |
| Download     | `document_requests`, `generated_documents`, `audit_log` |
| Verification | `document_verifications`, `audit_log`                   |

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
