// src/app/api/office/requests/[id]/document/route.ts
//
// Internal staff document generation for GENERATE-pattern document types
// (COE/COR/COG). Never exposed to students — there is no student-facing
// route or link anywhere to the file this produces.
//
// Fully on-demand: nothing is stored. Every call re-renders the template and
// streams a fresh PDF straight back as the response.
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateDocumentPdf } from '@/lib/document-generation';

// POST — generate the certificate and stream it back as a PDF. Safely
// re-runnable: each call is an independent live render, so nothing is
// created, replaced, or left behind between clicks.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    if (session.role !== 'OfficeStaff' && session.role !== 'OfficeHead') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!session.officeId) {
      return NextResponse.json({ message: 'No office assigned to this account' }, { status: 403 });
    }

    const { id } = await params;

    const requestResult = await db
      .select({
        id: document_requests.id,
        status: document_requests.status,
        document_type_code: document_types.code,
        handling_pattern: document_types.handling_pattern,
        issuing_office_id: document_types.issuing_office_id,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const docRequest = requestResult[0];
    if (!docRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (docRequest.handling_pattern !== 'GENERATE') {
      return NextResponse.json(
        { message: 'This document type is not handled by the generation pipeline' },
        { status: 400 },
      );
    }

    // By this point clearance is already done (advanceRouting only sets
    // 'Ready for Release' once every clearance task is Cleared), so — unlike
    // Accept/Reject/Mark as Paid — a Pending-task check no longer applies.
    // Authorize on "staff belongs to this document type's issuing office"
    // instead.
    if (docRequest.issuing_office_id !== Number(session.officeId)) {
      return NextResponse.json(
        { message: 'Your office does not issue this document type' },
        { status: 403 },
      );
    }

    if (docRequest.status !== 'Ready for Release') {
      return NextResponse.json(
        { message: 'This request is not yet ready for release' },
        { status: 409 },
      );
    }

    const pdfBuffer = await generateDocumentPdf(docRequest.document_type_code);

    await logAudit({
      userId: session.userId,
      action: 'DOCUMENT_GENERATED',
      details: {
        requestId: docRequest.id,
        officeId: session.officeId,
        documentTypeCode: docRequest.document_type_code,
      },
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${docRequest.document_type_code}-${id}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[office/requests/document] generate failed:', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
