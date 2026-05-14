# Document Request Workflow Demo Tutorial

This tutorial walks through the complete document request clearance workflow in two parts:

- **Tutorial 1** — Single-office clearance (COG: Certificate of Grades)
- **Tutorial 2** — Multi-office clearance (TOR: Transcript of Records)

---

# Tutorial 1: Single-Office Clearance

**Document Type**: Certificate of Grades (COG)
**Request**: `EDOC-2026-000003`
**Student**: Juan — School ID `2021-00001`
**Purpose**: Board Examination
**Clearance**: OUR only (1 office)

---

## Part 1: Student View

### Step 1.1: Login as Student Juan

| Field     | Value        |
| --------- | ------------ |
| School ID | `2021-00001` |
| Full Name | Juan         |
| Role      | Student      |

Navigate to the signin page, enter School ID `2021-00001`, and you will be redirected to the student portal dashboard.

### Step 1.2: View Active Requests

Juan has the following requests in various states:

| Tracking Number      | Document | Purpose        | Status            | Fee       | Due Date       |
| -------------------- | -------- | -------------- | ----------------- | --------- | -------------- |
| EDOC-2026-000001     | TOR      | Employment     | Pending           | 150.00    | 2026-05-10     |
| EDOC-2026-000002     | COE      | Scholarship    | Ready for Release | 50.00     | 2026-05-07     |
| **EDOC-2026-000003** | **COG**  | **Board Exam** | **Pending**       | **50.00** | **2026-05-08** |
| EDOC-2026-000004     | CGMC     | Government     | Released          | 50.00     | 2026-05-05     |
| EDOC-2026-000005     | TC       | Transfer       | Action Required   | 100.00    | 2026-05-09     |

### Step 1.3: Open EDOC-2026-000003 (COG Request)

Click on **EDOC-2026-000003**. The request detail card shows:

- Tracking Number: `EDOC-2026-000003`
- Document Type: Certificate of Grades (COG)
- Purpose: Board Examination
- Copies: 1
- Release Mode: Digital
- Fee Amount: 50.00
- Payment Status: **Unpaid**
- Current Status: **Pending**

### Step 1.4: Understand Clearance Requirements

The Clearance Status section shows a single requirement:

```
Clearance Requirements for COG (EDOC-2026-000003):

1. Office of the University Registrar (OUR)   [Status: Pending]
```

Once OUR clears the request, the document will be ready for release.

---

## Part 2: Staff View — OUR Clearance

### Step 2.1: Logout and Login as OUR Head

| Field       | Value                              |
| ----------- | ---------------------------------- |
| Employee ID | `EMP-2015-001`                     |
| Name        | Francis Aquino                     |
| Role        | Office Head                        |
| Office      | Office of the University Registrar |

### Step 2.2: Navigate to Queue

In the staff dashboard, click **Queue** to see all pending requests assigned to OUR.

**What you'll see for EDOC-2026-000003:**

- Student: Juan
- Document Type: COG
- SLA Due Date: 2026-05-08
- Clearance Task Status: **Pending**

### Step 2.3: Open the Request and Clear It

1. Click on **EDOC-2026-000003** to open the request detail
2. Review the student information and request purpose
3. Click **Clear**
4. Optionally add remarks: `"Certificate of Grades verified. All academic records in order."`
5. Confirm the action

**Result:**

- OUR clearance status: ✅ **Cleared**
- All clearances complete → request status automatically changes to **Ready for Release**
- Student receives a notification

---

## Part 3: Student Retrieves Document

### Step 3.1: Login Back as Student Juan

School ID: `2021-00001`

**Dashboard change:** EDOC-2026-000003 now shows **Ready for Release** instead of Pending.

### Step 3.2: Open and Download

1. Click on **EDOC-2026-000003**
2. Click **Retrieve Document** or **Download**
3. A PDF of the Certificate of Grades is downloaded

**Clearance Summary shown to student:**

```
✅ Office of the University Registrar (OUR) — Cleared by Francis Aquino
Document Ready: YES
Release Mode: Digital
```

---

## Tutorial 1 Summary

```
Student submits COG request (EDOC-2026-000003)
        ↓
OUR Head (Francis Aquino) reviews and clears
        ↓
System: Pending → Ready for Release
        ↓
Student downloads Certificate of Grades (PDF)
```

---

---

# Tutorial 2: Multi-Office Clearance

**Document Type**: Transcript of Records (TOR)
**Request**: `EDOC-2026-000001`
**Student**: Juan — School ID `2021-00001`
**Purpose**: Employment
**Clearance**: LIB, UCF, PSO, OSAS (parallel) → OUR (sequential, final)

---

## Part 1: Student View

### Step 1.1: Login as Student Juan

School ID: `2021-00001`

### Step 1.2: Open EDOC-2026-000001 (TOR Request)

Click on **EDOC-2026-000001**. The request detail card shows:

- Tracking Number: `EDOC-2026-000001`
- Document Type: Transcript of Records (TOR)
- Purpose: Employment
- Copies: 2
- Release Mode: Digital
- Fee Amount: 150.00
- Payment Status: **Paid**
- Current Status: **Pending**

### Step 1.3: Understand Clearance Requirements

TOR requires clearance from multiple offices. The parallel offices may be processed in any order; OUR is the final sequential step that only unlocks after all parallel offices have cleared.

```
Clearance Requirements for TOR (EDOC-2026-000001):

Parallel (any order):
  1. University Library (LIB)           [Status: Pending]
  2. University Cashier / Finance (UCF) [Status: Pending]
  3. Property / Supply Office (PSO)     [Status: Pending]
  4. Guidance / OSAS (OSAS)             [Status: Pending]

Sequential (unlocks after all parallel offices clear):
  5. Office of the University Registrar (OUR)  [Status: Locked]
```

---

## Part 2: Staff View — Parallel Clearances

The four parallel offices can process in any order. Each staff member logs in, finds the request in their queue, and clears it.

### Step 2.1: Login as Library Staff — Clara Mendoza

| Field       | Value                    |
| ----------- | ------------------------ |
| Employee ID | `EMP-2018-003`           |
| Name        | Clara Mendoza            |
| Role        | Office Staff             |
| Office      | University Library (LIB) |

1. Go to **Queue**
2. Find **EDOC-2026-000001**
3. Click **Clear**
4. Add remarks: `"Library records verified. No outstanding fees."`
5. Confirm

**Status after:** ✅ LIB Cleared

---

### Step 2.2: Login as Cashier Staff — Ben Torres

| Field       | Value                              |
| ----------- | ---------------------------------- |
| Employee ID | `EMP-2018-002`                     |
| Name        | Ben Torres                         |
| Role        | Office Staff                       |
| Office      | University Cashier / Finance (UCF) |

1. Go to **Queue**, find **EDOC-2026-000001**
2. Payment Status is already **Paid** — verify the payment record
3. Click **Clear**
4. Add remarks: `"Payment of 150.00 confirmed."`
5. Confirm

**Status after:** ✅ UCF Cleared

---

### Step 2.3: Login as Property Staff — Diego Lim

| Field       | Value                          |
| ----------- | ------------------------------ |
| Employee ID | `EMP-2018-004`                 |
| Name        | Diego Lim                      |
| Role        | Office Staff                   |
| Office      | Property / Supply Office (PSO) |

1. Go to **Queue**, find **EDOC-2026-000001**
2. Review property/supply clearance
3. Click **Clear**
4. Add remarks: `"All borrowed items accounted for."`
5. Confirm

**Status after:** ✅ PSO Cleared

---

### Step 2.4: Login as OSAS Staff

| Field  | Value           |
| ------ | --------------- |
| Office | Guidance / OSAS |

1. Go to **Queue**, find **EDOC-2026-000001**
2. Review student records
3. Click **Clear**
4. Confirm

**Status after:** ✅ OSAS Cleared

---

### Step 2.5: Clearance Progress After All Parallel Offices

```
✅ LIB  (Cleared)
✅ UCF  (Cleared)
✅ PSO  (Cleared)
✅ OSAS (Cleared)
⏳ OUR  (Now unlocked — awaiting final clearance)
```

The system has created the OUR sequential clearance task. The request remains **Pending** until OUR gives final approval.

---

## Part 3: Staff View — Final Sequential Clearance (OUR)

### Step 3.1: Login as OUR Head — Francis Aquino

| Field       | Value                              |
| ----------- | ---------------------------------- |
| Employee ID | `EMP-2015-001`                     |
| Name        | Francis Aquino                     |
| Role        | Office Head                        |
| Office      | Office of the University Registrar |

### Step 3.2: Open EDOC-2026-000001 and Clear It

1. Go to **Queue** — EDOC-2026-000001 now appears since all parallel offices have cleared
2. Review the full clearance trail (all 4 parallel offices already cleared)
3. Click **Clear**
4. Add remarks: `"All offices cleared. TOR approved for release."`
5. Confirm

**Result:**

- OUR clearance status: ✅ **Cleared**
- All 5 clearances complete → request status automatically changes to **Ready for Release**
- Student receives a notification

---

## Part 4: Student Retrieves Document

### Step 4.1: Login Back as Student Juan

School ID: `2021-00001`

**Dashboard change:** EDOC-2026-000001 now shows **Ready for Release**.

### Step 4.2: Open and Download

1. Click on **EDOC-2026-000001**
2. Click **Retrieve Document** or **Download**
3. The TOR downloads as a PDF

**Clearance Timeline shown to student:**

```
✅ University Library (LIB)                  — Cleared by Clara Mendoza
✅ University Cashier / Finance (UCF)         — Cleared by Ben Torres
✅ Property / Supply Office (PSO)             — Cleared by Diego Lim
✅ Guidance / OSAS (OSAS)                     — Cleared
✅ Office of the University Registrar (OUR)   — Cleared by Francis Aquino (Final)

Document Ready: YES
Release Mode: Digital
```

---

## Tutorial 2 Summary

```
Student submits TOR request (EDOC-2026-000001)
        ↓
Parallel clearances (any order):
  LIB  → Clara Mendoza clears
  UCF  → Ben Torres verifies payment + clears
  PSO  → Diego Lim clears
  OSAS → OSAS staff clears
        ↓
All parallel offices cleared → OUR task unlocked
        ↓
OUR Head (Francis Aquino) gives final clearance
        ↓
System: Pending → Ready for Release
        ↓
Student downloads Transcript of Records (PDF)
```

---

---

# Audit Trail Reference

Admins can view the full audit log for any request. Login as `ADM-2024-001` to access audit logs.

**Example — EDOC-2026-000001 (TOR) Audit Log:**

| Action            | Actor                | Details                       |
| ----------------- | -------------------- | ----------------------------- |
| REQUEST_SUBMITTED | Juan (2021-00001)    | TOR request submitted         |
| CLEARANCE_CLEARED | Clara Mendoza (LIB)  | Library records verified      |
| CLEARANCE_CLEARED | Ben Torres (UCF)     | Payment confirmed             |
| CLEARANCE_CLEARED | Diego Lim (PSO)      | Property cleared              |
| CLEARANCE_CLEARED | OSAS staff           | Student records cleared       |
| CLEARANCE_CLEARED | Francis Aquino (OUR) | Final approval — TOR released |

---

# Troubleshooting / Alternative Scenarios

### Office Rejects a Request

If any office clicks **Reject** instead of **Clear**:

- Request status changes to **Action Required**
- Student receives a notification with the rejection reason
- Student addresses the concern and resubmits
- Clearance for that office restarts

### Payment Not Verified (UCF)

If UCF cannot confirm payment:

- UCF rejects or holds the request
- Student receives a notification to complete payment
- Request remains **Pending** until payment is resolved

### Overdue Request

If the SLA due date passes before all offices clear:

- Request is flagged as **Overdue** in dashboards
- Triggers admin review and possible escalation

---

# Quick-Reference: Seed Accounts

| Employee ID    | Name                 | Role         | Office |
| -------------- | -------------------- | ------------ | ------ |
| `2021-00001`   | Juan                 | Student      | —      |
| `2021-00002`   | Maria                | Student      | —      |
| `EMP-2015-001` | Francis Aquino       | Office Head  | OUR    |
| `EMP-2018-002` | Ben Torres           | Office Staff | UCF    |
| `EMP-2018-003` | Clara Mendoza        | Office Staff | LIB    |
| `EMP-2018-004` | Diego Lim            | Office Staff | PSO    |
| `EMP-2018-005` | Elena Cruz           | Office Staff | MIS    |
| `EMP-2015-002` | Grace Villanueva     | Office Head  | HRMO   |
| `ADM-2024-001` | System Administrator | Admin        | —      |

Default password for all accounts: `password123`
