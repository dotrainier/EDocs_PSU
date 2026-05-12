# Document Request Workflow Demo Tutorial

This tutorial walks through the complete document request clearance workflow, demonstrating how a student submits a request and how staff members process it through the clearance system.

## Overview

- **Timeline**: May 12, 2026
- **Student**: Juan (School ID: `2021-00001`)
- **Document Type**: Certificate of Good Moral Character (COG)
- **Request Tracking Number**: `EDOC-2026-000003`
- **Initial Status**: Pending
- **Purpose**: Board Examination

---

## Part 1: Student View - Submitting a Request

### Step 1.1: Login as Student Juan

**Credentials:**

- School ID: `2021-00001`
- Full Name: Juan (Student)
- Role: Student

**Action:**

1. Navigate to the signin page
2. Enter school ID `2021-00001`
3. You will be redirected to the student portal dashboard

### Step 1.2: View Pending Requests

Once logged in, you'll see the dashboard with your active requests. Juan has multiple requests in various states:

| Tracking Number      | Document | Purpose        | Status            | Fee       | Due Date       |
| -------------------- | -------- | -------------- | ----------------- | --------- | -------------- |
| EDOC-2026-000001     | TOR      | Employment     | **Pending**       | 150.00    | 2026-05-10     |
| EDOC-2026-000002     | COE      | Scholarship    | Ready for Release | 50.00     | 2026-05-07     |
| **EDOC-2026-000003** | **COG**  | **Board Exam** | **Pending**       | **50.00** | **2026-05-08** |
| EDOC-2026-000004     | CGMC     | Government     | Released          | 50.00     | 2026-05-05     |
| EDOC-2026-000005     | TC       | Transfer       | Action Required   | 100.00    | 2026-05-09     |

### Step 1.3: Click on EDOC-2026-000003 (COG Request)

**What you'll see:**

- Request details card showing:
  - Tracking Number: `EDOC-2026-000003`
  - Document Type: Certificate of Good Moral Character (COG)
  - Purpose: Board Examination
  - Copies: 1
  - Release Mode: Digital
  - Fee Amount: 50.00
  - Payment Status: **Unpaid** (needs payment)
  - Current Status: **Pending**

### Step 1.4: Understand Clearance Requirements

Below the request details, you'll see the **Clearance Status** section listing all offices that must clear this document:

```
Clearance Requirements for COG (EDOC-2026-000003):

1. Office of the Registrar (OUR)         [Status: Pending]
2. University Cashier's Office (UCF)     [Status: Pending]
3. Library (LIB)                         [Status: Pending]
4. Property and Supply Office (PSO)      [Status: Pending]
5. Management Information Systems (MIS)  [Status: Pending]
```

**Current Status**: All 5 offices need to clear before the document can be released.
**Block Reason**: Payment not yet verified + All offices awaiting clearance.

---

## Part 2: Staff View - Office Clearing Process

### Step 2.1: Logout from Student Portal

Click the logout button in the navigation menu.

### Step 2.2: Login as First Staff Member - OUR Head

**Credentials:**

- Employee ID: `EMP-2015-001`
- Name: Francis Aquino
- Role: Office Head (Office of the Registrar)
- Office: OUR

**Action:**

1. Go to signin page
2. Enter employee ID `EMP-2015-001`
3. You will be redirected to the staff dashboard

### Step 2.3: Navigate to Queue/Pending Requests

In the staff dashboard, click on **"Queue"** or **"Pending Requests"** to see all requests waiting for OUR clearance.

**What you'll see:**

- A list of all pending document requests requiring OUR clearance
- EDOC-2026-000003 (COG - Juan's request) will appear in the queue
- Additional metadata showing:
  - Student: Juan
  - Document Type: COG
  - Submitted Date: (timestamp when request was created)
  - Days Pending: (calculated from submission)
  - SLA Due Date: 2026-05-08

### Step 2.4: Open the Request for Review

Click on **EDOC-2026-000003** to open the full request details in the office staff view.

**What you'll see:**

- Complete request information
- Student contact information
- Document requirements
- **Clearance Task Card** specifically for OUR showing:
  - Current Status: **Pending**
  - Assigned To: Francis Aquino (or available staff in OUR)
  - Action Buttons:
    - ✅ **Clear** (Approve the request)
    - ❌ **Reject** (Request action from student)
    - 💬 **Add Remarks** (Optional notes)

### Step 2.5: Clear the Request (OUR)

**Action:**

1. Review the student's information and request purpose
2. Click the **"Clear"** button
3. Optionally add remarks: "Document verified by OUR. All records in order."
4. Confirm the clearance action

**Result:**

- The clearance status for OUR is now: ✅ **Cleared**
- System logs the action in audit trail
- Student receives notification (if notifications enabled)
- Request status remains **Pending** (waiting for other offices)

---

### Step 2.6: Logout and Login as Next Staff Member - Cashier (UCF)

**Credentials:**

- Employee ID: `EMP-2018-002`
- Name: Ben Torres
- Role: Cashier Staff
- Office: University Cashier's Office (UCF)

**Action:**

1. Logout from Francis Aquino's account
2. Go to signin page
3. Enter employee ID `EMP-2018-002`
4. Access the staff dashboard

### Step 2.7: Navigate to Queue and Open EDOC-2026-000003

Once in the UCF staff dashboard:

1. Go to **Queue** section
2. Search or find **EDOC-2026-000003**
3. Click to open the request

**What you'll see:**

- Clearance progress bar now shows:
  ```
  ✅ OUR (Cleared) → ⏳ UCF (Pending) → ⏳ LIB → ⏳ PSO → ⏳ MIS
  ```
- The request now shows **2 of 5** clearances complete
- Timestamp showing when OUR cleared it

### Step 2.8: Process UCF Clearance - Check Payment Status

Since UCF handles payments:

**Payment Verification:**

- Current Payment Status: **Unpaid**
- UCF staff should:
  1. Check if student has submitted payment
  2. Once payment is received: Mark payment as **Paid**
  3. Then proceed with clearance

**For this demo:**

- Assume payment has been verified offline or through payment system
- Update Payment Status to: **Paid**
- Add remarks: "Payment of 50.00 verified and processed."

### Step 2.9: Clear the Request (UCF)

**Action:**

1. Confirm payment status is verified
2. Click **"Clear"** button
3. Add remarks about payment verification
4. Confirm clearance

**Result:**

- UCF clearance status: ✅ **Cleared**
- Request status still: **Pending** (3 offices remain)
- Student notification sent

---

### Step 2.10: Continue with Remaining Offices

Repeat the process for the remaining three offices in sequence:

#### Library (LIB) - Clara Mendoza (EMP-2018-003)

**Action:**

1. Logout from Ben Torres
2. Login as Clara Mendoza (`EMP-2018-003`)
3. Go to Queue, find EDOC-2026-000003
4. Review library requirements (no outstanding library fines assumed)
5. Add remarks: "Library records verified. No outstanding fees."
6. Click **Clear**

**Status After**: ✅ OUR → ✅ UCF → ✅ LIB → ⏳ PSO → ⏳ MIS

#### Property and Supply Office (PSO) - Diego Lim (EMP-2018-004)

**Action:**

1. Logout from Clara Mendoza
2. Login as Diego Lim (`EMP-2018-004`)
3. Navigate to Queue and open EDOC-2026-000003
4. Review property/supply requirements
5. Add remarks: "All property/borrowed items accounted for."
6. Click **Clear**

**Status After**: ✅ OUR → ✅ UCF → ✅ LIB → ✅ PSO → ⏳ MIS

#### Management Information Systems (MIS) - Elena Cruz (EMP-2018-005)

**Action:**

1. Logout from Diego Lim
2. Login as Elena Cruz (`EMP-2018-005`)
3. Go to Queue, find EDOC-2026-000003
4. Review MIS requirements (systems access, pending IT issues, etc.)
5. Add remarks: "All IT systems clear. No outstanding issues."
6. Click **Clear**

**Status After**: ✅ OUR → ✅ UCF → ✅ LIB → ✅ PSO → ✅ MIS

---

## Part 3: System Transitions - Request Ready for Release

### Step 3.1: Request Status Changes Automatically

Once the final office (MIS) clears the request:

**Automatic System Transition:**

```
Before Last Clearance: "Pending" (waiting for MIS)
                      ↓
After Last Clearance:  "Ready for Release"
```

The system automatically updates because:

- ✅ All 5 clearances completed
- ✅ Payment status verified as "Paid"
- ✅ No blocking issues remain

### Step 3.2: Login Back as Student Juan

**Credentials:**

- School ID: `2021-00001`

**What's Changed in Dashboard:**

- EDOC-2026-000003 now shows status: **"Ready for Release"** (instead of "Pending")
- A **"Retrieve Document"** or **"Download"** button is now available
- Release mode shows: **Digital** (will be provided as PDF download)

### Step 3.3: Student Views Request

In the request detail view:

**Clearance Summary:**

```
Clearance Status: ✅ ALL OFFICES CLEARED

Timeline:
✅ Office of the Registrar (OUR)          - Cleared on 2026-05-12 10:15 AM by Francis Aquino
✅ University Cashier's Office (UCF)      - Cleared on 2026-05-12 10:22 AM by Ben Torres
✅ Library (LIB)                          - Cleared on 2026-05-12 10:28 AM by Clara Mendoza
✅ Property and Supply Office (PSO)       - Cleared on 2026-05-12 10:35 AM by Diego Lim
✅ Management Information Systems (MIS)   - Cleared on 2026-05-12 10:42 AM by Elena Cruz

Document Ready: YES ✅
Release Date: 2026-05-12
```

### Step 3.4: Retrieve Document

**Action:**

1. Click **"Retrieve Document"** or **"Download Certificate"** button
2. For digital release mode: Document downloads as PDF
3. For physical mode: It would show pickup location/instructions

**What Student Receives:**

- PDF of Certificate of Good Moral Character
- Generated document includes:
  - Official letterhead
  - Student information
  - Document type and purpose
  - All clearance signatures/approvals
  - Generation date and tracking number

---

## Part 4: Audit Trail & Monitoring

### Step 4.1: Admin View - Audit Logs

If you login as an Administrator (ADM-2024-001), you can view the complete audit trail:

**Request EDOC-2026-000003 Audit Log:**

| Timestamp        | Action            | Actor                | Details                        |
| ---------------- | ----------------- | -------------------- | ------------------------------ |
| 2026-05-12 09:45 | REQUEST_SUBMITTED | Juan (2021-00001)    | Student submitted COG request  |
| 2026-05-12 10:15 | CLEARANCE_CLEARED | Francis Aquino (OUR) | Document verified by OUR       |
| 2026-05-12 10:22 | CLEARANCE_CLEARED | Ben Torres (UCF)     | Payment verified and processed |
| 2026-05-12 10:28 | CLEARANCE_CLEARED | Clara Mendoza (LIB)  | Library records verified       |
| 2026-05-12 10:35 | CLEARANCE_CLEARED | Diego Lim (PSO)      | Property verified              |
| 2026-05-12 10:42 | CLEARANCE_CLEARED | Elena Cruz (MIS)     | Systems verified               |
| 2026-05-12 10:42 | REQUEST_RELEASED  | System               | Document ready for release     |

---

## Summary

**Workflow Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT: Juan (2021-00001)                                      │
│ - Logs in to portal                                             │
│ - Views pending requests                                        │
│ - Finds EDOC-2026-000003 (COG) - Status: Pending               │
│ - Reviews required clearances (5 offices)                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Request awaiting staff action
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAFF CLEARANCE PIPELINE                                        │
├─────────────────────────────────────────────────────────────────┤
│ 1️⃣  OUR Head (Francis Aquino)        → CLEARS request          │
│ 2️⃣  Cashier (Ben Torres)             → Verifies payment + CLEARS │
│ 3️⃣  Library (Clara Mendoza)          → CLEARS request          │
│ 4️⃣  Property (Diego Lim)             → CLEARS request          │
│ 5️⃣  MIS (Elena Cruz)                 → CLEARS request ✅ FINAL  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ All clearances complete
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM TRANSITION                                               │
│ Status: Pending → Ready for Release                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Request ready
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT: Juan (2021-00001)                                      │
│ - Logs back in                                                  │
│ - EDOC-2026-000003 now shows: "Ready for Release"               │
│ - Downloads Certificate of Good Moral Character (PDF)           │
│ - Transaction Complete ✅                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Points to Remember

1. **Sequential Processing**: Each office processes in order (based on requirements)
2. **Parallel vs Sequential**: Some clearances may run in parallel depending on business rules
3. **Payment Integration**: Cashier office verifies and marks payment status
4. **Automatic Transitions**: System automatically updates request status when all clearances complete
5. **Audit Trail**: Every action is logged for compliance and tracking
6. **Notifications**: Students are notified at key milestones (ready for release, rejection, etc.)

---

## Troubleshooting / Alternative Scenarios

### Scenario: Office Rejects Request

If any office clicks **"Reject"** instead of **"Clear"**:

- Request status changes to: **"Action Required"**
- Student receives notification explaining the rejection
- Student can resubmit or address concerns
- Clearance process restarts from that office

### Scenario: Payment Not Verified

If UCF cannot verify payment:

- Reject or hold the request
- Student receives notification to complete payment
- Request remains **"Pending"** until payment resolved

### Scenario: Overdue Request

If SLA due date (2026-05-08) passes before all offices clear:

- Request shows as **"Overdue"** in dashboards
- System flags for admin review
- May trigger escalation workflows

---

## Testing Checklist

- [ ] Login as student 2021-00001 successfully
- [ ] View EDOC-2026-000003 in pending requests
- [ ] See all 5 clearance requirements
- [ ] Logout and login as OUR Head (EMP-2015-001)
- [ ] Find request in queue and clear it
- [ ] Logout and repeat for other 4 staff members
- [ ] Verify request status changes to "Ready for Release" after final clearance
- [ ] Login as student and verify they can now retrieve the document
- [ ] Check admin audit logs for complete action history
