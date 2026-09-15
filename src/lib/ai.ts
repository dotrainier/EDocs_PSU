/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeString } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ClassificationResult {
  suggested_code: string;
  confidence: number;
  reasoning: string;
  ai_failed: boolean;
}

export interface PurposeQualityResult {
  is_valid: boolean;
  is_vague: boolean;
  reason: string;
  suggestion: string;
  ai_failed: boolean;
}

// ============================================================================
// Gemini call with real exponential backoff on 429 / 503
// ============================================================================

type ModelName = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

async function generateWithRetry(
  prompt: string,
  modelName: ModelName = 'gemini-2.5-flash-lite',
  attempts = 3,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      const isRetryable = status === 429 || status === 503;
      const isLastAttempt = i === attempts - 1;
      if (!isRetryable || isLastAttempt) throw err;
      const delayMs = Math.min(2000 * 2 ** i, 10000); // 2s, 4s, 8s (cap 10s)
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// In-memory cache (24h TTL). For multi-instance deployments, swap for Redis.
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const classificationCache = new Map<string, CacheEntry<ClassificationResult>>();
const purposeCache = new Map<string, CacheEntry<PurposeQualityResult>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}


// ============================================================================
// 3) Dashboard insights — prioritized recommendations for office staff
// ============================================================================

export interface DashboardInsight {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  body: string;
  action: string | null;
  link: '/office/queue' | '/office/cleared' | null;
}

export interface DashboardInsightsResult {
  insights: DashboardInsight[];
  ai_failed: boolean;
}

export async function generateDashboardInsights(data: {
  role: string;
  stats: { total_pending: number; on_track: number; at_risk: number; breached: number };
  slaWeeklyTrend: Array<{ week: string; onTrack: number; atRisk: number; breached: number }>;
  processingTime: Array<{ docType: string; target: number; actual: number }>;
  tasks: Array<{ tracking_number: string; document_type: string; sla_status: string }>;
  clearancePerformance: Array<{ office: string; cleared: number; pending: number; rejected: number }>;
  myStats: { my_cleared: number; my_rejected: number; my_pending: number };
}): Promise<DashboardInsightsResult> {
  const { role, stats, slaWeeklyTrend, processingTime, tasks, clearancePerformance, myStats } = data;

  const topTasks = tasks.slice(0, 10).map((t) => ({
    tracking: t.tracking_number,
    type: t.document_type,
    sla: t.sla_status,
  }));

  const isHead = role === 'OfficeHead';

  const prompt = isHead
    ? `
You are an AI assistant for a university document processing system. Analyze this office dashboard data and provide 3–5 prioritized, actionable insights for the Office Head to manage their team.

OFFICE DASHBOARD DATA:
Queue: ${stats.total_pending} pending | ${stats.on_track} on-track | ${stats.at_risk} at-risk | ${stats.breached} breached

Weekly SLA trend (last 4 weeks):
${slaWeeklyTrend.map((w) => `  ${w.week}: ${w.onTrack} on-track, ${w.atRisk} at-risk, ${w.breached} breached`).join('\n')}

Processing time vs target (working days):
${processingTime.map((p) => `  ${p.docType}: target=${p.target}d, actual=${p.actual}d`).join('\n')}

Top pending tasks:
${topTasks.map((t) => `  ${t.tracking} (${t.type}) — ${t.sla}`).join('\n')}

Clearance performance by office:
${clearancePerformance.map((c) => `  ${c.office}: ${c.cleared} cleared, ${c.pending} pending, ${c.rejected} rejected`).join('\n')}

Generate 3–5 insights sorted by urgency. Focus on team-level actions the head should take (delegate, escalate, monitor).
Use severity:
- "critical" → immediate action needed (breached SLAs, serious bottlenecks)
- "warning" → needs attention soon (at-risk items, worsening trends)
- "info" → useful observations (positive trends, patterns)
`
    : `
You are an AI assistant for a university document processing system. Analyze this staff member's personal workload data and provide 3–5 prioritized, actionable personal insights. Speak directly to the staff member using "you"/"your".

YOUR PERSONAL STATS:
Tasks you have cleared: ${myStats.my_cleared}
Tasks you have rejected: ${myStats.my_rejected}
Pending tasks in your queue: ${myStats.my_pending} (on-track: ${stats.on_track}, at-risk: ${stats.at_risk}, breached: ${stats.breached})

Your pending tasks (most urgent first):
${topTasks.map((t) => `  ${t.tracking} (${t.type}) — ${t.sla}`).join('\n')}

Weekly SLA trend in your office (last 4 weeks):
${slaWeeklyTrend.map((w) => `  ${w.week}: ${w.onTrack} on-track, ${w.atRisk} at-risk, ${w.breached} breached`).join('\n')}

Generate 3–5 personal insights sorted by urgency. Focus on what this staff member should personally act on today.
Use severity:
- "critical" → you need to act immediately (your tasks breached SLA)
- "warning" → needs your attention soon (at-risk tasks, rising workload)
- "info" → personal performance observations (your clearance count, trends)
`;

  const sharedInstructions = `
Return ONLY valid JSON. No markdown, no explanation.
{
  "insights": [
    {
      "severity": "critical",
      "title": "3 Requests Have Breached SLA",
      "body": "Immediate action required. These requests are past their processing deadline.",
      "action": "Review and process breached items first",
      "link": "/office/queue"
    }
  ]
}

For the "link" field, choose ONLY from these valid routes or null:
- "/office/queue"   → use when the action involves reviewing/processing pending or overdue tasks
- "/office/cleared" → use when the action involves reviewing cleared or completed tasks
- null              → use when no specific page applies

Constraints: title ≤ 60 chars, body ≤ 130 chars, action ≤ 55 chars or null.
`;

  try {
    const text = await generateWithRetry(prompt + sharedInstructions, 'gemini-2.5-flash');
    const parsed = tryParseJson<{ insights: DashboardInsight[] }>(text);
    if (!parsed?.insights || !Array.isArray(parsed.insights)) {
      return { insights: [], ai_failed: true };
    }
    return { insights: parsed.insights.slice(0, 5), ai_failed: false };
  } catch (error) {
    console.error('Gemini API error (dashboard insights):', error);
    return { insights: [], ai_failed: true };
  }
}

// ============================================================================
// Pre-filter: obvious purpose <-> document type matches that don't need AI.
// Expand this map as your document type catalog grows.
// ============================================================================

const OBVIOUS_PURPOSES: Record<string, RegExp> = {
  COE: /\b(scholarship|visa|loan|ojt|internship|enrollment proof|currently enrolled)\b/i,
  TOR: /\b(graduate school|board exam|licensure|employment|transfer credit|masters?|phd)\b/i,
  COG: /\b(grades?|gpa|academic standing|grade(s)? report|class standing)\b/i,
  COR: /\b(registration|registered subjects|enlisted courses|proof of registration|course load)\b/i,
};

// ============================================================================
// 1) Classification — does the stated purpose match the chosen document type?
// ============================================================================

export async function validateDocumentClassification(
  purpose: string,
  selectedCode: string,
  availableTypes: { code: string; name: string; description: string }[],
  userRole: string,
): Promise<ClassificationResult> {
  const cacheKey = `${selectedCode}::${normalizeString(purpose)}`;
  const cached = getCached(classificationCache, cacheKey);
  if (cached) return cached;

  // Fast path: purpose obviously matches the selected document type — skip AI.
  const pattern = OBVIOUS_PURPOSES[selectedCode];
  if (pattern && pattern.test(purpose)) {
    const result: ClassificationResult = {
      suggested_code: selectedCode,
      confidence: 1,
      reasoning: 'Purpose matches selected document type (heuristic match).',
      ai_failed: false,
    };
    setCached(classificationCache, cacheKey, result);
    return result;
  }

  const typesList = availableTypes.map((t) => `- ${t.code}: ${t.name}`).join('\n');

  const prompt = `
User role: ${userRole}
Selected document type: ${selectedCode}
Stated purpose: "${purpose}"

Available types:
${typesList}

If the purpose matches the selected type, respond with the selected code.
If the purpose clearly suggests a DIFFERENT type, respond with that code instead.
Return ONLY the code (e.g., "TOR", "COE", "COG", "COR") and confidence 0.0-1.0.

Examples:
- Purpose "proof of registered subjects this semester" + selected COE → respond COR (confidence 0.9)
- Purpose "employment" + selected COE → respond TOR (confidence 0.85)
- Purpose "grades" + selected COE → respond COG (confidence 0.8)

Respond ONLY in this format (JSON):
{
  "suggested_code": "COR",
  "confidence": 0.92,
  "reasoning": "Student purpose is 'proof of registration'. This requires Certificate of Registration, not the selected Certificate of Enrollment."
}
`;

  try {
    const text = await generateWithRetry(prompt, 'gemini-2.5-flash-lite');
    const parsed = tryParseJson<Omit<ClassificationResult, 'ai_failed'>>(text);

    if (!parsed?.suggested_code) {
      console.warn('No JSON in Gemini response:', text);
      return {
        suggested_code: selectedCode,
        confidence: 0,
        reasoning: 'AI response parsing failed',
        ai_failed: true,
      };
    }

    const result: ClassificationResult = { ...parsed, ai_failed: false };
    setCached(classificationCache, cacheKey, result);
    return result;
  } catch (error) {
    console.error('Gemini API error (classification):', error);
    return {
      suggested_code: selectedCode,
      confidence: 0,
      reasoning: 'Gemini API unavailable',
      ai_failed: true,
    };
  }
}

// ============================================================================
// 2) Purpose quality — is the purpose specific and plausible?
// ============================================================================

const TRIVIALLY_VAGUE = /^(personal use|needed|for me|asdf|test|n\/?a|none|\.+)$/i;
const MIN_PURPOSE_LENGTH = 4;

export async function validatePurposeQuality(
  purpose: string,
  documentTypeName: string,
): Promise<PurposeQualityResult> {
  const trimmed = purpose.trim();

  // Fast-fail obviously vague input — no AI call needed.
  if (trimmed.length < MIN_PURPOSE_LENGTH || TRIVIALLY_VAGUE.test(trimmed)) {
    return {
      is_valid: false,
      is_vague: true,
      reason: 'Purpose is too short or generic.',
      suggestion:
        'Add specifics, e.g., "for CHED scholarship application" or "for OJT requirement at ABC Corp".',
      ai_failed: false,
    };
  }

  const cacheKey = `${documentTypeName}::${normalizeString(purpose)}`;
  const cached = getCached(purposeCache, cacheKey);
  if (cached) return cached;

  const prompt = `
You are validating a document request purpose for a university system.

Document requested: "${documentTypeName}"
Purpose stated: "${purpose}"

Evaluate if the purpose is:
1. Specific enough (not just "personal use", "needed", "for me", single generic words)
2. Plausible for the document type
3. Free from suspicious or clearly false intent

Respond ONLY in this JSON format:
{
  "is_valid": true,
  "is_vague": false,
  "reason": "Purpose is clear and appropriate for this document type.",
  "suggestion": ""
}

If vague, set is_valid to false, is_vague to true, and provide a helpful suggestion on how to improve it.
If suspicious/inappropriate, set is_valid to false, is_vague to false, and explain in reason.
`;

  try {
    const text = await generateWithRetry(prompt, 'gemini-2.5-flash-lite');
    const parsed = tryParseJson<Omit<PurposeQualityResult, 'ai_failed'>>(text);

    if (!parsed) {
      return { is_valid: true, is_vague: false, reason: '', suggestion: '', ai_failed: true };
    }

    const result: PurposeQualityResult = { ...parsed, ai_failed: false };
    setCached(purposeCache, cacheKey, result);
    return result;
  } catch (error) {
    console.error('Gemini API error (purpose):', error);
    return { is_valid: true, is_vague: false, reason: '', suggestion: '', ai_failed: true };
  }
}
