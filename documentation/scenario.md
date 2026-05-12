# e-Docs Demo Scenario Guide
> Pampanga State University — Main Campus
> Use this guide to walk through the system during a client or panel demonstration.

---

## Test Accounts (All passwords: `password123`)

| Role | School ID | Email | Name |
|---|---|---|---|
| Student | `2021-00001` | juan.delacruz@psu.edu.ph | Juan Dela Cruz |
| Student | `2021-00002` | maria.santos@psu.edu.ph | Maria Santos |
| Faculty | `FAC-2019-001` | pedro.reyes@psu.edu.ph | Pedro Reyes |
| Non-Teaching Staff | `NTS-2020-001` | rosa.garcia@psu.edu.ph | Rosa Garcia |
| Office Staff (Registrar) | `EMP-2018-001` | registrar.staff@psu.edu.ph | Ana Reyes |
| Office Head (Registrar) | `EMP-2015-001` | registrar.head@psu.edu.ph | Francis Aquino |
| Office Staff (Cashier) | `EMP-2018-002` | cashier.staff@psu.edu.ph | Ben Torres |
| Admin | `ADM-2024-001` | admin@psu.edu.ph | System Administrator |

---

## Scenario 1 — COE Request, Normal Flow (No AI Warning)

**Goal:** Show a straightforward request from login to submission.
**Login:** `2021-00001` / `password123`

### Steps
1. Go to `/signin` and enter School ID `2021-00001` and password `password123`
2. Land on the **Student Dashboard** — shows request stats and recent activity
3. Click **New Request** or navigate to `/requests/new`
4. **Step 1 – Document Type:** Select **Certificate of Enrollment (COE)** then Continue
5. **Step 2 – Request Details:**
   - Purpose: select **"Employment"** (predefined — AI skips quality check)
   - Copies: `1`
   - Release Mode: `Digital (PDF)`
6. Click **Continue**

### What the AI does
- Calls `/api/ai/validate-classification`
- Gemini checks: "Does Employment match COE?" — Yes, it matches
- Confidence over 80% — **AI warning does NOT trigger** — proceeds to Step 3

7. **Step 3 – Data Privacy:** Check "I agree" then Continue
8. **Step 4 – Review:** Click **Submit Request**
9. Success modal shows tracking number (e.g. `EDC-2025-00XXX`) and fee **50 PHP**

**Demo point:** Show the tracking number and the "Complete Payment" button.

---

## Scenario 2 — COE + Wrong Purpose, AI Classification Dialog Triggers

**Goal:** Show AI catching a wrong document type selection.
**Login:** `2021-00001` / `password123`

### Steps
1. Navigate to `/requests/new`
2. **Step 1:** Select **Certificate of Enrollment (COE)** then Continue
3. **Step 2:** Purpose: select **"Transfer to Another School"**, Copies: `1`
4. Click **Continue**

### What the AI does
- Gemini detects mismatch — suggests **Transfer Credential (TC)** instead
- Confidence ~0.90 — **AI classification dialog TRIGGERS**

### What appears on screen

```
AI suggests a different document

Selected:   Certificate of Enrollment
Suggested:  Transfer Credential
Confidence: 90%

"Student purpose is transferring to another school. This requires a
Transfer Credential, not a Certificate of Enrollment."

[ Edit purpose ]    [ Continue anyway ]
```

**Demo point:** AI catches the common mistake before it reaches staff.

5. Click **"Continue anyway"** to override — complete and submit normally

---

## Scenario 3 — COE + Vague Custom Purpose, Quality Warning Triggers

**Goal:** Show AI flagging an incomplete or vague custom purpose.
**Login:** `2021-00001` / `password123`

### Steps
1. Navigate to `/requests/new`
2. **Step 1:** Select **Certificate of Enrollment (COE)** then Continue
3. **Step 2:** Purpose: select **"Other"**, then type `for use` in the text field
4. Click **Continue**

### What the AI does
- Runs classification + quality checks **in parallel**
- Quality check: "Is 'for use' specific enough?" — No, too vague
- **Inline amber warning banner appears** (soft warning, not a blocker)

### What appears on screen

```
Purpose may be too vague

"The purpose 'for use' does not provide enough context for
 processing a Certificate of Enrollment request."

Suggestion: Describe specifically why you need this document,
e.g. 'Required for scholarship application at CHED'

[ Dismiss and continue anyway ]
```

**Demo point:** Non-blocking warning. Reduces back-and-forth caused by unclear requests.

5. Click **"Dismiss and continue anyway"** to proceed to Step 3

---

## Scenario 4 — COE + Specific Custom Purpose, AI Passes Cleanly

**Goal:** Show that a well-written custom purpose passes both AI checks.
**Login:** `2021-00001` / `password123`

### Steps
1. Navigate to `/requests/new`
2. **Step 1:** Select **COE** then Continue
3. **Step 2:** Purpose: select **"Other"**, type:
   `Required for BDO bank account opening under the student banking program`
4. Click **Continue**

### What the AI does
- Classification — matches — no mismatch
- Quality — specific and plausible — passes
- **No warnings trigger** — straight to Step 3

**Demo point:** Same "Other" path as Scenario 3 but specific text equals zero friction.

---

## Scenario 5 — TOR Request with Full Multi-Office Clearance

**Goal:** Show the clearance workflow spanning multiple offices with SLA tracking.
**Login:** `2021-00001` / `password123`

### Steps
1. Navigate to `/requests/new`
2. **Step 1:** Select **Transcript of Records (TOR)** then Continue
3. **Step 2:** Purpose: **"Board Examination"**, Copies: `1`, Release: `Physical Pickup`
4. Complete all steps and Submit

### Clearance flow in the background

TOR requires 4 offices in parallel, then Registrar final sign-off:

- Library (LIB)
- Cashier/Finance (UCF)
- Property/Supply (PSO)
- Guidance/OSAS (OSAS)
- All must clear first, then Registrar (OUR) gives final approval

Status becomes **Pending Clearance**, Fee: **150 PHP**, SLA: **7 working days**

**Demo point:** Show status and SLA deadline on the student dashboard. Each office works independently in parallel.

---

## Scenario 6 — Office Staff Processes a Clearance

**Goal:** Show the staff side of approving a request and the AI-generated notification.
**Login:** `EMP-2018-001` / `password123` (Ana Reyes — Registrar)

### Steps
1. Login then navigate to **Queue** at `/office/queue`
2. See tasks with SLA badges: On Track / At Risk / Breached
3. Click **View** on a COE or TOR task from earlier scenarios
4. Review the details then click **Approve**

### AI-generated notification on approval

Instead of a hardcoded message, Gemini generates a personalized one such as:

"Your COE request (EDC-2025-00XXX) has been approved by the Registrar's Office. You may now proceed to the next step or await document release."

**Demo point:** Keep the student account open in a second tab. Show the NotificationBell updating live the moment staff clicks Approve (real-time SSE push).

---

## Scenario 7 — Admin Panel Walkthrough

**Goal:** Show system-wide management and oversight.
**Login:** `ADM-2024-001` / `password123`

| URL | What to show |
|---|---|
| `/admin/dashboard` | System stats, activity feed, top document types, system status |
| `/admin/users` | Full user list with role filter and search |
| `/admin/offices` | 8 offices with staff count and pending tasks |
| `/admin/document-types` | Fees, SLA days, clearance required, available roles |
| `/admin/requests` | All requests filtered by status, payment, SLA |
| `/admin/audit-logs` | Immutable event log filtered by category |

**Demo point:** Filter audit logs by `clearance` for approval history, by `auth` for logins. Mention this satisfies **RA 10173 (Data Privacy Act of 2012)** accountability requirements.

---

## Scenario 8 — Faculty Request (Role-Based Document Access)

**Goal:** Show role-based filtering — faculty see different documents than students.
**Login:** `FAC-2019-001` / `password123` (Pedro Reyes — Faculty)

### Steps
1. Navigate to `/requests/new`
2. **Step 1:** Notice COE, TOR, COG, TC are NOT available. Faculty sees only:
   - General Clearance (GENCLR)
   - Service Record (SR)
   - Certificate of Employment (COEMPL)
3. Select **Certificate of Employment (COEMPL)**, Purpose: **"Loan Application"**, Submit
4. Fee: **Free (0 PHP)**

**Demo point:** Role-based access is enforced at the API level, not just the UI.

---

## AI Trigger Cheat Sheet

| Purpose | Document | Classification AI | Quality AI | Result |
|---|---|---|---|---|
| Employment | COE | Match | Skipped (predefined) | No warning |
| Transfer to Another School | COE | Mismatch suggests TC | Skipped | Dialog appears |
| Other then type "for use" | COE | Match | Too vague | Banner appears |
| Other then type specific sentence | COE | Match | Passes | No warning |
| Board Examination | TOR | Match | Skipped (predefined) | No warning |

---

## Demo Day Quick Reference

```
STUDENT
  Login:   2021-00001 / password123
  No warn: COE + Employment
  Dialog:  COE + Transfer to Another School
  Banner:  COE + Other + type "for use"
  Clean:   COE + Other + type a specific sentence

STAFF
  Login:   EMP-2018-001 / password123
  Path:    /office/dashboard then /office/queue then View then Approve

ADMIN
  Login:   ADM-2024-001 / password123
  Path:    /admin/dashboard then /admin/users then /admin/audit-logs
```

---

## Notes for Panelists

- AI uses **Google Gemini 2.5 Flash** with automatic retry on 503 overload (up to 3 retries with backoff)
- If Gemini is still unavailable after retries, checks fail silently — no broken flow
- Payment is in **sandbox mode** — no real charges during demo
- Notifications are **real-time via SSE** — open two browser tabs to show live push
- All actions are permanently logged at `/admin/audit-logs`
- Default password for all accounts: `password123`
