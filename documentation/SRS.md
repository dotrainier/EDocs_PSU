# Software Requirements Specification (SRS)
## e-Docs: AI-Based Online Document Requisition and Management System
**For:** Pampanga State University – Main Campus
**Document Version:** 2.0 (Capstone Project — Multi-Office Architecture)

---

## 1. Project Overview

### System Description
**e-Docs** is a web-based, AI-assisted document requisition and management system designed for Pampanga State University – Main Campus. It provides an **intelligent, centralized, and accessible platform** that connects two groups of users:

- **Front users** — the people who *request* documents for their own purposes (employment, scholarships, transfers, loans, government applications, etc.). This includes **students**, **teaching faculty**, and **non-teaching staff**.
- **Back users** — the people who *fulfill* requests so a request can be successfully processed and released. These are administrative personnel scoped to specific offices (Registrar, Cashier, Library, Property/Supply, MIS, Dean's/College, Guidance/OSAS, HRMO), plus the System Administrator who oversees the whole platform.

The system supports two document-handling patterns — **system-generated PDFs** for routine certifications and **scan-and-upload** for security-paper documents like the Transcript of Records and Diploma — and orchestrates **multi-office clearance workflows** when required by university policy.

The system aims to improve processing speed, transparency, accountability, and user satisfaction in document-related transactions, in compliance with **RA 9470 (National Archives of the Philippines Act of 2007)** and **RA 10173 (Data Privacy Act of 2012)**.

### Problem Being Solved
The current document requisition process at PSU Main Campus is manual and paper-based, which causes:
- Long queues and multiple physical visits to different offices.
- Slow processing, especially during peak seasons (enrollment, graduation).
- Lost or misplaced paper records.
- No way for users to track the status of their requests.
- Heavy workload on administrative staff due to repetitive manual handling.
- Lack of transparency and frequent follow-ups from students/faculty.
- Difficulty coordinating clearances that involve multiple offices (Library, Cashier, Property, etc.).
- No reliable way to verify the authenticity of issued documents after release.

### Purpose of the System
- Provide a single online platform for submitting, processing, and releasing document requests across all involved offices.
- Reduce processing time and eliminate the need for repeated campus visits.
- Use AI to classify, route, prioritize, and pre-fill requests.
- Give users real-time visibility into the status of their requests, including multi-office clearance progress.
- Centralize records in a secure database for easier management, reporting, and legally-compliant retention.
- Provide **document authenticity verification** through QR codes on system-generated documents.
- Track processing performance against the university's published service-level commitments (Citizen's Charter).

### Objectives of the Study
*(Mirrors the "Objectives of the Study" section of the manuscript.)*

The general objective is to design, develop, and test **e-Docs**, an AI-Based Online Document Requisition and Management System for Pampanga State University – Main Campus, to simplify document request processes, allow real-time tracking, improve communication between users and administrative offices, and improve the overall efficiency and quality of document processing services.

Specific objectives:
1. Determine the existing processes and issues in the document requisition and management of PSU – Main Campus.
2. Create an AI-powered Online Document Requisition and Management System (e-Docs) that allows secure user authentication, online document ordering, real-time tracking, multi-office clearance workflows, and automated notifications.
3. Evaluate the developed system using **ISO/IEC 25010** software quality criteria — **usability, performance efficiency, reliability, security, and user satisfaction**.
4. Provide a centralized administrative dashboard where staff from each office can handle requests scoped to their office, with **AI-assisted request classification, routing, and template auto-fill**, and a **secure database** to ensure efficient processing and data privacy.

---

## 2. Target Users

The system divides users into two groups based on what they do in the workflow:

- **Front users** = requesters (people who submit document requests for their own purposes)
- **Back users** = fulfillers (people who process those requests across the various offices)

Each user has exactly one **primary role**, and back users are additionally linked to a specific **office**.

### 2.1 Front Users (Requesters)
Front users are the people the system serves directly. They log in, submit requests, track them, and receive their documents.

| Role | Common Document Needs |
|------|------------------------|
| **Student** | Transcript of Records, Certificate of Enrollment, Certificate of Grades, Certificate of Good Moral, Certificate of Graduation, Diploma, Transfer Credential, clearances. |
| **Teaching Faculty** | Service Record, Certificate of Employment, employment certifications for promotion / loans / visa. |
| **Non-Teaching Staff** *(admin assistants, finance officers, security personnel, maintenance staff, etc.)* | Service Record, Certificate of Employment, COE for loans, employment certifications. |

All front users have the same core capabilities: register, log in, submit requests, track requests (including clearance progress), receive notifications, cancel requests before processing begins, download released documents, and view request history. The list of document types each front user can request is filtered by their role (e.g., a student does not see "Service Record" in their request menu; a faculty member does not see "Transcript of Records" as a self-request unless they are also enrolled in a graduate program).

### 2.2 Back Users (Fulfillers)
Back users are administrative personnel who handle requests so they can be successfully processed and released. Each back user is scoped to one or more offices.

| Role | Responsibilities |
|------|------------------|
| **Office Staff (Processor)** | Scoped to a specific office. View and act on requests routed to their office. Issue or clear documents according to the office's scope. Generate documents from templates (Pattern A) or upload scanned documents (Pattern B). Add remarks. Coordinate with other offices through the system. |
| **Office Head / Approver** | An office staff member with elevated rights to approve final document release for their office (optional — configurable per office). |
| **System Administrator** | Manage user accounts (create / edit / deactivate / delete), manage offices and their staff, manage document types and templates, configure clearance workflows, view system-wide statistics, generate reports, and view audit logs. |

> **Note on overlap:** A non-teaching staff member who works at, say, the Library is *both* a back user (when fulfilling library clearance tasks at work) and a front user (when requesting their own service record). The system handles this correctly — the user has a primary front-user role plus an office assignment, and the UI shows the appropriate view depending on which area they are using.

### 2.3 Offices supported by the system (where back users work)
The following offices are pre-configured (and editable by the System Administrator):

| Office | Issues | Provides Clearance For |
|---|---|---|
| **Office of the University Registrar (OUR)** | Transcript of Records, Diploma, Certificates (Enrollment, Grades, Graduation, Good Moral, Units Earned, etc.), Transfer Credential | — |
| **University Cashier / Finance** | Statement of Account, Tuition Clearance, Official Receipts | All documents requiring payment |
| **University Library** | Library Clearance | TOR, Diploma, Transfer Credential, General Clearance |
| **Property / Supply Office** | Property Clearance, Equipment Accountability Certificate | TOR, Diploma, Transfer Credential, General Clearance |
| **MIS / IT Office** | IT Clearance, System Access Records | General Clearance |
| **Dean's / College Office** | Recommendation Letters, Endorsements, Subject Substitution | Graduation-related requests |
| **Guidance / OSAS** | Certificate of Good Conduct, Certificate of Good Moral (in some cases) | TOR, Transfer, General Clearance |
| **HRMO** | Service Record, Certificate of Employment (for both teaching faculty and non-teaching staff) | — |

---

## 3. Functional Requirements

### 3.1 User Account Module
- Users can register with valid school credentials (e.g., student/faculty/employee ID, school email).
- Users can log in and log out securely.
- Users can reset/change their password (email-based reset).
- Users can view and update their profile information (with sensitive fields like name and ID locked from self-edit).
- The system supports **role assignment** by the System Administrator.
- Staff users are additionally assigned to **one or more offices** (a staff member may belong to multiple offices, e.g., a person who clears for both Library and Property).

### 3.2 Document Request Module
- Users can submit a request by selecting a document type from a list of available types (filtered by their role — students see student-relevant types, teaching faculty and non-teaching staff see employment-related types).
- A structured digital form must be completed (required fields validated for accuracy and completeness).
- A **data privacy notice** is shown and must be accepted before submission, in compliance with **RA 10173**.
- A **confirmation prompt** is shown before final submission and before cancellation.
- Each submitted request is assigned a unique **tracking number** and a unique internal `request_id`.
- Users receive a confirmation once a request is successfully submitted.
- Users can cancel a request before any office has begun processing it (i.e., while still in "Pending" or in clearance with no clearances yet completed).
- Users can view the history of all their past requests, including the full **status history** of each request (every stage it passed through, with timestamps and remarks).
- Users requesting documents that require fees see the fee amount and instructions for payment (payment proof upload supported; full payment processing is out of scope per Section 6.2).
- The system may apply additional **request authenticity checks** (e.g., re-confirming the requestor's school ID matches the logged-in account) for sensitive documents.

### 3.3 AI Processing Module (AI Assistance)
The AI module performs **five distinct functions**, all of which are **assistive** — staff retain final decision-making authority.

1. **Request Classification & Routing.** Automatically classifies the request type from the user's submitted form and routes it to the correct issuing office. For requests with ambiguous purpose text, AI suggests the most likely document type.
2. **Template Auto-Fill.** For documents handled via Pattern A (system-generated), AI pre-fills template fields from the user's profile (full name, course, year level, student/faculty ID, date) so staff only review rather than retype.
3. **Prerequisite & Completeness Detection.** Flags requests with missing or inconsistent data (e.g., "no graduation record found for this user" when requesting a Certificate of Graduation, or "purpose field is too vague").
4. **Priority Suggestion.** Suggests priority levels based on document type, request date, peak-season indicators, and any deadlines mentioned in the purpose field. Staff can override.
5. **Clearance Pre-Check.** For requests requiring multi-office clearance, AI pre-checks the user's standing against available data (e.g., flags overdue library books, unpaid balances) so the originating office can warn the user before clearance even begins.

All AI suggestions are visible to staff with a confidence indicator and can be accepted, edited, or rejected.

### 3.4 Document Handling Patterns
Each `DocumentType` in the system is configured with **one** of two handling patterns:

#### Pattern A — System-Generated (Template-Based)
The system produces a PDF from a pre-built template, populated with data from the user's profile and request form, then signed off by the issuing office's staff.

**Documents typically using Pattern A:**
- Certificate of Enrollment
- Certificate of Grades / True Copy of Grades
- Certificate of Graduation / Candidate for Graduation
- Certificate of Good Moral Character (where issued by Registrar/Guidance)
- Certificate of Units Earned
- Service Record (HRMO)
- Property Clearance, Library Clearance, IT Clearance, Tuition Clearance (clearance certificates)

**Workflow for Pattern A:**
1. Request enters the issuing office's queue.
2. AI auto-fills template values from the user's profile.
3. Staff reviews the auto-filled draft on screen and may edit any field.
4. Staff clicks **"Generate & Approve."**
5. System produces a PDF with: filled-in values, the registrar/office head's signature image, the university seal image, a unique **document serial number**, an **issuance timestamp**, and a **QR code** linking to the public verification page.
6. Generated PDF is stored, indexed in `GeneratedDocument`, and made available for download via the user's account.

#### Pattern B — Scan-and-Upload (Physical Document Digitized)
The actual document is prepared physically (because of legal/security requirements like security paper, dry seal, or wet signature), then scanned and uploaded to the system for digital release. This pattern matches the established practice at universities like UPOU, UP Diliman, Xavier, and DHVSU.

**Documents typically using Pattern B:**
- Transcript of Records (Official TOR — security paper, dry seal, wet signature)
- Diploma
- Transfer Credential / Honorable Dismissal
- Authenticated documents / CAV / Apostille-bound documents
- Custom recommendation letters from a Dean

**Workflow for Pattern B:**
1. Request enters the issuing office's queue.
2. Staff prints/prepares the physical document offline using existing university processes (security paper, signatures, dry seal).
3. Staff scans the completed document.
4. Staff uploads the scanned PDF to the request via the system.
5. Staff marks the request as **"Ready for Release"** and chooses release mode: **digital-only**, **physical pickup**, or **both** (digital scan + physical original to be claimed in person).

### 3.5 Multi-Office Clearance Workflow Module
For documents requiring sign-off from multiple offices before release (per university policy and Citizen's Charter), the system orchestrates a **clearance workflow**.

- Each `DocumentType` declares its `ClearanceRequirement` set — the offices that must clear before the issuing office can release the document.
- When a request requiring clearance is submitted, the system automatically creates a `ClearanceTask` for each required office.
- Each office sees its pending clearance tasks in its own dashboard.
- Each office can independently mark a clearance task as **Cleared** or **Rejected**, with mandatory remarks for rejections.
- Clearance tasks may be configured as **parallel** (all offices can clear simultaneously) or **sequential** (one office must clear before the next is notified) per document type. Default is parallel.
- The user sees a **clearance progress tracker** showing each office's status (Pending / Cleared / Rejected).
- The issuing office cannot release the document until **all required clearances are Cleared**.
- If any office Rejects a clearance task, the request transitions to **"Action Required"** and the user is notified with the rejection reason.

**Documents typically requiring clearance:**
- Transcript of Records (Library, Cashier, Property, Guidance)
- Diploma (full clearance set)
- Transfer Credential (Library, Cashier, Property, Dean's Office)
- General/University Clearance (all clearance offices)

### 3.6 Processing and Approval Module (Office-Scoped)
- Office Staff see only requests routed to their office (queue scoping enforced by middleware).
- Each office has a queue view with filter/sort by status, type, date, priority, and SLA risk.
- Staff can update request status (e.g., Pending → In Process → Ready for Release → Released → Rejected).
- For Pattern A documents: staff use the template editor and "Generate & Approve" action.
- For Pattern B documents: staff use the upload action.
- Staff can leave remarks or rejection reasons.
- Staff can communicate with other offices on the same request via internal notes (visible to all assigned offices, hidden from the user).
- Office Heads (where configured) see an "Awaiting My Approval" sub-queue for final sign-off before release.

### 3.7 Notification and Tracking Module
- Users receive automatic notifications at each major status change: submitted, clearance started, individual clearance cleared/rejected, all clearances complete, document being processed, ready for release, released, action required, rejected.
- Notifications are delivered **in-app** and **via email** (using SMTP).
- Users can view a **real-time tracking page** showing:
  - Current overall status
  - Per-office clearance progress (if applicable)
  - Status history with timestamps and remarks
  - Time elapsed and SLA target (e.g., "Day 3 of 7 working days")
- Office staff also receive notifications when a request is routed to their office and when SLA is at risk.

### 3.8 Document Release Module
- For Pattern A documents: the system serves the generated PDF for download from the user's account, with a watermark/serial that identifies it as the official copy.
- For Pattern B documents: the system serves the uploaded scan for download, OR marks the request as "Ready for Pickup" with location, time window, and required IDs to bring.
- Released documents remain accessible to the requesting user through their account, subject to the retention schedule.
- Each release is logged in `RequestStatusHistory` and `GeneratedDocument` (or `DocumentAttachment`) tables.

### 3.9 Document Verification Module (Public, No Login Required)
- Every system-generated document (Pattern A) carries a **QR code** linking to a public URL: `/verify/<verification_token>`.
- Anyone scanning the QR code can view a verification page showing: document type, issuance date, issuing office, the requestor's name (partially masked for privacy, e.g., "S***s, V***t M."), serial number, and a confirmation that the document is authentic and has not been revoked.
- The verification page does NOT expose the full document or sensitive personal data.
- Each verification scan is logged in `DocumentVerification` for audit purposes.
- Documents can be **revoked** by the issuing office (e.g., if issued in error); revoked documents show as "REVOKED" on the verification page.

### 3.10 SLA Tracking Module
- Each `DocumentType` has a configured SLA (e.g., 7 working days for certifications, 21 working days for first-time TOR), based on the university's Citizen's Charter.
- The system tracks elapsed working days per request (excluding weekends and configured holidays).
- Requests are visually flagged in office queues:
  - **Green** — well within SLA
  - **Yellow** — at risk (e.g., > 75% of SLA elapsed)
  - **Red** — SLA breached
- The Admin Dashboard reports average actual processing time per document type vs. SLA target.

### 3.11 Admin Dashboard
- Manage user accounts (create, edit, deactivate, delete; assign roles and offices).
- Manage offices (create, edit, deactivate; assign staff).
- Manage document types (name, description, issuing office, handling pattern, template, fee, SLA in days, clearance requirements, active/inactive).
- Manage document templates (upload/edit React component path and variable schema for Pattern A).
- Configure clearance requirements (which offices clear which document types).
- View system-wide statistics:
  - Number of requests by status, type, office, time period
  - Average processing time vs. SLA per document type
  - SLA breach rate per office
  - Request frequency by document type and peak seasons
  - User activity (active accounts, inactive accounts)
- Generate basic reports (daily, weekly, monthly, per-office, per-document-type) — exportable to PDF/CSV.
- View audit logs of all system activities.

### 3.12 Audit Trail
- Record every important action (login attempt, request submission, status update, clearance action, document generation, document upload, account changes, role/office changes, template changes) with `user_id`, `action`, `details`, `ip_address`, and `timestamp`.
- Logs are viewable by the System Administrator only.
- Logs are retained per **RA 9470** records retention requirements.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- The system should load main pages within **3–5 seconds** under normal conditions.
- Support concurrent use by typical campus traffic (a few hundred simultaneous users is acceptable for a student project).
- Notifications should be triggered within a few seconds after a status change.
- Pattern A document generation (PDF render via Puppeteer) should complete within **10 seconds** for a typical certificate.

### 4.2 Security
- Passwords stored using a strong hashing algorithm (`bcrypt` or `argon2`) — never plain text.
- Authentication handled in-house using HTTP-only, secure cookies for session tokens.
- Secure login sessions with timeout and proper logout (token/session invalidation).
- **Role-based and office-scoped access control** enforced via Next.js middleware — staff only see requests routed to their office; admins see everything.
- Data privacy notice and consent required before any data submission, recorded in `DataPrivacyConsent`.
- Compliance with **RA 10173 (Data Privacy Act of 2012)** — including data minimization, purpose limitation, and the right of users to access/correct their data.
- Compliance with **RA 9470 (National Archives Act of 2007)** — records retention follows the General Records Disposition Schedule (GRDS).
- Input validation using `zod` schemas to prevent invalid data and injection attacks.
- Parameterized queries (via Drizzle ORM and `pg`) to prevent SQL injection.
- CSRF protection on state-changing requests (Next.js Server Actions handle this by default; API routes handled manually).
- Generated documents include tamper-evidence: unique serial number, QR-code-backed verification, and revocation capability.
- Uploaded files (Pattern B) are scanned for file-type validity and size limits enforced.

### 4.3 Usability
- Clean, simple, and intuitive interface understandable to first-time users.
- Mobile-friendly/responsive design.
- Clear labels, status indicators, and error messages.
- Consistent navigation across modules.
- Clearance progress tracker uses a visual stepper/timeline so users immediately understand where their request stands.

### 4.4 Reliability
- The system should be available during normal university operating hours.
- Data should be saved without loss when actions are confirmed.
- Failed actions should display clear error messages and not corrupt request data.
- Generated PDFs are stored persistently; if generation fails mid-process, the request remains in "In Process" without partial documents being released.

### 4.5 Compatibility
- Should work on common modern browsers (Chrome, Edge, Firefox, Safari).
- Should work on desktop and mobile devices.

### 4.6 Evaluation Criteria (ISO/IEC 25010)
The system will be evaluated against the **ISO/IEC 25010** software quality model, focusing on:

| Characteristic | What is measured |
|----------------|------------------|
| **Usability** | Ease of use, learnability, clarity of interface, completion rate of common tasks (submit request, find a request, clear a clearance task). |
| **Performance Efficiency** | Page load time, time to complete a request submission, PDF generation time, system responsiveness under typical load. |
| **Reliability** | Availability during operating hours, recovery from errors, data integrity, no lost requests. |
| **Security** | Authentication, role/office-scoped authorization, data privacy compliance, audit traceability, document tamper-evidence. |
| **Satisfaction** | User-reported satisfaction with the system (via UAT survey across student, faculty, and staff respondents). |

Evaluation will be conducted through **User Acceptance Testing (UAT)** with a sample of students, faculty, and administrative staff from the involved offices. Results — task completion rate, time-on-task, and Likert-scale satisfaction scores — will be reported in the manuscript. The respondent group is acknowledged as a study limitation.

---

## 5. Business Rules

- A user must be **registered and authenticated** to submit a request.
- A user must **agree to the data privacy notice** before submitting any request.
- Each request must be **assigned a unique tracking number**.
- A request can only be **canceled before processing begins** (i.e., while still in "Pending" or in clearance with no clearances yet completed).
- **Only office staff scoped to the relevant office** can act on a request (e.g., Library staff cannot release a Diploma).
- The **AI module only suggests** classification, routing, auto-fill, priority, and clearance pre-checks — final decisions are always made by staff.
- **Role and office-based access** is strictly enforced (students cannot see any staff features; staff in one office cannot see queues of another office).
- Documents requiring clearance **cannot be released** until all required offices have cleared the request.
- Pattern A documents are released only after **all clearances are complete AND the issuing office has clicked Generate & Approve**.
- Pattern B documents may still require **physical claiming** per university policy — the system supports both digital scan release and physical pickup notification.
- All system actions must be **recorded in the audit log**.
- Released digital documents remain **accessible to the requesting user** through their account, subject to the retention schedule.
- System-generated documents (Pattern A) include a QR code that resolves to a **public verification page**.
- Staff issuance of a generated document is a **legal certification** by that staff member; misuse is subject to university disciplinary policy.

---

## 6. Scope and Limitations

### 6.1 In Scope
- Online document requisition for **front users** (students, teaching faculty, and non-teaching staff) of PSU – Main Campus.
- Multi-office architecture covering Registrar, Cashier, Library, Property/Supply, MIS, Dean's/College, Guidance/OSAS, and HRMO (configurable).
- Document types: TOR, Diploma, Certificates (Enrollment, Grades, Graduation, Good Moral, etc.), Service Records, Clearances (Library, Property, IT, Tuition, General), Transfer Credential.
- Both document handling patterns: **system-generated PDFs (Pattern A)** and **scan-and-upload (Pattern B)**.
- **Multi-office clearance workflow** with parallel or sequential clearance configurations.
- AI-assisted classification, routing, template auto-fill, completeness detection, priority suggestion, and clearance pre-check.
- Real-time tracking with clearance progress, in-app and email notifications.
- **QR-code verification** for system-generated documents, with a public verification page.
- **SLA tracking** against published Citizen's Charter timelines.
- Admin dashboard with user, office, document type, and template management; reports; audit logs.
- Centralized PostgreSQL database for all requests, records, and metadata.

### 6.2 Out of Scope / Limitations
*(Aligned with the "Limitations" section of the manuscript.)*

- **Other university systems** such as enrollment, grading, and financial transactions (the system reads basic profile data but does not duplicate enrollment/grading systems).
- **Other campuses** — the system is built for the Main Campus only; rollout to other campuses would require further amendments and per-campus configuration.
- **Full AI automation** — the AI does not approve or reject requests on its own; it is an assistive/support tool only.
- **Offline functionality** — the system requires a stable internet connection; no offline workflow is provided.
- **Full elimination of physical pickup** — TOR, Diploma, and authenticated documents may still require physical claiming per university policy. The system supports tracking the digital workflow and notifies the user when ready for pickup.
- **Online payment processing** — the system can record payment proof uploads but does not integrate with payment gateways. Payment is handled offline at the Cashier or via existing university payment channels.
- **Integration with third-party systems** outside the university (e.g., DFA Apostille, CHED authentication) — the system tracks the request but the external authentication is performed manually.
- **Replacement of physical security paper, dry seals, or wet signatures** — Pattern B exists precisely because these legal/regulatory requirements remain.
- **Evaluation generalizability** — UAT is based on a limited respondent group from PSU – Main Campus, which may affect generalizability.

> **Note on manuscript alignment:** The Chapter 1 manuscript currently mentions only "students and faculty" / "students and instructors" as users. The SRS expands this to also include **non-teaching staff** as front users, since they realistically request HR documents (service records, COE) from the same offices. This expansion should be reflected in a manuscript revision so the SRS and the manuscript stay consistent.

---

## 7. System Modules

A practical breakdown for development:

1. **Authentication Module** – registration, login, logout, password reset, role and office assignment.
2. **User Profile Module** – view/edit profile, with sensitive fields locked.
3. **Document Request Module** – submission form, request listing, cancellation, payment proof upload.
4. **AI Assistance Module** – classification, routing, template auto-fill, completeness detection, priority suggestion, clearance pre-check.
5. **Clearance Workflow Module** – clearance task creation, per-office clearance dashboard, parallel/sequential orchestration.
6. **Office Processing Module** – office-scoped queue, status updates, internal notes, generate-and-approve, scan upload.
7. **Document Generation Module** – React/HTML templates rendered to PDF via Puppeteer + `@sparticuz/chromium`, with signature, seal, serial, and QR code.
8. **Tracking Module** – real-time request status with clearance progress, status history, SLA indicators.
9. **Notification Module** – in-app and email notifications on status changes; SLA-at-risk alerts for staff.
10. **Document Release Module** – secure digital download or pickup readiness alert.
11. **Verification Module** – public QR-resolved verification page, scan logging, revocation.
12. **SLA & Reporting Module** – elapsed-day tracking, breach flags, statistics, reports.
13. **Admin Module** – user, office, document type, template, clearance requirement management; reports; audit log viewer.
14. **Audit Log Module** – immutable record of all system activities.

---

## 8. Data Entities

Database tables (designed for **PostgreSQL** via **Drizzle ORM**):

### 8.1 Identity & Access
| Entity | Key Fields |
|--------|-----------|
| **User** | user_id, full_name, email, password_hash, role_id, status, student_or_employee_id, course_program, year_level, created_at, updated_at |
| **Role** | role_id, role_name (Student, Faculty, NonTeachingStaff, OfficeStaff, OfficeHead, Admin) |
| **Session** | session_id, user_id, token, expires_at, created_at *(optional if using DB sessions)* |
| **DataPrivacyConsent** | consent_id, user_id, consented_at, consent_version |

### 8.2 Office Structure
| Entity | Key Fields |
|--------|-----------|
| **Office** | office_id, name, code, contact_email, is_active |
| **OfficeStaff** | office_staff_id, user_id, office_id, is_office_head, assigned_at |

### 8.3 Document Configuration
| Entity | Key Fields |
|--------|-----------|
| **DocumentType** | document_type_id, name, description, issuing_office_id, handling_pattern (`GENERATE` \| `UPLOAD`), template_id (nullable), fee_amount, sla_working_days, requires_clearance, is_active |
| **DocumentTemplate** | template_id, name, component_path, variable_schema (JSON), version, is_active |
| **ClearanceRequirement** | requirement_id, document_type_id, office_id, sequence_order (NULL = parallel), is_required |

### 8.4 Requests & Workflow
| Entity | Key Fields |
|--------|-----------|
| **DocumentRequest** | request_id, tracking_number, user_id, document_type_id, purpose, status, priority, ai_classification, ai_confidence, payment_proof_path, sla_due_at, created_at, updated_at |
| **ClearanceTask** | clearance_task_id, request_id, office_id, status (`Pending` \| `Cleared` \| `Rejected`), remarks, cleared_by, cleared_at, sequence_order |
| **RequestStatusHistory** | history_id, request_id, status, remarks, changed_by, changed_at |
| **InternalNote** | note_id, request_id, author_user_id, body, created_at *(staff-only, hidden from user)* |

### 8.5 Document Output
| Entity | Key Fields |
|--------|-----------|
| **GeneratedDocument** | generated_doc_id, request_id, serial_number, file_path, verification_token (unique), generated_by, generated_at, is_revoked, revoked_at, revoked_reason |
| **DocumentAttachment** | attachment_id, request_id, file_path, file_type, file_size, uploaded_by, uploaded_at *(used for Pattern B uploads)* |
| **DocumentVerification** | verification_id, generated_doc_id, scanned_at, ip_address, user_agent *(public scan log)* |

### 8.6 Notifications & Audit
| Entity | Key Fields |
|--------|-----------|
| **Notification** | notification_id, user_id, request_id, type, message, is_read, created_at, sent_via_email |
| **AuditLog** | log_id, user_id, action, details (JSON), ip_address, timestamp |

> **Note:** All foreign keys are enforced. `tracking_number` and `serial_number` are human-readable (e.g., `EDOC-2026-000123` and `PSU-COE-2026-000123`). `verification_token` is a `nanoid` (URL-safe, ~21 chars).

---

## 9. Process Flow

### 9.1 Request Submission Flow (Front User)
1. Front user (student, faculty, or non-teaching staff) logs in to the e-Docs system.
2. User clicks **"Request Document"** and selects the document type from a list filtered by their role.
3. System displays the form with required fields, fee (if any), SLA, and which offices will be involved (clearance + issuing).
4. User fills out the request form.
5. User reads and agrees to the **data privacy notice**.
6. User confirms submission via prompt.
7. System generates a **tracking number**, runs AI classification & routing, creates clearance tasks (if applicable), and shows a confirmation page.
8. System sends in-app and email confirmation notifications.

### 9.2 AI Processing Flow (Automated, on submission)
1. AI classifies the request type and confirms/corrects the user's selection.
2. AI auto-fills template variables (Pattern A) from the user's profile.
3. AI detects missing or inconsistent fields and flags them for staff.
4. AI suggests a priority level.
5. AI pre-checks clearance prerequisites and surfaces likely blockers.
6. Request is queued for the appropriate office(s).

### 9.3 Clearance Flow (Multi-Office, when required)
1. System creates a `ClearanceTask` for each required office (parallel by default; sequential if configured).
2. Each office sees the task in its dashboard and is notified.
3. Office staff reviews the user's standing (using AI pre-check hints) and marks the task **Cleared** or **Rejected** with remarks.
4. If Rejected, the request goes to **Action Required**; user is notified with remarks; staff or user can take corrective steps and re-submit clearance.
5. Once **all required clearances are Cleared**, the request advances to the issuing office's queue.

### 9.4 Issuing Office Processing Flow

**Pattern A (System-Generated):**
1. Staff opens the request and reviews AI-filled template values.
2. Staff edits any field if needed.
3. Staff clicks **"Generate & Approve."**
4. System renders the React template via Puppeteer, embeds signature/seal/QR/serial, and produces a PDF.
5. PDF is stored and the request is marked **Released**.
6. User is notified and can download the PDF.

**Pattern B (Scan-and-Upload):**
1. Staff prepares the physical document offline.
2. Staff scans the document.
3. Staff uploads the scan to the request.
4. Staff selects release mode (digital, pickup, or both) and marks **Ready for Release**.
5. User is notified; downloads the scan and/or comes to pick up the physical document.

### 9.5 Tracking and Notification Flow
1. User receives notifications on every major status change and clearance update.
2. User opens the **Track Request** page anytime to see overall status, per-office clearance progress, status history, remarks, and SLA indicator.

### 9.6 Verification Flow (Public)
1. A third party (e.g., employer) scans the QR code on a generated document.
2. They land on `/verify/<token>` — no login required.
3. The page displays document type, issuance date, issuing office, partially-masked requestor name, serial number, and authenticity confirmation.
4. The scan is logged in `DocumentVerification`.
5. If the document has been revoked, the page clearly states **"REVOKED"**.

### 9.7 Admin Flow
1. Admin manages users, offices, document types, templates, and clearance requirements.
2. Admin reviews dashboard statistics and SLA performance.
3. Admin generates reports for university management.
4. Admin reviews audit logs.

---

## 10. Tech Stack

### 10.1 Core Stack
- **Framework:** Next.js (App Router) — fullstack (frontend + backend in one project)
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg` / `node-postgres` driver)
- **ORM:** Drizzle ORM — type-safe, lightweight, SQL-like syntax
- **Styling:** Tailwind CSS
- **Authentication:** Self-built (no external auth providers)

### 10.2 Supporting Libraries
- **Password Hashing:** `bcrypt` or `argon2`.
- **Sessions:** `jsonwebtoken` in HTTP-only cookies, OR a `sessions` table (recommended for easy revocation).
- **Form Validation:** `zod` (works seamlessly with TypeScript and Next.js Server Actions).
- **Email Notifications:** `nodemailer` with SMTP (Gmail SMTP for testing or Mailtrap during development).
- **AI Component:** External AI API (e.g., OpenAI, Gemini) called from a Server Action for classification, auto-fill, and pre-check; rule-based fallbacks where appropriate.

### 10.3 PDF Generation Stack (Pattern A)
- **PDF Engine:** **Puppeteer + `@sparticuz/chromium`** — renders HTML/React templates to pixel-perfect PDFs.
  - `puppeteer-core` (small, brings its own Chromium dep)
  - `@sparticuz/chromium` (stripped-down Chromium that works in serverless if needed)
- **Templates:** Authored as **React components** in `src/templates/` (TypeScript-safe, previewable in dev).
- **QR Codes:** `qrcode` npm package — generates QR images embedded in templates as base64 data URLs.
- **Unique IDs:** `nanoid` for verification tokens; sequential serial numbers from a database counter.
- **Fonts/Assets:** University seal and signature images stored in `public/assets/`; custom fonts loaded via CSS `@font-face`.

**Why this combination (decided after research):**
- Pixel-perfect output that uses the same Tailwind/CSS as the rest of the system.
- Templates are React components — full type safety and live preview during development.
- Easy to add QR codes, signatures, seals as `<img>` tags.
- No separate template tooling (unlike DOCX-based approaches).

### 10.4 File Storage
- **Local `/uploads` folder during development.**
- For production: a server-mounted volume (Railway volume, VPS disk, or school server filesystem). Object storage (S3, R2) is optional.
- Generated PDFs and uploaded scans both stored under structured paths (e.g., `/uploads/generated/<year>/<month>/<serial>.pdf`).

### 10.5 Hosting / Deployment
- **App:** Railway, a self-managed VPS, or a school server. *(Vercel is not the default choice because Puppeteer + Chromium is heavier than Vercel's free-tier limits; Railway is the recommended target.)*
- **Database:** Neon, Supabase, Railway Postgres, or a school-hosted PostgreSQL.
- **Local dev:** PostgreSQL via Docker; `pnpm dev` or `npm run dev`.

### 10.6 Drizzle ORM Notes
- Define table schemas in `src/db/schema.ts` using Drizzle's schema builder.
- Use `drizzle-kit` to generate and run migrations (`drizzle-kit generate`, `drizzle-kit migrate`).
- Drizzle gives full TypeScript inference on queries.

### 10.7 Self-Authentication Notes
- Passwords hashed with `bcrypt` or `argon2` — **never plain text**.
- HTTP-only, Secure cookies for session tokens.
- Middleware (`middleware.ts`) protects routes by role AND, for staff, by office assignment.
- CSRF protection on state-changing actions (Server Actions handle this; API routes manually).
- Reasonable session expiry (1–7 days) with proper logout.
- Validate and sanitize all input via `zod`.

### 10.8 Suggested Project Structure
```
e-docs/
├── public/
│   └── assets/                # university seal, default signatures, fonts
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # login, register
│   │   ├── (front)/           # front-user views: student, faculty, non-teaching staff dashboards
│   │   ├── (back)/            # back-user views: office-scoped processing pages
│   │   ├── (admin)/           # admin dashboard
│   │   ├── verify/[token]/    # public verification page
│   │   └── api/               # API routes (PDF generation endpoint, etc.)
│   ├── components/            # reusable UI components
│   ├── db/
│   │   ├── schema.ts          # Drizzle table schemas
│   │   └── index.ts           # Drizzle client + pg pool
│   ├── lib/                   # auth, hashing, AI helpers, mailer, sla utils
│   ├── server/                # server actions, business logic
│   ├── templates/             # React components for Pattern A documents
│   │   ├── certificates/
│   │   │   ├── enrollment.tsx
│   │   │   ├── good-moral.tsx
│   │   │   ├── grades.tsx
│   │   │   └── graduation.tsx
│   │   ├── clearances/
│   │   │   ├── library.tsx
│   │   │   ├── property.tsx
│   │   │   └── tuition.tsx
│   │   └── layouts/
│   │       ├── official-letterhead.tsx
│   │       └── footer-with-signatures.tsx
│   ├── pdf/
│   │   ├── generator.ts       # Puppeteer + Chromium wrapper
│   │   └── qr.ts              # QR code helpers
│   ├── types/                 # shared TypeScript types
│   └── middleware.ts          # role + office route protection
├── drizzle/                   # generated migrations
├── drizzle.config.ts
├── .env
├── package.json
└── tsconfig.json
```

---

## 11. Legal & Compliance Notes

- **RA 9470 (National Archives Act of 2007):** All university records are subject to the General Records Disposition Schedule (GRDS). The system retains audit logs, request records, and generated documents per the schedule. No record is hard-deleted within retention period; only soft-deleted/archived.
- **RA 10173 (Data Privacy Act of 2012):** The system implements data privacy notice with consent logging, data minimization, purpose limitation, role-based access, and the user's right to access their own data.
- **RA 8792 (E-Commerce Act of 2000):** System-generated documents are electronic documents with QR-backed verification. Where dry seal and wet signature are legally required (e.g., Official TOR, Diploma), Pattern B (scan-and-upload of the physical document) is used to preserve legal validity.

---

*End of SRS Document — Version 2.0*