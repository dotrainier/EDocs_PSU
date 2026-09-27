/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/admin-assistant.ts
//
// Admin-facing chat assistant backed by genuine Gemini function calling
// (@google/generative-ai 0.24.1). Unlike the other AI features in src/lib/ai.ts
// — which format pre-computed data into a single prompt — here the model
// decides which lookups to run.
//
// Round-trip shape for this SDK version:
//   1. getGenerativeModel({ tools: [{ functionDeclarations }], toolConfig })
//   2. chat.sendMessage(text) → response.functionCalls() lists { name, args }
//   3. chat.sendMessage([{ functionResponse: { name, response } }, ...])
//      (the SDK sends these as role "function"; they can't be mixed with text
//      parts in the same message)
//   4. repeat until the response has no function calls, then response.text()
//
// Every tool is strictly read-only and wraps the same functions that power
// the Admin Dashboard and Payments page (src/lib/admin-reports.ts) — nothing
// here queries or writes the database directly.
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
  type ChatSession,
  type FunctionDeclaration,
  type FunctionResponsePart,
  type GenerateContentResult,
} from '@google/generative-ai';
import {
  getRegistrationFunnel,
  getRequestVolume,
  getCompletedToday,
  getParticipatingOffices,
  getCapacitySnapshot,
  getRecentActivity,
  getPaymentReport,
} from '@/lib/admin-reports';

export interface AssistantTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AssistantReply {
  reply: string;
  toolsUsed: string[];
  declined: boolean;
  ai_failed: boolean;
}

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_TOOL_ROUNDS = 5;

// ─── Toolset ──────────────────────────────────────────────────────────────────

const OFFICE_SCOPE_NOTE =
  'On-track/overdue and backlog figures cover only the offices listed in participatingOffices (offices that currently issue at least one active document type). No other office contributes to them.';

const SNAPSHOT_NOTE =
  'Live snapshot as of asOf. No historical time series exists, so trends over time and forecasts cannot be derived from this.';

interface AssistantTool {
  label: string;
  declaration: FunctionDeclaration;
  run: (args: Record<string, unknown>) => Promise<object>;
}

const TOOLS: Record<string, AssistantTool> = {
  get_system_overview: {
    label: 'System overview',
    declaration: {
      name: 'get_system_overview',
      description:
        'Headline system-wide figures shown on the Admin Dashboard: total user accounts, total requests (all-time), requests currently Pending or In Process, requests released today, and how many queued requests are on track vs overdue against their calculated expected date.',
    },
    run: async () => {
      const [{ totalUsers }, volume, releasedToday, participatingOffices] = await Promise.all([
        getRegistrationFunnel(),
        getRequestVolume(),
        getCompletedToday(),
        getParticipatingOffices(),
      ]);
      const { onTrack, overdue } = await getCapacitySnapshot(participatingOffices);
      return {
        totalUsers,
        totalRequestsAllTime: volume.totalRequests,
        pendingOrInProcess: volume.pendingRequests,
        releasedToday,
        queuedOnTrack: onTrack,
        queuedOverdue: overdue,
        participatingOffices: participatingOffices.map((o) => o.name),
        notes: [OFFICE_SCOPE_NOTE, 'releasedToday counts REQUEST_RELEASED events since local midnight.'],
      };
    },
  },

  get_requests_by_status: {
    label: 'Requests by status',
    declaration: {
      name: 'get_requests_by_status',
      description:
        'Count of all document requests (all-time) grouped by status: Pending, In Process, Action Required, Ready for Release, Released, Cancelled.',
    },
    run: async () => {
      const { totalRequests, requestsByStatus } = await getRequestVolume();
      return { totalRequests, requestsByStatus };
    },
  },

  get_requests_by_document_type: {
    label: 'Requests by document type',
    declaration: {
      name: 'get_requests_by_document_type',
      description:
        'Count of all document requests (all-time) grouped by document type (e.g. Transcript of Records, Certificate of Enrollment), sorted by volume.',
    },
    run: async () => {
      const { totalRequests, documentTypeVolume } = await getRequestVolume();
      return {
        totalRequests,
        byDocumentType: documentTypeVolume.map((d) => ({ documentType: d.name, requests: d.value })),
        notes: ['Document types not listed have zero requests.'],
      };
    },
  },

  get_backlog_and_capacity: {
    label: 'Backlog & capacity',
    declaration: {
      name: 'get_backlog_and_capacity',
      description:
        "Current processing backlog per participating office: total capacity-weighted requests queued (Pending + In Process), the office's configured daily capacity, and backlogDays (queued weight divided by daily capacity, rounded up — the system's own current queue calculation, not a forecast). Also on-track vs overdue queued requests.",
    },
    run: async () => {
      const participatingOffices = await getParticipatingOffices();
      const { onTrack, overdue, officeBacklogs } = await getCapacitySnapshot(participatingOffices);
      return {
        participatingOffices: participatingOffices.map((o) => o.name),
        queuedOnTrack: onTrack,
        queuedOverdue: overdue,
        officeBacklogs: officeBacklogs.map((b) => ({
          office: b.officeName,
          queuedWeight: b.totalWeight,
          dailyCapacity: b.dailyCapacity,
          dailyCapacityNote: b.dailyCapacity == null ? 'Not configured — the system falls back to a default of 20/day.' : undefined,
          backlogDays: b.backlogDays,
        })),
        notes: [OFFICE_SCOPE_NOTE],
      };
    },
  },

  get_payment_summary: {
    label: 'Payment summary',
    declaration: {
      name: 'get_payment_summary',
      description:
        'Fees collected (Paid) and outstanding (Unpaid) across all document requests, in Philippine pesos — overall totals and broken down per document type, with request counts. Same figures as the Admin Payments page.',
    },
    run: async () => {
      const { totals, byDocumentType } = await getPaymentReport();
      return {
        currency: 'PHP',
        totals,
        byDocumentType: byDocumentType.map((t) => ({
          documentType: t.name,
          code: t.code,
          paidCount: t.paidCount,
          paidAmount: t.paidAmount,
          unpaidCount: t.unpaidCount,
          unpaidAmount: t.unpaidAmount,
        })),
        notes: [
          SNAPSHOT_NOTE,
          'Amounts use the fee recorded on each request at submission time.',
        ],
      };
    },
  },

  get_registration_funnel: {
    label: 'Registration funnel',
    declaration: {
      name: 'get_registration_funnel',
      description:
        'User account registrations by verification status: pending review, approved, rejected — plus the total number of user accounts.',
    },
    run: async () => getRegistrationFunnel(),
  },

  get_recent_activity: {
    label: 'Recent activity',
    declaration: {
      name: 'get_recent_activity',
      description:
        'The most recent system audit events (request submitted, clearance cleared/rejected, payment confirmed, document generated, marked ready for release, released), newest first, with actor and request tracking number where available.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          limit: {
            type: SchemaType.INTEGER,
            description: 'How many events to return, 1–20. Defaults to 10.',
          },
        },
      },
    },
    run: async (args) => {
      const raw = Number(args.limit ?? 10);
      const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 20) : 10;
      const events = await getRecentActivity(limit);
      return {
        events: events.map((e) => ({ event: e.label, actor: e.actor, request: e.detail, at: e.at })),
      };
    },
  },
};

export function toolLabel(name: string): string {
  return TOOLS[name]?.label ?? name;
}

async function runTool(name: string, args: object): Promise<object> {
  const tool = TOOLS[name];
  if (!tool) return { error: `Unknown tool "${name}". No data available.` };
  try {
    return { asOf: new Date().toISOString(), ...(await tool.run((args ?? {}) as Record<string, unknown>)) };
  } catch (err) {
    console.error(`Admin assistant tool ${name} failed:`, err);
    return { error: 'The lookup failed. No data is available for this question right now.' };
  }
}

// ─── Honesty guard ────────────────────────────────────────────────────────────

// Forecasting is explicitly unsupported: there isn't enough historical data
// (every seeded request shares one created_at day — the same constraint that
// blocks the dashboard and payment trend charts). The system instruction
// tells the model to decline these too, but a confidently wrong prediction is
// worse than a refusal, so obvious forecast questions never reach the model.
const PREDICTION_PATTERNS = [
  /\b(forecast|predict|projection|project(ed)? (volume|demand|requests|revenue|collections?))\w*/i,
  /\bextrapolat\w*/i,
  /\bnext (day|week|month|year|semester|sem|term|quarter|school year|academic year)\b/i,
  /\b(tomorrow|in the future|coming (weeks?|months?|semester|year))\b/i,
  /\bwill (we|there|it|they)\b/i,
  /\b(are|is) (we|it|there) (going to|gonna)\b/i,
];

export const PREDICTION_DECLINE =
  "I can't answer that yet. Forecasting or predicting future numbers isn't supported. There isn't enough historical data in the system to do it honestly, and I won't guess. I can give you the current live figures instead, for example the backlog right now, request counts by status or document type, or payments collected and outstanding.";

export function isPredictionRequest(message: string): boolean {
  return PREDICTION_PATTERNS.some((re) => re.test(message));
}

function systemInstruction(): string {
  return `
You are the e-Docs Admin Assistant for a university document request system (PSU Main Campus). You answer a system Administrator's questions using ONLY the read-only lookup tools provided.

Current server time: ${new Date().toString()}.

Rules. Follow them strictly:
1. Every number you state must come from a tool result in this conversation, or from a figure you already stated earlier in this conversation. Never estimate, round up, or make up a number. If you're unsure whether an earlier figure is still current, call the tool again.
2. If no tool can answer the question, say plainly: "I can't answer that yet." Briefly say why and what you CAN answer instead. Things you cannot answer include: details about individual students, staff members or specific requests; per-staff performance; processing-time averages; historical trends or comparisons over time (no time-series data exists); and anything the tools don't return.
3. Never forecast, predict, project or extrapolate future values (for example "how many requests will we get next month"), even as a rough estimate, with caveats, or if the user insists. Say that forecasting isn't supported yet because there isn't enough historical data. backlogDays is the system's calculation of the CURRENT queue (queued weight ÷ daily capacity). You may report it as that, but don't turn it into a date prediction or extend it.
4. You can't change anything (approve registrations, update requests, confirm payments). If asked to, say you're read-only and point to the relevant admin page.
5. On-track/overdue and backlog figures only cover the offices named as participating in the tool result. Never imply other offices are included.
6. Money is in Philippine pesos. Format it like ₱1,234.00.
7. Be concise and direct. Plain text only: no markdown bold, headings or tables. Short "-" bullet lists are fine. When helpful, say the figures are a live snapshot.
`.trim();
}

// ─── Chat loop ────────────────────────────────────────────────────────────────

async function sendWithRetry(
  chat: ChatSession,
  request: string | FunctionResponsePart[],
  attempts = 3,
): Promise<GenerateContentResult> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await chat.sendMessage(request);
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      const isRetryable = status === 429 || status === 503;
      if (!isRetryable || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, Math.min(2000 * 2 ** i, 10000)));
    }
  }
  throw lastErr;
}

/**
 * Answers one Admin message. `history` is the text-only conversation so far
 * (held by the client for the current page visit). It carries enough context
 * for follow-up questions. Tool results aren't replayed. The model re-runs a
 * lookup when it needs fresh figures, and the lookups are cheap and live.
 */
export async function askAdminAssistant(
  history: AssistantTurn[],
  message: string,
): Promise<AssistantReply> {
  if (isPredictionRequest(message)) {
    return { reply: PREDICTION_DECLINE, toolsUsed: [], declined: true, ai_failed: false };
  }

  const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction(),
    tools: [{ functionDeclarations: Object.values(TOOLS).map((t) => t.declaration) }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    generationConfig: { temperature: 0 },
  });

  const chat = model.startChat({
    history: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
  });

  const toolsUsed: string[] = [];

  try {
    let result = await sendWithRetry(chat, message);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const calls = result.response.functionCalls();
      if (!calls || calls.length === 0) break;

      const responses: FunctionResponsePart[] = await Promise.all(
        calls.map(async (call) => {
          if (!toolsUsed.includes(call.name)) toolsUsed.push(call.name);
          return { functionResponse: { name: call.name, response: await runTool(call.name, call.args) } };
        }),
      );
      result = await sendWithRetry(chat, responses);
    }

    if (result.response.functionCalls()?.length) {
      return {
        reply: "I couldn't finish looking that up. Please try asking a narrower question.",
        toolsUsed,
        declined: false,
        ai_failed: true,
      };
    }

    const reply = result.response.text().trim();
    if (!reply) {
      return {
        reply: "I couldn't produce an answer to that. Please try rephrasing.",
        toolsUsed,
        declined: false,
        ai_failed: true,
      };
    }
    return { reply, toolsUsed, declined: false, ai_failed: false };
  } catch (error: any) {
    console.error('Gemini API error (admin assistant):', error);
    // Each tool-using question costs 2+ Gemini calls, so the free tier's
    // per-minute quota is easy to hit. Say so rather than a vague failure.
    const rateLimited = (error?.status ?? error?.response?.status) === 429;
    return {
      reply: rateLimited
        ? 'The AI service rate limit has been reached. Please wait about a minute and ask again.'
        : 'The assistant is unavailable right now. Please try again in a moment.',
      toolsUsed,
      declined: false,
      ai_failed: true,
    };
  }
}
