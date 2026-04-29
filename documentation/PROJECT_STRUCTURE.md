# e-Docs Project Structure

> Next.js 14 App Router · TypeScript · Tailwind CSS · Drizzle ORM · Supabase Auth

---

## Root Layout

```
e-docs/
├── public/
│   └── assets/                        # University seal, signature images, fonts
│
├── src/
│   ├── app/                           # Next.js App Router root
│   │   ├── layout.tsx                 # Root layout (fonts, providers, global metadata)
│   │   ├── globals.css                # Tailwind directives + CSS variables (theme)
│   │   ├── page.tsx                   # Landing page (public)
│   │   │
│   │   ├── (auth)/                    # Auth route group — no shared layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (portal)/                   # Front-user route group (students, faculty, non-teaching staff)
│   │   │   ├── layout.tsx             # Front-user shell (sidebar/navbar, session guard)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Home dashboard after login
│   │   │   ├── request/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Submit new document request
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Track a specific request + clearance progress
│   │   │   ├── history/
│   │   │   │   └── page.tsx           # Full request history
│   │   │   └── profile/
│   │   │       └── page.tsx           # View/edit profile
│   │   │
│   │   ├── (staff)/                    # Back-user route group (office staff, office heads)
│   │   │   ├── layout.tsx             # Office shell (office-scoped sidebar, session guard)
│   │   │   ├── office/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx       # Office home — SLA summary, quick stats
│   │   │   │   ├── queue/
│   │   │   │   │   └── page.tsx       # Office request queue (filter/sort by status, type, SLA)
│   │   │   │   └── request/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx   # Process a specific request (generate, upload, clear)
│   │   │
│   │   ├── (admin)/                   # Admin route group
│   │   │   ├── layout.tsx             # Admin shell (admin sidebar, session guard)
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx       # System-wide stats overview
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx       # User list + management
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   # Edit individual user
│   │   │   │   ├── offices/
│   │   │   │   │   └── page.tsx       # Office management
│   │   │   │   ├── document-types/
│   │   │   │   │   └── page.tsx       # Document type + template management
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx       # Reports (PDF/CSV export)
│   │   │   │   └── audit-logs/
│   │   │   │       └── page.tsx       # Audit log viewer
│   │   │
│   │   ├── verify/
│   │   │   └── [token]/
│   │   │       └── page.tsx           # Public document verification (no login required)
│   │   │
│   │   └── api/                       # API route handlers
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts
│   │       │   ├── logout/
│   │       │   │   └── route.ts
│   │       │   └── register/
│   │       │       └── route.ts
│   │       ├── requests/
│   │       │   ├── route.ts           # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts       # GET (single), PATCH (status update), DELETE (cancel)
│   │       │       └── clearance/
│   │       │           └── route.ts   # PATCH clearance task status
│   │       ├── documents/
│   │       │   ├── generate/
│   │       │   │   └── route.ts       # POST — trigger Pattern A PDF generation
│   │       │   └── upload/
│   │       │       └── route.ts       # POST — Pattern B scan upload
│   │       ├── verify/
│   │       │   └── [token]/
│   │       │       └── route.ts       # GET — public verification lookup
│   │       ├── notifications/
│   │       │   └── route.ts           # GET (list), PATCH (mark read)
│   │       └── admin/
│   │           ├── users/
│   │           │   └── route.ts
│   │           ├── offices/
│   │           │   └── route.ts
│   │           ├── document-types/
│   │           │   └── route.ts
│   │           └── reports/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives (Button, Input, Dialog, etc.)
│   │   ├── layout/                    # Shared layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── request/                   # Request-related components
│   │   │   ├── RequestForm.tsx
│   │   │   ├── RequestCard.tsx
│   │   │   ├── RequestStatusBadge.tsx
│   │   │   ├── ClearanceTracker.tsx   # Visual stepper for clearance progress
│   │   │   └── SLAIndicator.tsx       # Green/Yellow/Red SLA flag
│   │   ├── office/                    # Office-staff components
│   │   │   ├── RequestQueue.tsx
│   │   │   ├── ProcessingPanel.tsx
│   │   │   └── InternalNotes.tsx
│   │   ├── admin/                     # Admin-specific components
│   │   │   ├── StatsCard.tsx
│   │   │   └── AuditLogTable.tsx
│   │   └── shared/                    # Truly reusable across all user types
│   │       ├── DataPrivacyNotice.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── NotificationBell.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── db/
│   │   ├── index.ts                   # Drizzle client + pg pool setup
│   │   └── schema.ts                  # All Drizzle table definitions
│   │       # Tables: User, Role, Session, DataPrivacyConsent,
│   │       #         Office, OfficeStaff,
│   │       #         DocumentType, DocumentTemplate, ClearanceRequirement,
│   │       #         DocumentRequest, ClearanceTask, RequestStatusHistory, InternalNote,
│   │       #         GeneratedDocument, DocumentAttachment, DocumentVerification,
│   │       #         Notification, AuditLog
│   │
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client setup (auth + session)
│   │   ├── axios.ts                   # Axios instance with base URL + interceptors
│   │   ├── mailer.ts                  # Nodemailer / SMTP email sender
│   │   ├── ai.ts                      # AI API wrapper (classification, auto-fill, pre-check)
│   │   ├── sla.ts                     # SLA working-day calculator (excludes weekends/holidays)
│   │   └── utils.ts                   # General helpers (cn, formatDate, generateTrackingNumber, etc.)
│   │
│   ├── pdf/
│   │   ├── generator.ts               # Puppeteer + @sparticuz/chromium PDF renderer
│   │   └── qr.ts                      # QR code generator (nanoid token → base64 image)
│   │
│   ├── templates/                     # React components for Pattern A documents
│   │   ├── certificates/
│   │   │   ├── Enrollment.tsx
│   │   │   ├── Grades.tsx
│   │   │   ├── Graduation.tsx
│   │   │   └── GoodMoral.tsx
│   │   ├── clearances/
│   │   │   ├── Library.tsx
│   │   │   ├── Property.tsx
│   │   │   └── Tuition.tsx
│   │   └── layouts/
│   │       ├── OfficialLetterhead.tsx # PSU header, seal, office name
│   │       └── FooterWithSignatures.tsx
│   │
│   └── types/
│       └── types.ts                   # Shared TypeScript types and interfaces
│
├── drizzle/                           # Generated migration files
├── drizzle.config.ts                  # Drizzle Kit config
├── proxy.ts                           # Request proxy / custom middleware (replaces deprecated middleware.ts)
│                                      # Handles: role guard, office-scope guard, session validation
├── .env                               # Environment variables
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Key Folder Responsibilities

| Folder              | What lives here                                                |
| ------------------- | -------------------------------------------------------------- |
| `src/app/(auth)`    | Login and register pages — no session required                 |
| `src/app/(front)`   | All pages for students, faculty, and non-teaching staff        |
| `src/app/(back)`    | All pages for office staff and office heads                    |
| `src/app/(admin)`   | All pages for the system administrator                         |
| `src/app/api`       | All API route handlers — called by Axios from the client       |
| `src/app/verify`    | Public document QR verification — no login required            |
| `src/components/ui` | shadcn/ui primitives (do not modify directly)                  |
| `src/components/*`  | Feature-specific and shared UI components                      |
| `src/db`            | Drizzle schema and database client only                        |
| `src/lib`           | Supabase, Axios, mailer, AI wrapper, SLA util, general utils   |
| `src/pdf`           | Puppeteer PDF generator and QR code helpers                    |
| `src/templates`     | React components rendered to PDF for Pattern A documents       |
| `src/types`         | Shared TypeScript interfaces used across the project           |
| `proxy.ts`          | Route protection — reads session, checks role and office scope |

---

## URL Map

| URL                     | Who can access     | What it does                       |
| ----------------------- | ------------------ | ---------------------------------- |
| `/`                     | Public             | Landing page                       |
| `/login`                | Public             | Login form                         |
| `/register`             | Public             | Registration form                  |
| `/dashboard`            | Front users        | Home after login                   |
| `/request/new`          | Front users        | Submit a document request          |
| `/request/[id]`         | Front users        | Track request + clearance progress |
| `/history`              | Front users        | All past requests                  |
| `/profile`              | Front users        | View/edit profile                  |
| `/office/dashboard`     | Office staff/heads | Office home + SLA summary          |
| `/office/queue`         | Office staff/heads | Scoped request queue               |
| `/office/request/[id]`  | Office staff/heads | Process a request                  |
| `/admin/dashboard`      | Admin              | System-wide statistics             |
| `/admin/users`          | Admin              | Manage user accounts               |
| `/admin/offices`        | Admin              | Manage offices                     |
| `/admin/document-types` | Admin              | Manage document types + templates  |
| `/admin/reports`        | Admin              | Generate reports                   |
| `/admin/audit-logs`     | Admin              | View audit logs                    |
| `/verify/[token]`       | Public             | Document authenticity verification |

---

## proxy.ts — Route Protection Logic

```
/ (public)              → always allow
/login, /register       → redirect to /dashboard if already logged in
/dashboard, /request/*,
/history, /profile      → require session + front-user role
/office/*               → require session + OfficeStaff or OfficeHead role
/admin/*                → require session + Admin role
/verify/*               → always allow (public)
/api/*                  → each route handler validates session independently
```

---

## Environment Variables (.env)

```env
# Database
DATABASE_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

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
