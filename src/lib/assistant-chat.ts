/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  type ChatSession,
  type FunctionDeclaration,
  type FunctionResponsePart,
  type GenerateContentResult,
} from '@google/generative-ai';

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

export interface AssistantTool<Ctx = void> {
  label: string;
  declaration: FunctionDeclaration;
  run: (args: Record<string, unknown>, ctx: Ctx) => Promise<object>;
}

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_TOOL_ROUNDS = 5;

async function runTool<Ctx>(
  logName: string,
  tools: Record<string, AssistantTool<Ctx>>,
  ctx: Ctx,
  name: string,
  args: object,
): Promise<object> {
  const tool = tools[name];
  if (!tool) return { error: `Unknown tool "${name}". No data available.` };
  try {
    return {
      asOf: new Date().toISOString(),
      ...(await tool.run((args ?? {}) as Record<string, unknown>, ctx)),
    };
  } catch (err) {
    console.error(`${logName} tool ${name} failed:`, err);
    return { error: 'The lookup failed. No data is available for this question right now.' };
  }
}

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

export async function runAssistantChat<Ctx>(options: {
  logName: string;
  systemInstruction: string;
  tools: Record<string, AssistantTool<Ctx>>;
  ctx: Ctx;
  history: AssistantTurn[];
  message: string;
}): Promise<AssistantReply> {
  const { logName, systemInstruction, tools, ctx, history, message } = options;

  const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    tools: [{ functionDeclarations: Object.values(tools).map((t) => t.declaration) }],
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
          return {
            functionResponse: {
              name: call.name,
              response: await runTool(logName, tools, ctx, call.name, call.args),
            },
          };
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
    console.error(`Gemini API error (${logName}):`, error);
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
