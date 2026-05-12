import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_types } from '@/db/schema';
import { validatePurposeQuality } from '@/lib/ai';
import { getAccessTokenPayload } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const { documentTypeId, purpose } = await request.json();

    if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 2) {
      return NextResponse.json({ message: 'Purpose is required' }, { status: 400 });
    }

    const docTypeResult = await db
      .select({ name: document_types.name })
      .from(document_types)
      .where(eq(document_types.id, documentTypeId))
      .limit(1);

    const documentTypeName = docTypeResult[0]?.name ?? 'document';

    const result = await validatePurposeQuality(purpose.trim(), documentTypeName);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
