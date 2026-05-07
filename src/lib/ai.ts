import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ClassificationResult {
  suggested_code: string;
  confidence: number;
  reasoning: string;
  ai_failed: boolean;
}

export async function validateDocumentClassification(
  purpose: string,
  selectedCode: string,
  availableTypes: { code: string; name: string; description: string }[],
  userRole: string,
): Promise<ClassificationResult> {
  const typesList = availableTypes.map((t) => `- ${t.code}: ${t.name}`).join('\n');

  const prompt = `
User role: ${userRole}
Selected document type: ${selectedCode}
Stated purpose: "${purpose}"

Available types:
${typesList}

If the purpose matches the selected type, respond with the selected code.
If the purpose clearly suggests a DIFFERENT type, respond with that code instead.
Return ONLY the 3-letter code (e.g., "TOR", "COE", "TC") and confidence 0.0-1.0.

Examples:
- Purpose "transferring to another school" + selected COE → respond TC (confidence 0.9)
- Purpose "employment" + selected COE → respond CE (confidence 0.85)
- Purpose "grades" + selected COE → respond COG (confidence 0.8)

Respond ONLY in this format (JSON):
{
  "suggested_code": "TC",
  "confidence": 0.92,
  "reasoning": "Student purpose is 'transferring'. This requires Transfer Credential, not the selected Certificate of Enrollment."
}
`;

  try {
    // 🆕 Use official SDK
    const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn('No JSON in Gemini response:', text);
      return {
        suggested_code: selectedCode,
        confidence: 0,
        reasoning: 'AI response parsing failed',
        ai_failed: true,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult;
    parsed.ai_failed = false;
    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      suggested_code: selectedCode,
      confidence: 0,
      reasoning: 'Gemini API unavailable',
      ai_failed: true,
    };
  }
}
