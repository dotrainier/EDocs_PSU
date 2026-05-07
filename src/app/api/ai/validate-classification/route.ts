// src/app/api/ai/validate-classification/route.ts (NEW)

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_types } from '@/db/schema';
import { validateDocumentClassification } from '@/lib/ai';
import { getAccessTokenPayload } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const { documentTypeId, purpose } = await request.json();

    // Get selected type
    const selectedType = await db
      .select()
      .from(document_types)
      .where(eq(document_types.id, documentTypeId))
      .limit(1);

    if (!selectedType[0]) {
      return NextResponse.json({ message: 'Document type not found' }, { status: 404 });
    }

    // Get all types for context
    const allDocTypes = await db
      .select()
      .from(document_types)
      .where(eq(document_types.is_active, true));

    // 🆕 RUN GEMINI
    const aiValidation = await validateDocumentClassification(
      purpose,
      selectedType[0].code,
      allDocTypes.map((d) => ({
        code: d.code,
        name: d.name,
        description: d.description ?? '',
      })),
      session.role,
    );

    const matches = aiValidation.ai_failed
      ? true
      : selectedType[0].code === aiValidation.suggested_code;

    return NextResponse.json(
      {
        selected_type: selectedType[0].code,
        ai_suggestion: aiValidation.suggested_code,
        confidence: aiValidation.confidence,
        reasoning: aiValidation.reasoning,
        matches,
        ai_failed: aiValidation.ai_failed,
        skip_validation: aiValidation.ai_failed,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
