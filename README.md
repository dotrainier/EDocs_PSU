# e-Docs

AI-assisted online document requisition and management system for Pampanga State University – Main Campus. The platform supports front users (students, teaching faculty, non-teaching staff) and back users (office staff, office heads, and admins), with multi-office clearance workflows, document generation, tamper-evident QR verification, and immutable audit trails.

## Documentation

| File                                                                     | Purpose                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [documentation/SRS.md](documentation/SRS.md)                             | Full system requirements specification                              |
| [documentation/PROJECT_STRUCTURE.md](documentation/PROJECT_STRUCTURE.md) | Architecture, folder layout, URL map                                |
| [CONVENTIONS.md](CONVENTIONS.md)                                         | Coding conventions — read before writing any code                   |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)                       | What to create, what to replace, libraries, schema, migration order |

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Copy `.env.example` to `.env` and fill in the values. Generate secrets with:

```bash
openssl rand -hex 32   # use once for SESSION_SECRET, once for JWT_SECRET
```

Run database migrations after updating schema files:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Custom session-based — no external auth provider
  - `bcryptjs` for password hashing (cost factor 12)
  - `jose` for JWT signing
  - Sessions stored in DB, token in HTTP-only cookie
- **Validation**: `zod` on all API routes
- **Email**: `nodemailer` (SMTP)
- **AI**: Gemini 2.0 Flash via `AI_API_URL` / `AI_API_KEY`
- **PDF**: Puppeteer + `@sparticuz/chromium`, SHA-256 tamper detection
- **QR Codes**: `qrcode` npm package (base64 embedded in PDFs)
- **UI**: Shadcn UI + Tailwind CSS
- **Unique IDs**: `nanoid`

## Security Architecture

- All routes protected in `proxy.ts` — role-based guards (Student, Faculty, NonTeachingStaff, OfficeStaff, OfficeHead, Admin)
- Every state change writes an append-only entry to `audit_log`
- Every generated PDF is SHA-256 hashed at creation time; hash is re-verified on every download
- PDFs are served only through authenticated API routes — no static file URLs
- File paths use `nanoid()` segments to prevent enumeration
- `request_status_history` and `document_verifications` are append-only tables

## Deployment Target

Railway or self-managed VPS / university server. Vercel is not recommended (Puppeteer + Chromium exceeds Vercel free-tier limits).
