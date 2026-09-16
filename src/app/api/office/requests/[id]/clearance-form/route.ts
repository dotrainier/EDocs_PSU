// src/app/api/office/requests/[id]/clearance-form/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clearance_tasks, document_requests } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';
import { getClearanceFormDownloadUrl } from '@/lib/cloudinary';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
        clearance_form_public_id: document_requests.clearance_form_public_id,
      })
      .from(document_requests)
      .where(eq(document_requests.tracking_number, id))
      .limit(1);

    const req = requestResult[0];
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (!req.clearance_form_public_id) {
      return NextResponse.json({ message: 'No clearance form on file for this request' }, { status: 404 });
    }

    // This office must actually be involved in this request's clearance —
    // denies any office with no clearance task on this request (e.g.
    // Library/Cashier/Property/Guidance for TOR).
    const taskResult = await db
      .select({ office_id: clearance_tasks.office_id })
      .from(clearance_tasks)
      .where(eq(clearance_tasks.request_id, req.id));

    const isInvolved = taskResult.some((t) => t.office_id === Number(session.officeId));
    if (!isInvolved) {
      return NextResponse.json(
        { message: 'Your office is not involved in this request' },
        { status: 403 },
      );
    }

    // Only now — after authorization — fetch the file from Cloudinary via a
    // short-lived signed URL, and return its bytes. The signed URL and the
    // Cloudinary public_id are never sent to the browser.
    const downloadUrl = getClearanceFormDownloadUrl(req.clearance_form_public_id);
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ message: 'Failed to retrieve clearance form' }, { status: 502 });
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream';

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename="clearance-form"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
