# e-Docs process flows

How e-Docs actually behaves, traced from the source code (branch `cap2`, commit `44fbe48`). The diagrams show what the code does today, not what the SRS or the project README describe. Where the two differ, the difference is listed under [Gaps and unclear behaviour](#gaps-and-unclear-behaviour).

## What the process accomplishes

e-Docs lets a student or alumnus request an official university document (Transcript of Records, Certificate of Enrollment, Certificate of Grades or Certificate of Registration) online instead of in person. The applicant registers and waits for an administrator to approve the account. Once approved, they sign in and fill in a four-step request form, where an AI check reviews whether the stated purpose fits the chosen document. The request then goes to the responsible office (the Registrar in the current seed data). Office staff confirm the onsite payment and clear or reject the request. If an office rejects it, the request goes to **Action Required**: the student sees the reason, fixes the issue and resubmits, and the same office reviews it again. A cleared request becomes **Ready for Release**, the student collects the document in person, and an administrator marks it **Released**.

The statuses that drive the lifecycle:

| Record | Values the code actually sets | Where they change |
|---|---|---|
| Account verification | `pending` → `approved` / `rejected` | [api/auth/register/route.ts:138](../../src/app/api/auth/register/route.ts#L138), [api/admin/users/[id]/route.ts:101-120](../../src/app/api/admin/users/%5Bid%5D/route.ts#L101-L120) |
| Request status | `Pending` → `Ready for Release` → `Released`. A rejection sends it to `Action Required`; resubmitting returns it to `Pending` | [api/portal/requests/route.ts:191](../../src/app/api/portal/requests/route.ts#L191), [api/office/clearance/[taskId]/route.ts:124-132](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L124-L132), [api/portal/requests/[id]/resubmit/route.ts:138-149](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L138-L149), [routing.ts:58-61](../../src/lib/routing.ts#L58-L61), [api/office/requests/[id]/release/route.ts:48-51](../../src/app/api/office/requests/%5Bid%5D/release/route.ts#L48-L51) |
| Payment status | `Unpaid` (fee > 0) or `Paid` (free) at submission → `Paid` | [api/portal/requests/route.ts:193](../../src/app/api/portal/requests/route.ts#L193), [api/office/requests/[id]/payment/route.ts:65-68](../../src/app/api/office/requests/%5Bid%5D/payment/route.ts#L65-L68) |
| Clearance task | `Pending` → `Cleared` / `Rejected`; resubmitting resets `Rejected` → `Pending` | [api/portal/requests/route.ts:60-92](../../src/app/api/portal/requests/route.ts#L60-L92), [routing.ts:48-55](../../src/lib/routing.ts#L48-L55), [api/office/clearance/[taskId]/route.ts:108-118](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L108-L118), [api/portal/requests/[id]/resubmit/route.ts:153-161](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L153-L161) |

## Opening the diagram

[`edocs-process-flows.drawio`](edocs-process-flows.drawio) is a single draw.io file with one page per workflow. Open it at [app.diagrams.net](https://app.diagrams.net/) (**File › Open from › Device**), or in VS Code with the *Draw.io Integration* extension. Switch between workflows with the page tabs at the bottom.

| Page | Workflow |
|---|---|
| 0 · Overview | The whole request lifecycle on one page |
| 1 · Registration & approval | Creating an account and the admin's approve/reject decision |
| 2 · Sign-in & sign-out | Signing in with an email or Student ID; ending a session |
| 2b · Page access & session renewal | The check that runs on every page visit, and silent session renewal |
| 3a · Request wizard | The 4-step request form, including the AI purpose checks |
| 3b · Request submission | What the server does when the request is submitted |
| 4 · Clearance & routing | Payment confirmation, clear/reject, and routing to the next office |
| 4b · Action Required & resubmission | Showing the rejection reason; the student fixes the issue and resubmits |
| 5 · Generate & release | Certificate PDF generation, the student's Download button, pickup, and release |
| 6 · Messages & notifications | The per-request message thread and in-app notifications |
| 7 · Admin Assistant | AI answers to admin questions using read-only lookups |
| Gaps & unclear behaviour | Every gap and unclear behaviour in one table: what it is, its type, where it occurs, and the source evidence |

**How to read a page:**

- Each column (lane) is an actor: the applicant, student, office staff, admin, the system, or the AI model.
- Each step carries a small ID (e.g. `R3`). The tables below map every ID to its source code.
- The legend on each page explains the shapes. The main ones: blue boxes are actions by a person, white boxes are system steps, purple boxes save data or change a status, yellow diamonds are decisions, green ends are successes and red ends are refusals or failures.
- Gaps and unclear behaviour are deliberately **not drawn on the flow tabs**. They are all listed on the last tab, **Gaps & unclear behaviour**, and in the [table below](#gaps-and-unclear-behaviour). Each one names the tab and step where it occurs.

## Step reference

Paths are relative to the repository root. Line numbers point to the first relevant line.

### 1 · Registration and admin approval

| Step | What happens | Source |
|---|---|---|
| R1–R2 | The applicant chooses *enrolled student* or *alumni* and fills in the form. | [(auth)/register/page.tsx:185](../../src/app/%28auth%29/register/page.tsx#L185) |
| R3 | The server checks the details: names present, password of at least 8 characters, 10-digit Student ID (enrolled only), graduation year between 1950 and this year (alumni only), and exactly one of a catalogue course or an "Other" note. The first problem found is returned (400). If the `Student` role is missing from the database, registration fails with "temporarily unavailable" (500). | [api/auth/register/route.ts:10-89](../../src/app/api/auth/register/route.ts#L10-L89) |
| R4 | The email is rejected if already used, as is the Student ID for enrolled students (409). | [api/auth/register/route.ts:91-108](../../src/app/api/auth/register/route.ts#L91-L108) |
| R5 | A course picked from the list must still exist and be active. | [api/auth/register/route.ts:110-120](../../src/app/api/auth/register/route.ts#L110-L120) |
| R6–R7 | The password is hashed (bcrypt, cost 12) and the account is saved as role `Student`, verification `pending`. The applicant sees "pending review". | [api/auth/register/route.ts:122-147](../../src/app/api/auth/register/route.ts#L122-L147) |
| R8 | The Pending Registrations queue lists accounts filtered by verification status. | [api/admin/users/route.ts:24-57](../../src/app/api/admin/users/route.ts#L24-L57) |
| R10–R12 | The admin approves, or rejects with a reason. The Confirm button stays disabled until a reason is typed. | [RejectReasonDialog.tsx:62](../../src/app/%28admin%29/admin/_components/RejectReasonDialog.tsx#L62) |
| R13 | The server also requires a reason when rejecting. | [api/admin/users/[id]/route.ts:70-78](../../src/app/api/admin/users/%5Bid%5D/route.ts#L70-L78) |
| R11, R14 | The decision is saved. Approval clears any old rejection reason. | [api/admin/users/[id]/route.ts:101-124](../../src/app/api/admin/users/%5Bid%5D/route.ts#L101-L124) |
| R15 | An audit entry `REGISTRATION_APPROVED` or `REGISTRATION_REJECTED` is written. | [api/admin/users/[id]/route.ts:126-141](../../src/app/api/admin/users/%5Bid%5D/route.ts#L126-L141) |
| R16 | An approval or rejection email is sent in the background. Email failures are ignored. | [api/admin/users/[id]/route.ts:143-172](../../src/app/api/admin/users/%5Bid%5D/route.ts#L143-L172) |
| R18–R19 | The outcome is enforced at sign-in (page 2, S4–S5). | [api/auth/signin/route.ts:60-75](../../src/app/api/auth/signin/route.ts#L60-L75) |

### 2 · Sign-in and sign-out

| Step | What happens | Source |
|---|---|---|
| S1 | The sign-in form posts a username (email or Student ID) and a password. | [(auth)/signin/page.tsx:39](../../src/app/%28auth%29/signin/page.tsx#L39) |
| S2 | Both fields are required (400). | [api/auth/signin/route.ts:24-28](../../src/app/api/auth/signin/route.ts#L24-L28) |
| S3 | The account is looked up by email *or* Student ID, together with its role and office. | [api/auth/signin/route.ts:32-58](../../src/app/api/auth/signin/route.ts#L32-L58) |
| S4–S5 | A pending or rejected registration is refused (403). | [api/auth/signin/route.ts:60-75](../../src/app/api/auth/signin/route.ts#L60-L75) |
| S6 | An inactive account is refused (403). | [api/auth/signin/route.ts:77-82](../../src/app/api/auth/signin/route.ts#L77-L82) |
| S7 | The password is compared with the bcrypt hash (401 if wrong). | [api/auth/signin/route.ts:84-88](../../src/app/api/auth/signin/route.ts#L84-L88) |
| S8 | The server issues a 20-minute signed access token (user, role, office) and a 7-day renewal token saved in `sessions`. Both are set as http-only cookies. | [api/auth/signin/route.ts:90-105](../../src/app/api/auth/signin/route.ts#L90-L105), [auth.ts:9-16](../../src/lib/auth.ts#L9-L16), [auth.ts:64-82](../../src/lib/auth.ts#L64-L82) |
| S9 | The browser opens the role's dashboard. | [(auth)/signin/page.tsx:46-47](../../src/app/%28auth%29/signin/page.tsx#L46-L47), [utils.ts:13-15](../../src/lib/utils.ts#L13-L15) |
| S10–S12 | Sign-out deletes the session row and clears both cookies. | [api/auth/signout/route.ts:9-17](../../src/app/api/auth/signout/route.ts#L9-L17) |

### 2b · Page access checks and session renewal

| Step | What happens | Source |
|---|---|---|
| A2 | The home page, `/verify` and every `/api/*` call pass straight through. API routes check the session themselves. | [proxy.ts:20-27](../../src/proxy.ts#L20-L27), [auth.ts:95-100](../../src/lib/auth.ts#L95-L100) |
| A3 | The access-token cookie is read and verified. | [proxy.ts:30-31](../../src/proxy.ts#L30-L31) |
| A4–A5 | On the sign-in or register page, a signed-in user is redirected to their dashboard. | [proxy.ts:35-40](../../src/proxy.ts#L35-L40) |
| A6–A7 | With a valid token, the role rules apply: student pages are for Students only, `/office` for Office Staff or Office Head with an office, `/admin` for Admins only. Anyone else is redirected to their own dashboard. | [proxy.ts:71-101](../../src/proxy.ts#L71-L101) |
| A8 | Without a valid token, only known protected areas are guarded. Other paths pass through. | [proxy.ts:43-55](../../src/proxy.ts#L43-L55) |
| A9 | If a renewal cookie exists, the user is sent to the renewal endpoint. Otherwise they go to sign-in with `?next=`. | [proxy.ts:57-68](../../src/proxy.ts#L57-L68) |
| A10 | The renewal token must match an unexpired session. If not, the cookies are cleared and the user goes to sign-in. | [api/auth/refresh/route.ts:19-45](../../src/app/api/auth/refresh/route.ts#L19-L45) |
| A11 | An inactive account loses its session and is redirected to `/login`. | [api/auth/refresh/route.ts:47-51](../../src/app/api/auth/refresh/route.ts#L47-L51) |
| A12–A13 | The session is rotated (old row deleted, new token saved, new access token issued) and the user is redirected back to the requested page. | [api/auth/refresh/route.ts:53-71](../../src/app/api/auth/refresh/route.ts#L53-L71) |

### 3a · Request wizard

| Step | What happens | Source |
|---|---|---|
| W2 | The available document types are loaded. Only active types granted to the user's role appear, and "currently enrolled only" types (COE, COR) are hidden from alumni. | [api/shared/document-types/route.ts:15-68](../../src/app/api/shared/document-types/route.ts#L15-L68) |
| W3 | A load failure shows an error with a Try again button. | [NewRequestClient.tsx:243-246](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L243-L246) |
| W5 | Continue stays disabled until purpose and copies are filled in, plus the term for COG and a clearance file for TOR. The file is limited to 5 MB and school years to past terms. | [NewRequestClient.tsx:268-280](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L268-L280), [Step2RequestDetails.tsx:26](../../src/app/%28portal%29/requests/new/_components/Step2RequestDetails.tsx#L26), [Step2RequestDetails.tsx:45](../../src/app/%28portal%29/requests/new/_components/Step2RequestDetails.tsx#L45) |
| W6 | Two AI checks run in parallel. *Type match* (always): 24-hour cache, then a keyword shortcut, then Gemini. *Purpose quality* (only for "Other" purposes): obviously vague text fails immediately, otherwise Gemini. Rate-limit and overload errors are retried, and any other AI failure counts as "check skipped". | [NewRequestClient.tsx:293-311](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L293-L311), [ai.ts:22-49](../../src/lib/ai.ts#L22-L49), [ai.ts:321-403](../../src/lib/ai.ts#L321-L403), [ai.ts:406-468](../../src/lib/ai.ts#L406-L468) |
| W7 | A vague or inappropriate purpose opens the purpose dialog. | [NewRequestClient.tsx:313-316](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L313-L316) |
| W8 | If the AI is unavailable, or agrees with the chosen type at ≥ 80% confidence, the wizard moves on. Otherwise the type warning opens. | [NewRequestClient.tsx:318-328](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L318-L328), [api/ai/validate-classification/route.ts:48-60](../../src/app/api/ai/validate-classification/route.ts#L48-L60) |
| W9–W10 | Both dialogs offer *Edit purpose* or *Continue anyway*. | [NewRequestClient.tsx:488-511](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L488-L511) |
| W11 | The privacy checkbox must be ticked. | [NewRequestClient.tsx:278](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L278) |
| W12–W13 | The review step fetches a live expected date. It is the larger of (queued workload at the issuing office + this request) ÷ daily capacity (default 20) and the type's minimum preparation days, counted in working days. | [Step4Review.tsx:20-23](../../src/app/%28portal%29/requests/new/_components/Step4Review.tsx#L20-L23), [expected-date.ts:19-38](../../src/lib/expected-date.ts#L19-L38), [expected-date.ts:136-172](../../src/lib/expected-date.ts#L136-L172) |
| W14 | The request is submitted: as multipart data with the file for TOR, as JSON otherwise. | [NewRequestClient.tsx:340-388](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L340-L388) |
| (any step) | Cancel asks for confirmation and returns to the dashboard. Nothing is saved. | [NewRequestClient.tsx:529-549](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L529-L549) |

### 3b · Request submission

| Step | What happens | Source |
|---|---|---|
| P2 | Only the Student role can submit. | [api/portal/requests/route.ts:96-104](../../src/app/api/portal/requests/route.ts#L96-L104) |
| P3 | Purpose must be 1–255 characters and copies 1–10. | [api/portal/requests/route.ts:27-34](../../src/app/api/portal/requests/route.ts#L27-L34), [api/portal/requests/route.ts:107-110](../../src/app/api/portal/requests/route.ts#L107-L110) |
| P4 | The document type must exist and be active. | [api/portal/requests/route.ts:114-123](../../src/app/api/portal/requests/route.ts#L114-L123) |
| P5 | Enrolled-only types are refused for alumni. | [api/portal/requests/route.ts:125-139](../../src/app/api/portal/requests/route.ts#L125-L139) |
| P6 | COG requires a school year and a semester. | [api/portal/requests/route.ts:142-149](../../src/app/api/portal/requests/route.ts#L142-L149) |
| P7–P9 | TOR requires a PDF/JPG/PNG clearance form of at most 5 MB. It is uploaded as a private Cloudinary file and only its ID is kept. | [api/portal/requests/route.ts:154-176](../../src/app/api/portal/requests/route.ts#L154-L176), [cloudinary.ts:25-39](../../src/lib/cloudinary.ts#L25-L39) |
| P10 | The tracking number is `EDOC-<year>-<count of this year's requests + 1>`. | [generate.ts:5-15](../../src/lib/generate.ts#L5-L15) |
| P11 | The request is saved as `Pending`, with the fee copied from the type and payment `Unpaid` if the fee is above zero, otherwise `Paid`. | [api/portal/requests/route.ts:182-198](../../src/app/api/portal/requests/route.ts#L182-L198) |
| P12–P13 | Clearance tasks are created: every parallel office, or else the sequence-1 office. The seed data routes every type to the Registrar at sequence 1. | [api/portal/requests/route.ts:60-92](../../src/app/api/portal/requests/route.ts#L60-L92), [api/portal/requests/route.ts:202-204](../../src/app/api/portal/requests/route.ts#L202-L204), [seed.document.ts:166-198](../../src/db/seed/seed.document.ts#L166-L198) |
| P14 | An audit entry `REQUEST_SUBMITTED` is written. | [api/portal/requests/route.ts:206-211](../../src/app/api/portal/requests/route.ts#L206-L211) |
| P15 | In the background: the student gets an in-app notice and live push; staff of every involved office get email, an in-app notice and live push, deduplicated per person. | [api/portal/requests/route.ts:214-308](../../src/app/api/portal/requests/route.ts#L214-L308) |
| P16 | The response returns the tracking number and fee. The success dialog shows them and links to the request page. | [api/portal/requests/route.ts:310-318](../../src/app/api/portal/requests/route.ts#L310-L318), [NewRequestClient.tsx:151-225](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L151-L225) |
| (refusals) | Every error is shown as a browser alert, and the wizard stays on Step 4. | [NewRequestClient.tsx:379-385](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L379-L385) |

### 4 · Office processing: payment, clearance and routing

| Step | What happens | Source |
|---|---|---|
| C2 | The queue lists this office's `Pending` clearance tasks, newest first, each with an expected date. | [api/office/queue/route.ts:25-63](../../src/app/api/office/queue/route.ts#L25-L63), [api/office/queue/route.ts:83-87](../../src/app/api/office/queue/route.ts#L83-L87), [expected-date.ts:54-92](../../src/lib/expected-date.ts#L54-L92) |
| C4 | The staff member's office must have a clearance task on the request (403 otherwise). | [api/office/requests/[id]/route.ts:117-124](../../src/app/api/office/requests/%5Bid%5D/route.ts#L117-L124) |
| C5 | The detail view shows the request, all tasks and the audit timeline. For TOR, it streams the student's clearance form via a short-lived signed URL, after re-checking that the office is involved. For the Registrar, it adds an academic-records summary. | [api/office/requests/[id]/route.ts:126-204](../../src/app/api/office/requests/%5Bid%5D/route.ts#L126-L204), [api/office/requests/[id]/clearance-form/route.ts:46-66](../../src/app/api/office/requests/%5Bid%5D/clearance-form/route.ts#L46-L66) |
| C6–C8 | While payment is `Unpaid` and this office's task is `Pending`, staff see a **Mark as Paid** button. The student pays at the Registrar's Office, outside the system. | [(staff)/office/requests/[id]/page.tsx:322-345](../../src/app/%28staff%29/office/requests/%5Bid%5D/page.tsx#L322-L345) |
| C9–C10 | The server requires a `Pending` task for this office and refuses if payment is already confirmed. It sets `Paid` and writes the audit entry `PAYMENT_CONFIRMED`. | [api/office/requests/[id]/payment/route.ts:40-75](../../src/app/api/office/requests/%5Bid%5D/payment/route.ts#L40-L75) |
| C11 | Clear is disabled until payment is confirmed. Reject is disabled until remarks are typed. | [(staff)/office/requests/[id]/page.tsx:384](../../src/app/%28staff%29/office/requests/%5Bid%5D/page.tsx#L384), [(staff)/office/requests/[id]/page.tsx:399](../../src/app/%28staff%29/office/requests/%5Bid%5D/page.tsx#L399) |
| C11b | The server also refuses a rejection without remarks (400), because the remark is the reason the student is shown. | [api/office/clearance/[taskId]/route.ts:35-51](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L35-L51) |
| C12 | The task must belong to the staff member's office and still be `Pending` (403 / 409). | [api/office/clearance/[taskId]/route.ts:53-76](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L53-L76) |
| C13–C14 | Reject marks the task `Rejected` (with the remark) and the request `Action Required`. | [api/office/clearance/[taskId]/route.ts:108-132](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L108-L132) |
| C15–C16 | Clear requires payment `Paid` (422 otherwise) and then marks the task `Cleared`. | [api/office/clearance/[taskId]/route.ts:101-118](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L101-L118) |
| C17–C20 | Routing: wait while any task is `Rejected` or any parallel task is still `Pending`. Otherwise create a task for the next sequence number. If there is none, set the request to `Ready for Release` and write the audit entry `REQUEST_READY_FOR_RELEASE`. | [routing.ts:6-67](../../src/lib/routing.ts#L6-L67), [api/office/clearance/[taskId]/route.ts:120-122](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L120-L122) |
| C21 | An audit entry `CLEARANCE_CLEARED` or `CLEARANCE_REJECTED` is written. | [api/office/clearance/[taskId]/route.ts:134-144](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L134-L144) |
| C22 | In the background, the student gets an in-app notice, a live push and an email. A clearance uses the "cleared" email; a rejection uses the "Action required" email, which carries the office's reason. | [api/office/clearance/[taskId]/route.ts:147-234](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L147-L234), [ClearanceRejected.tsx:13-58](../../src/email-templates/ClearanceRejected.tsx#L13-L58) |
| C23 | The student's request page lists each office's status and remark. | [api/portal/requests/[id]/route.ts:61-91](../../src/app/api/portal/requests/%5Bid%5D/route.ts#L61-L91) |

### 4b · Action Required and resubmission

| Step | What happens | Source |
|---|---|---|
| X2 | The request page shows each rejecting office with its remark on the Action Required banner, plus a resubmit panel. The panel has an optional note and, for TOR only, an optional replacement clearance form. | [(portal)/requests/[id]/page.tsx:229-267](../../src/app/%28portal%29/requests/%5Bid%5D/page.tsx#L229-L267), [(portal)/requests/[id]/page.tsx:448-455](../../src/app/%28portal%29/requests/%5Bid%5D/page.tsx#L448-L455), [ResubmitRequestPanel.tsx:24-171](../../src/app/%28portal%29/requests/%5Bid%5D/_components/ResubmitRequestPanel.tsx#L24-L171) |
| X3 | The student clicks **Resubmit for clearance**. The note is sent as JSON, or as multipart data when a form is attached. | [ResubmitRequestPanel.tsx:54-83](../../src/app/%28portal%29/requests/%5Bid%5D/_components/ResubmitRequestPanel.tsx#L54-L83) |
| X4 | The request must belong to the student and still be `Action Required` (403 / 404 / 409). | [api/portal/requests/[id]/resubmit/route.ts:58-86](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L58-L86) |
| X5 | The note must be at most 2,000 characters. | [api/portal/requests/[id]/resubmit/route.ts:29-31](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L29-L31), [api/portal/requests/[id]/resubmit/route.ts:87-95](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L87-L95) |
| X6 | At least one clearance task must still be `Rejected`. | [api/portal/requests/[id]/resubmit/route.ts:97-107](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L97-L107) |
| X7–X9 | A replacement form is accepted only for TOR, and only as PDF/JPG/PNG of at most 5 MB, the same rules as at submission. It is then uploaded privately. | [api/portal/requests/[id]/resubmit/route.ts:109-134](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L109-L134), [cloudinary.ts:15-18](../../src/lib/cloudinary.ts#L15-L18) |
| X10 | In one transaction: the request returns to `Pending` (only if still `Action Required`, so a double submit is refused with 409); every `Rejected` task returns to `Pending` with its remark cleared; the note is posted to the message thread. | [api/portal/requests/[id]/resubmit/route.ts:136-177](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L136-L177) |
| X11 | An audit entry `REQUEST_RESUBMITTED` is written. Both timelines label it "Resubmitted for clearance". | [api/portal/requests/[id]/resubmit/route.ts:179-192](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L179-L192), [audit-labels.ts:43-46](../../src/lib/audit-labels.ts#L43-L46), [api/portal/requests/[id]/route.ts:180-188](../../src/app/api/portal/requests/%5Bid%5D/route.ts#L180-L188) |
| X12 | Staff of the offices whose task restarted get an in-app notice. | [api/portal/requests/[id]/resubmit/route.ts:194-220](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L194-L220) |
| X13–X14 | The page reloads as `Pending`, and the task is back in the office queue (page 4, C1). | [api/office/queue/route.ts:25-63](../../src/app/api/office/queue/route.ts#L25-L63) |

### 5 · Certificate generation, pickup and release

| Step | What happens | Source |
|---|---|---|
| D2–D3 | The Generate Document panel appears only for generated types (COE/COR/COG) that are `Ready for Release`. | [(staff)/office/requests/[id]/page.tsx:467](../../src/app/%28staff%29/office/requests/%5Bid%5D/page.tsx#L467) |
| D4 | The server requires a generated type, the staff member's office to be the issuing office, and status `Ready for Release`. | [api/office/requests/[id]/document/route.ts:55-79](../../src/app/api/office/requests/%5Bid%5D/document/route.ts#L55-L79) |
| D5 | The `.docx` template is filled in, converted to HTML and printed to PDF with headless Chrome. Nothing is stored. | [document-generation.ts:19-64](../../src/lib/document-generation.ts#L19-L64) |
| D6–D7 | An audit entry `DOCUMENT_GENERATED` is written and the PDF is streamed back. | [api/office/requests/[id]/document/route.ts:81-101](../../src/app/api/office/requests/%5Bid%5D/document/route.ts#L81-L101) |
| D8–D10 | The student's **Download** button (shown for Ready for Release / Released requests) fetches the download endpoint. | [(portal)/requests/page.tsx:426-436](../../src/app/%28portal%29/requests/page.tsx#L426-L436), [api/portal/documents/download/[id]/route.ts:4-13](../../src/app/api/portal/documents/download/%5Bid%5D/route.ts#L4-L13) |
| D11 | The release method is shown to staff as "Physical Pickup Only". | [(staff)/office/requests/[id]/page.tsx:307](../../src/app/%28staff%29/office/requests/%5Bid%5D/page.tsx#L307) |
| D12 | The admin request page shows **Mark as Released** only while the request is `Ready for Release`. | [(admin)/admin/requests/[id]/page.tsx:159-161](../../src/app/%28admin%29/admin/requests/%5Bid%5D/page.tsx#L159-L161), [MarkAsReleasedPanel.tsx:43](../../src/components/shared/MarkAsReleasedPanel.tsx#L43) |
| D14–D16 | Only an Admin can release a request, and only one that is `Ready for Release`. The status becomes `Released` and the audit entry `REQUEST_RELEASED` is written. | [api/office/requests/[id]/release/route.ts:21-58](../../src/app/api/office/requests/%5Bid%5D/release/route.ts#L21-L58) |

### 6 · Request messages and notifications

| Step | What happens | Source |
|---|---|---|
| M2 | A student can only post on their own request. | [api/portal/requests/[id]/messages/route.ts:112-119](../../src/app/api/portal/requests/%5Bid%5D/messages/route.ts#L112-L119) |
| M3, M10 | A message must be 1–2,000 characters. | [api/portal/requests/[id]/messages/route.ts:101-103](../../src/app/api/portal/requests/%5Bid%5D/messages/route.ts#L101-L103), [api/office/requests/[id]/messages/route.ts:113-115](../../src/app/api/office/requests/%5Bid%5D/messages/route.ts#L113-L115) |
| M4–M5 | A student message is saved, and every staff member of the issuing office and the clearance offices gets an in-app notice. No email or live push is sent. | [api/portal/requests/[id]/messages/route.ts:129-183](../../src/app/api/portal/requests/%5Bid%5D/messages/route.ts#L129-L183) |
| M9 | Staff can post if their office has, or had, any clearance task on the request. | [api/office/requests/[id]/messages/route.ts:30-37](../../src/app/api/office/requests/%5Bid%5D/messages/route.ts#L30-L37), [api/office/requests/[id]/messages/route.ts:117-136](../../src/app/api/office/requests/%5Bid%5D/messages/route.ts#L117-L136) |
| M11–M12 | A staff message is saved and the student gets an in-app notice. | [api/office/requests/[id]/messages/route.ts:150-166](../../src/app/api/office/requests/%5Bid%5D/messages/route.ts#L150-L166) |
| M16, M18 | Opening the thread marks the other side's messages as read. | [api/portal/requests/[id]/messages/route.ts:53-63](../../src/app/api/portal/requests/%5Bid%5D/messages/route.ts#L53-L63), [api/office/requests/[id]/messages/route.ts:64-75](../../src/app/api/office/requests/%5Bid%5D/messages/route.ts#L64-L75) |
| M20 | The bell opens a live (server-sent events) connection keyed by user ID, kept in server memory. | [useNotifications.ts:29](../../src/hooks/useNotifications.ts#L29), [api/notifications/subscribe/route.ts:4-40](../../src/app/api/notifications/subscribe/route.ts#L4-L40), [notification-connections.ts:2](../../src/lib/notification-connections.ts#L2) |
| M21 | The latest 50 notices are loaded. | [useNotifications.ts:102-134](../../src/hooks/useNotifications.ts#L102-L134), [api/notifications/list/route.ts:6-20](../../src/app/api/notifications/list/route.ts#L6-L20) |
| M22 | Status events are pushed to an open connection. They are sent by the submission and clearance flows only. | [api/notifications/send/route.ts:64-72](../../src/app/api/notifications/send/route.ts#L64-L72), [api/portal/requests/route.ts:228](../../src/app/api/portal/requests/route.ts#L228), [api/office/clearance/[taskId]/route.ts:196](../../src/app/api/office/clearance/%5BtaskId%5D/route.ts#L196) |
| M24 | Clicking a notice marks it read. | [api/notifications/[id]/read/route.ts:6-20](../../src/app/api/notifications/%5Bid%5D/read/route.ts#L6-L20) |

### 7 · Admin Assistant

| Step | What happens | Source |
|---|---|---|
| Q2–Q3 | Admins only. The question must be 1–1,000 characters, with at most 40 history turns alternating user/model. | [api/admin/assistant/route.ts:12-38](../../src/app/api/admin/assistant/route.ts#L12-L38) |
| Q4 | Forecast-style questions get a fixed refusal without calling the AI. | [admin-assistant.ts:240-253](../../src/lib/admin-assistant.ts#L240-L253), [admin-assistant.ts:305-307](../../src/lib/admin-assistant.ts#L305-L307) |
| Q5 | The model gets strict rules and seven read-only lookup tools. | [admin-assistant.ts:68-216](../../src/lib/admin-assistant.ts#L68-L216), [admin-assistant.ts:256-271](../../src/lib/admin-assistant.ts#L256-L271), [admin-assistant.ts:301-320](../../src/lib/admin-assistant.ts#L301-L320) |
| Q6–Q9 | Up to five rounds of "model asks → run lookups → send results back". | [admin-assistant.ts:222-231](../../src/lib/admin-assistant.ts#L222-L231), [admin-assistant.ts:327-338](../../src/lib/admin-assistant.ts#L327-L338) |
| F3 | Fallback replies are used when the model is still asking for lookups after 5 rounds, or when its reply is empty. | [admin-assistant.ts:340-356](../../src/lib/admin-assistant.ts#L340-L356) |
| F4 | AI errors are retried on 429/503, then answered with a "rate limit" or "unavailable" message. | [admin-assistant.ts:275-293](../../src/lib/admin-assistant.ts#L275-L293), [admin-assistant.ts:359-371](../../src/lib/admin-assistant.ts#L359-L371) |

## Gaps and unclear behaviour

These are confirmed by reading the code, but they are *not* part of the intended flow. Numbers match the **Gaps & unclear behaviour** tab in the diagram. "Latent" means the problem can't happen with the current seed data but would surface under other configurations.

| # | Issue | Type | Diagram page › step | Evidence |
|---|---|---|---|---|
| 1 | **“In Process” and “Cancelled” are never set** — Both statuses appear in filters, badges and the expected-date queue, but no code path assigns them (Cancel is offered only for Pending / In Process and does nothing). Requests go Pending → Ready for Release (or Action Required) → Released. | Breaks the lifecycle | 0 › O6 | [expected-date.ts:8](../../src/lib/expected-date.ts#L8)<br>[(portal)/requests/[id]/page.tsx:271](../../src/app/%28portal%29/requests/%5Bid%5D/page.tsx#L271) |
| 2 | **Student is not told about Ready for Release or Released** — No notification or email is created at either status change; the student only learns it by opening the request page. The last clearance notice says the office “cleared” the request, not that it is ready for pickup. | Missing feature | 0 › O14, 5 › D17, 5 › D1 | [routing.ts:58-67](../../src/lib/routing.ts#L58-L67)<br>[api/office/requests/[id]/release/route.ts:48-58](../../src/app/api/office/requests/%5Bid%5D/release/route.ts#L48-L58) |
| 3 | **Decisions are not guarded against repeats or reversal** — The approve/reject endpoint never checks the current status: re-approving or re-rejecting writes another audit entry and sends another email. It also accepts “pending”, which moves an account back to pending with no audit entry and no email. | Data integrity | 1 › R11 | [api/admin/users/[id]/route.ts:70-74](../../src/app/api/admin/users/%5Bid%5D/route.ts#L70-L74)<br>[api/admin/users/[id]/route.ts:107-126](../../src/app/api/admin/users/%5Bid%5D/route.ts#L107-L126) |
| 4 | **Account status is revealed before the password is checked** — Pending / rejected / deactivated checks run before the password comparison, so anyone can learn whether an email or Student ID is registered and its review state without knowing the password. The two “wrong login” messages also differ (“Invalid username or password” vs “Invalid credentials”). | Security | 2 › S4 | [api/auth/signin/route.ts:56-88](../../src/app/api/auth/signin/route.ts#L56-L88) |
| 5 | **Nothing can deactivate an account** — No endpoint changes an account’s active status, so the “deactivated” branch is only reachable by editing the database directly. | Missing feature | 2 › S6 | [api/auth/signin/route.ts:77-82](../../src/app/api/auth/signin/route.ts#L77-L82)<br>[api/auth/refresh/route.ts:47](../../src/app/api/auth/refresh/route.ts#L47) |
| 6 | **Return address is ignored** — The access guard (page 2b) adds ?next=<page> when it sends a user to sign in, but the sign-in page ignores it and always opens the role dashboard. | Usability | 2 › S9 | [proxy.ts:66](../../src/proxy.ts#L66)<br>[(auth)/signin/page.tsx:46-47](../../src/app/%28auth%29/signin/page.tsx#L46-L47) |
| 7 | **The “/verify” page does not exist** — The guard treats /verify as public and the home page links to it for QR document verification, but no /verify page exists (and no QR or hash-verification code), so the link shows “not found”. | Missing feature | 2b › A2 | [proxy.ts:10](../../src/proxy.ts#L10)<br>[page.tsx:141](../../src/app/page.tsx#L141) |
| 8 | **Deactivated users are sent to a page that does not exist** — Renewal redirects a deactivated account (and any unexpected renewal error) to /login, but the sign-in page is /signin, so the user lands on “not found”. | Bug | 2b › A11 | [api/auth/refresh/route.ts:50](../../src/app/api/auth/refresh/route.ts#L50)<br>[api/auth/refresh/route.ts:73](../../src/app/api/auth/refresh/route.ts#L73) |
| 9 | **Renewal ignores registration status** — Only the active flag is re-checked. An account moved back to pending or rejected after approval keeps renewing its session for up to 7 days. | Security | 2b › A11 | [api/auth/refresh/route.ts:25-51](../../src/app/api/auth/refresh/route.ts#L25-L51) |
| 10 | **Renewal stores officeId as the text “null”** — For a user with no office, the renewed access pass carries officeId = "null" (a string) instead of an empty value. Harmless today because the /office check looks at the role first. | Bug | 2b › A12 | [api/auth/refresh/route.ts:56](../../src/app/api/auth/refresh/route.ts#L56) |
| 11 | **AI checks are advisory only** — The checks run only in the browser before Step 3. The submit endpoint never re-checks the purpose, and “Continue anyway” always lets the student through. | Unclear intent | 3a › W6 | [NewRequestClient.tsx:295-333](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L295-L333)<br>[api/portal/requests/route.ts:94-211](../../src/app/api/portal/requests/route.ts#L94-L211) |
| 12 | **A type-mismatch warning can be skipped silently** — When the purpose is flagged, the type-match result is thrown away: “Continue anyway” goes straight to Step 3 without ever showing the mismatch or low-confidence warning. | Usability | 3a › W9 | [NewRequestClient.tsx:313-316](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L313-L316)<br>[NewRequestClient.tsx:494](../../src/app/%28portal%29/requests/new/_components/NewRequestClient.tsx#L494) |
| 13 | **Submission skips the role-to-document permission check** — The form lists only document types granted to the user’s role, but the submit endpoint checks only “active” and the enrolled-only rule, not those role grants. Harmless while every type is granted to Students. | Validation | 3b › P4 | [api/portal/requests/route.ts:114-139](../../src/app/api/portal/requests/route.ts#L114-L139)<br>[api/shared/document-types/route.ts:34-37](../../src/app/api/shared/document-types/route.ts#L34-L37) |
| 14 | **Tracking numbers can collide** — The number is “this year’s count + 1”. Two submissions at the same moment can get the same number; the unique constraint then rejects one of them with a 500 error. | Data integrity | 3b › P10 | [generate.ts:8-14](../../src/lib/generate.ts#L8-L14)<br>[request.schema.ts:6](../../src/db/schema/request.schema.ts#L6) |
| 15 | **No transaction around the save** — The request, its clearance tasks and the audit entry are separate writes. If task creation fails, the request stays saved with no task, so no office queue shows it. A TOR form uploaded before a failed save is left orphaned in storage. | Data integrity | 3b › P13 | [api/portal/requests/route.ts:174-211](../../src/app/api/portal/requests/route.ts#L174-L211) |
| 16 | **Types without clearance would be stranded** — If a type did not require clearance, no task is created — and no other code moves the request forward or shows it to an office. All seeded types currently require clearance, so this path is latent. | Breaks the lifecycle (latent) | 3b › P12 | [api/portal/requests/route.ts:202-204](../../src/app/api/portal/requests/route.ts#L202-L204)<br>[api/office/requests/[id]/route.ts:117-124](../../src/app/api/office/requests/%5Bid%5D/route.ts#L117-L124) |
| 17 | **Any involved office can confirm payment** — Mark as Paid is accepted from any office with a Pending task on the request, not only the cashier or Registrar. Latent with the single-office seed data. | Unclear intent | 4 › C9 | [api/office/requests/[id]/payment/route.ts:40-59](../../src/app/api/office/requests/%5Bid%5D/payment/route.ts#L40-L59) |
| 18 | **Replaced clearance forms stay in storage** — Uploading a replacement TOR form points the request at the new file, but the old one is never deleted from Cloudinary — a personal document kept with nothing referencing it. | Data retention | 4b › X9 | [api/portal/requests/[id]/resubmit/route.ts:132-133](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L132-L133)<br>[api/portal/requests/[id]/resubmit/route.ts:144](../../src/app/api/portal/requests/%5Bid%5D/resubmit/route.ts#L144)<br>[cloudinary.ts:25-39](../../src/lib/cloudinary.ts#L25-L39) |
| 19 | **Generated certificate is a placeholder** — The template only receives the generation date — no student name, course, grades or registration data — so every COE/COR/COG PDF is the same apart from the date. | Missing feature | 5 › D5 | [document-generation.ts:55-61](../../src/lib/document-generation.ts#L55-L61) |
| 20 | **TOR has no production step** — TOR is configured as an “UPLOAD” type, but no endpoint lets staff upload or attach the finished transcript. | Missing feature | 5 › D2 | [seed.document.ts:35](../../src/db/seed/seed.document.ts#L35)<br>[api/office/requests/[id]/document/route.ts:55-60](../../src/app/api/office/requests/%5Bid%5D/document/route.ts#L55-L60) |
| 21 | **Student download is a stub without access control** — The download endpoint ignores the request ID, doesn’t check sign-in and always returns public/sample_cor.pdf. The request list shows the Download button for every Ready for Release / Released request. | Security | 5 › D9 | [api/portal/documents/download/[id]/route.ts:4-13](../../src/app/api/portal/documents/download/%5Bid%5D/route.ts#L4-L13)<br>[api/portal/requests/route.ts:349](../../src/app/api/portal/requests/route.ts#L349) |
| 22 | **Release is not linked to the pickup** — The system doesn’t record who collected the document or when, and doesn’t require it before release; the admin’s click is the only evidence. | Missing feature | 5 › D16 | [api/office/requests/[id]/release/route.ts:48-58](../../src/app/api/office/requests/%5Bid%5D/release/route.ts#L48-L58) |
| 23 | **Notification endpoints don’t check who is asking** — Subscribe, list, mark-read and send all take a user ID or notice ID from the URL/body with no session check. Anyone can read another user’s notices, mark them read, or push fake live notices. | Security | 6 › M20 | [api/notifications/subscribe/route.ts:5](../../src/app/api/notifications/subscribe/route.ts#L5)<br>[api/notifications/list/route.ts:8](../../src/app/api/notifications/list/route.ts#L8)<br>[api/notifications/[id]/read/route.ts:6-18](../../src/app/api/notifications/%5Bid%5D/read/route.ts#L6-L18)<br>[api/notifications/send/route.ts:11-21](../../src/app/api/notifications/send/route.ts#L11-L21) |
| 24 | **Live delivery is fragile** — Connections live in one server process’s memory, one per user (a newer tab replaces the older). Users on another instance, or offline, get nothing live. Message threads never update live — only after sending or pressing refresh. | Reliability | 6 › M22 | [notification-connections.ts:2](../../src/lib/notification-connections.ts#L2)<br>[api/notifications/subscribe/route.ts:15](../../src/app/api/notifications/subscribe/route.ts#L15)<br>[MessageThreadPanel.tsx:75](../../src/components/shared/MessageThreadPanel.tsx#L75) |

## Not covered by these diagrams

These parts of the code are configuration screens or read-only reports, not workflows. They were reviewed but not drawn: admin management of courses, offices, document types and capacity settings; the admin and office dashboards with their AI insight cards; the audit-log viewer; and the payments report.
