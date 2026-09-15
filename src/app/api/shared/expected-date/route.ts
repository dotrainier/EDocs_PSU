// src/app/api/shared/expected-date/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccessTokenPayload } from '@/lib/auth';
import { calculateExpectedDateForNewRequest } from '@/lib/expected-date';

const querySchema = z.object({
  documentTypeId: z.coerce.number().int().positive(),
});

// Pre-submission preview for Step4Review: what the expected date would be if
// the current user submitted this document type right now.
export async function GET(request: Request) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      documentTypeId: searchParams.get('documentTypeId'),
    });
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const expectedDate = await calculateExpectedDateForNewRequest(parsed.data.documentTypeId);
    if (!expectedDate) {
      return NextResponse.json({ message: 'Document type not found' }, { status: 404 });
    }

    return NextResponse.json({ expected_date: expectedDate }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
