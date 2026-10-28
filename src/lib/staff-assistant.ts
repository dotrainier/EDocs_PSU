import { SchemaType } from '@google/generative-ai';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  clearance_requirements,
  clearance_tasks,
  document_requests,
  document_types,
  offices,
  users,
} from '@/db/schema';
import {
  runAssistantChat,
  type AssistantReply,
  type AssistantTool,
  type AssistantTurn,
} from '@/lib/assistant-chat';
import {
  calculateExpectedDateForRequest,
  calculateExpectedDatesForOffice,
  getOfficeBacklogSummary,
} from '@/lib/expected-date';
import { composeFullName } from '@/lib/user-name';

export interface StaffAssistantContext {
  userId: string;
  role: 'OfficeStaff' | 'OfficeHead';
  officeId: number;
}

const EXPECTED_DATE_NOTE =
  "Expected dates are calculated live from the issuing office's queue and daily capacity (weekends skipped). They are the system's own calculation, not a promise.";

function requestPage(trackingNumber: string): string {
  return `/office/requests/${trackingNumber}`;
}

function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n = Number(raw ?? fallback);
  return Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), min), max) : fallback;
}

async function pendingTasksForOffice(officeId: number) {
  const rows = await db
    .select({
      request_id: document_requests.id,
      tracking_number: document_requests.tracking_number,
      request_status: document_requests.status,
      payment_status: document_requests.payment_status,
      created_at: document_requests.created_at,
      document_type: document_types.name,
      given_name: users.given_name,
      middle_name: users.middle_name,
      last_name: users.last_name,
      name_suffix: users.name_suffix,
      school_id: users.school_id,
    })
    .from(clearance_tasks)
    .innerJoin(document_requests, eq(clearance_tasks.request_id, document_requests.id))
    .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
    .innerJoin(users, eq(document_requests.user_id, users.id))
    .where(and(eq(clearance_tasks.office_id, officeId), eq(clearance_tasks.status, 'Pending')))
    .orderBy(asc(document_requests.created_at));

  const expectedDates = await calculateExpectedDatesForOffice(officeId);
  const now = Date.now();

  return rows.map((r) => {
    const expectedDate = expectedDates.get(r.request_id) ?? null;
    return {
      trackingNumber: r.tracking_number,
      documentType: r.document_type,
      requester: composeFullName(r),
      studentId: r.school_id,
      submittedAt: r.created_at,
      expectedDate,
      overdue: expectedDate !== null && expectedDate.getTime() < now,
      requestStatus: r.request_status,
      paymentStatus: r.payment_status,
      page: requestPage(r.tracking_number),
    };
  });
}

const TOOLS: Record<string, AssistantTool<StaffAssistantContext>> = {
  get_my_office_overview: {
    label: 'Office overview',
    declaration: {
      name: 'get_my_office_overview',
      description:
        "Headline figures for the user's own office: clearance tasks currently waiting on the office, how many are on track vs overdue against their expected date, how many are still unpaid, the office's current backlog, and how many tasks the user personally has cleared and rejected (all-time).",
    },
    run: async (_args, ctx) => {
      const [pending, backlog, myRows] = await Promise.all([
        pendingTasksForOffice(ctx.officeId),
        getOfficeBacklogSummary(ctx.officeId),
        db
          .select({
            cleared: sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Cleared' THEN 1 ELSE 0 END)`,
            rejected: sql<number>`SUM(CASE WHEN ${clearance_tasks.status} = 'Rejected' THEN 1 ELSE 0 END)`,
          })
          .from(clearance_tasks)
          .where(eq(clearance_tasks.cleared_by, ctx.userId)),
      ]);

      const overdue = pending.filter((t) => t.overdue).length;
      return {
        pendingTasks: pending.length,
        onTrack: pending.length - overdue,
        overdue,
        unpaidAmongPending: pending.filter((t) => t.paymentStatus === 'Unpaid').length,
        backlog: {
          queuedWeight: backlog.totalWeight,
          dailyCapacity: backlog.dailyCapacity,
          dailyCapacityNote:
            backlog.dailyCapacity == null
              ? 'Not configured — the system falls back to a default of 20/day.'
              : undefined,
          backlogDays: backlog.backlogDays,
        },
        myActionsAllTime: {
          cleared: Number(myRows[0]?.cleared ?? 0),
          rejected: Number(myRows[0]?.rejected ?? 0),
        },
        notes: [
          EXPECTED_DATE_NOTE,
          'backlog covers only document types this office issues: queued weight (Pending + In Process) divided by daily capacity, rounded up. It describes the current queue, not a forecast.',
        ],
      };
    },
  },

  list_pending_requests: {
    label: 'Pending queue',
    declaration: {
      name: 'list_pending_requests',
      description:
        "Requests whose clearance task is currently waiting on the user's office (the Pending Queue), longest-waiting first, with requester, document type, submission date, expected date, overdue flag and payment status. Can be filtered.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          limit: {
            type: SchemaType.INTEGER,
            description: 'How many requests to return, 1–25. Defaults to 10.',
          },
          overdue_only: {
            type: SchemaType.BOOLEAN,
            description: 'Only requests past their expected date.',
          },
          unpaid_only: {
            type: SchemaType.BOOLEAN,
            description: 'Only requests whose fee is still unpaid.',
          },
          search: {
            type: SchemaType.STRING,
            description: "Part of a tracking number, the requester's name, or their student ID.",
          },
        },
      },
    },
    run: async (args, ctx) => {
      const limit = clampInt(args.limit, 1, 25, 10);
      const search = typeof args.search === 'string' ? args.search.trim().toLowerCase() : '';

      const matching = (await pendingTasksForOffice(ctx.officeId)).filter(
        (t) =>
          (!args.overdue_only || t.overdue) &&
          (!args.unpaid_only || t.paymentStatus === 'Unpaid') &&
          (!search ||
            t.trackingNumber.toLowerCase().includes(search) ||
            t.requester.toLowerCase().includes(search) ||
            (t.studentId ?? '').toLowerCase().includes(search)),
      );

      return {
        totalMatching: matching.length,
        shown: Math.min(limit, matching.length),
        requests: matching.slice(0, limit),
        notes: [EXPECTED_DATE_NOTE],
      };
    },
  },

  lookup_request: {
    label: 'Request lookup',
    declaration: {
      name: 'lookup_request',
      description:
        "Full status of one request by tracking number (e.g. EDOC-2026-0001): request status, document type, purpose, payment, expected date, and every office's clearance task with its status and remarks. Only works for requests the user's office is involved in.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          tracking_number: {
            type: SchemaType.STRING,
            description: 'The tracking number, e.g. EDOC-2026-0001.',
          },
        },
        required: ['tracking_number'],
      },
    },
    run: async (args, ctx) => {
      const tracking = String(args.tracking_number ?? '').trim().toUpperCase();
      if (!tracking) return { error: 'No tracking number was given.' };

      const [req] = await db
        .select({
          id: document_requests.id,
          tracking_number: document_requests.tracking_number,
          status: document_requests.status,
          purpose: document_requests.purpose,
          copies: document_requests.copies,
          school_year: document_requests.school_year,
          semester: document_requests.semester,
          fee_amount: document_requests.fee_amount,
          payment_status: document_requests.payment_status,
          has_clearance_form: sql<boolean>`${document_requests.clearance_form_public_id} IS NOT NULL`,
          created_at: document_requests.created_at,
          updated_at: document_requests.updated_at,
          document_type: document_types.name,
          document_type_code: document_types.code,
          issuing_office: offices.name,
          given_name: users.given_name,
          middle_name: users.middle_name,
          last_name: users.last_name,
          name_suffix: users.name_suffix,
          school_id: users.school_id,
        })
        .from(document_requests)
        .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
        .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
        .innerJoin(users, eq(document_requests.user_id, users.id))
        .where(eq(document_requests.tracking_number, tracking))
        .limit(1);

      if (!req) return { found: false, message: `No request with tracking number ${tracking} exists.` };

      const tasks = await db
        .select({
          office_id: clearance_tasks.office_id,
          office: offices.name,
          status: clearance_tasks.status,
          sequence_order: clearance_tasks.sequence_order,
          remarks: clearance_tasks.remarks,
          acted_at: clearance_tasks.cleared_at,
          given_name: users.given_name,
          middle_name: users.middle_name,
          last_name: users.last_name,
          name_suffix: users.name_suffix,
        })
        .from(clearance_tasks)
        .innerJoin(offices, eq(clearance_tasks.office_id, offices.id))
        .leftJoin(users, eq(clearance_tasks.cleared_by, users.id))
        .where(eq(clearance_tasks.request_id, req.id))
        .orderBy(asc(clearance_tasks.sequence_order));

      const myTask = tasks.find((t) => t.office_id === ctx.officeId);
      if (!myTask) {
        return {
          found: false,
          message: `Your office is not involved in ${tracking}, so its details aren't available to you.`,
        };
      }

      return {
        found: true,
        trackingNumber: req.tracking_number,
        status: req.status,
        documentType: `${req.document_type} (${req.document_type_code})`,
        issuingOffice: req.issuing_office,
        requester: composeFullName(req),
        studentId: req.school_id,
        purpose: req.purpose,
        copies: req.copies,
        period: req.school_year ? `${req.semester ?? ''} ${req.school_year}`.trim() : null,
        feePhp: req.fee_amount,
        paymentStatus: req.payment_status,
        studentUploadedClearanceForm: req.has_clearance_form,
        submittedAt: req.created_at,
        lastUpdatedAt: req.updated_at,
        expectedDate: await calculateExpectedDateForRequest(req.id),
        yourOfficeTaskStatus: myTask.status,
        clearanceTasks: tasks.map((t) => ({
          office: t.office,
          step: t.sequence_order ?? 'parallel',
          status: t.status,
          remarks: t.remarks,
          actedAt: t.acted_at,
          actedBy: composeFullName(t) || null,
        })),
        page: requestPage(req.tracking_number),
        notes: [EXPECTED_DATE_NOTE],
      };
    },
  },

  get_document_types: {
    label: 'Document types',
    declaration: {
      name: 'get_document_types',
      description:
        'Every document type students can currently request: code, fee, minimum preparation days, issuing office, whether the system generates the PDF, who is eligible, and the clearance routing chain (which offices must clear it, in what order).',
    },
    run: async () => {
      const types = await db
        .select({
          id: document_types.id,
          name: document_types.name,
          code: document_types.code,
          description: document_types.description,
          fee_amount: document_types.fee_amount,
          sla_working_days: document_types.sla_working_days,
          handling_pattern: document_types.handling_pattern,
          requires_clearance: document_types.requires_clearance,
          period_type: document_types.period_type,
          eligible_student_types: document_types.eligible_student_types,
          issuing_office: offices.name,
        })
        .from(document_types)
        .innerJoin(offices, eq(document_types.issuing_office_id, offices.id))
        .where(eq(document_types.is_active, true))
        .orderBy(asc(document_types.name));

      const chains = types.length
        ? await db
            .select({
              document_type_id: clearance_requirements.document_type_id,
              office: offices.name,
              sequence_order: clearance_requirements.sequence_order,
            })
            .from(clearance_requirements)
            .innerJoin(offices, eq(clearance_requirements.office_id, offices.id))
            .where(
              inArray(
                clearance_requirements.document_type_id,
                types.map((t) => t.id),
              ),
            )
            .orderBy(asc(clearance_requirements.sequence_order))
        : [];

      return {
        documentTypes: types.map((t) => ({
          name: t.name,
          code: t.code,
          description: t.description,
          feePhp: t.fee_amount ?? '0.00',
          minimumPreparationWorkingDays: t.sla_working_days,
          issuingOffice: t.issuing_office,
          pdfGeneratedBySystem: t.handling_pattern === 'GENERATE',
          eligibility:
            t.eligible_student_types === 'active_only'
              ? 'Currently enrolled students only'
              : 'Enrolled students and alumni',
          extraDetailsRequired:
            t.period_type === 'semester_past_only'
              ? 'School year and semester (past terms only)'
              : null,
          clearanceRouting: t.requires_clearance
            ? chains
                .filter((c) => c.document_type_id === t.id)
                .map((c) => ({ office: c.office, step: c.sequence_order ?? 'parallel' }))
            : 'No clearance routing',
        })),
        notes: [
          'In clearanceRouting, "parallel" offices all clear at the same time; numbered steps run one after another.',
          'Admins change routing chains and fees; staff cannot.',
        ],
      };
    },
  },
};

export function staffToolLabel(name: string): string {
  return TOOLS[name]?.label ?? name;
}

function systemInstruction(roleLabel: string, officeName: string): string {
  return `
You are the e-Docs Staff Assistant for PSU Main Campus's online document request system. You help university office staff with their work: answering questions about their office's queue and specific requests using ONLY the read-only lookup tools provided, and explaining how to do things in e-Docs using the guide below.

You are helping: an ${roleLabel} at ${officeName}.
Current server time: ${new Date().toString()}.

How e-Docs works (use this for how-to questions; never describe features that aren't listed here):
- Students submit requests online. Each gets a tracking number like EDOC-2026-0001 and is routed automatically to the offices that must clear it, following the document type's routing chain (set by Admins). Staff never assign requests by hand.
- Pending Queue (sidebar: Manage Queue > Pending Queue) lists the clearance tasks waiting on your office, with each request's expected date. Open a request to act on it.
- Payment: students pay at the Registrar's Office, outside the system. While a request is Unpaid and your office's task is Pending, the request page shows "Mark as Paid". Clear stays disabled until payment is confirmed.
- Clear marks your office's task Cleared. The request then moves to the next office in its routing chain or, when none remain, becomes Ready for Release.
- Reject requires remarks; the remark is the reason the student sees. The request becomes Action Required, the student fixes the issue and resubmits, and it returns to Pending for the same office to review again.
- For system-generated documents (COE, COR, COG), the issuing office uses the Generate Document panel on the request page once the request is Ready for Release. TOR is not generated by the system.
- Documents are collected in person. Only an Admin can mark a request Released.
- Each request page has a Messages panel for messaging the student about that request.
- Messages (sidebar) is internal chat for office staff and admins: an All Staff channel plus direct messages with any staff member or admin. It isn't realtime; reopen or refresh a conversation to see new messages.
- Action History (sidebar) lists tasks your office has already acted on.
- Expected date: the larger of (queued workload at the issuing office divided by its daily capacity) and the document type's minimum preparation days, counted in working days.

Rules. Follow them strictly:
1. Every number, status, name or date you state must come from a tool result in this conversation, or something you already stated. Never estimate or make up data. If you're unsure it's still current, call the tool again.
2. You only see requests the user's own office is involved in. If a lookup says a request doesn't exist or the office isn't involved, say so; don't guess.
3. You are read-only. You can't clear, reject, mark paid, generate documents, release, or send messages. Say where in e-Docs the user can do it; for a specific request, give its page path from the tool result.
4. Never forecast or predict future numbers (for example next week's request volume). You may report a request's expected date as the system's calculation. backlogDays describes the current queue only; don't turn it into a prediction.
5. If neither a tool nor the guide answers the question, say plainly "I can't answer that yet." and what you can help with instead. This includes other staff members' performance and other offices' queues.
6. Money is in Philippine pesos. Format it like ₱1,234.00.
7. Be concise and direct. Plain text only: no markdown bold, headings or tables. Short "-" bullet lists are fine.
`.trim();
}

export async function askStaffAssistant(
  ctx: StaffAssistantContext,
  history: AssistantTurn[],
  message: string,
): Promise<AssistantReply> {
  const [office] = await db
    .select({ name: offices.name })
    .from(offices)
    .where(eq(offices.id, ctx.officeId))
    .limit(1);

  return runAssistantChat({
    logName: 'Staff assistant',
    systemInstruction: systemInstruction(
      ctx.role === 'OfficeHead' ? 'Office Head' : 'Office Staff member',
      office?.name ?? 'their office',
    ),
    tools: TOOLS,
    ctx,
    history,
    message,
  });
}
