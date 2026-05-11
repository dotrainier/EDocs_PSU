import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types } from '@/db/schema';

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;

  const rows = await db
    .select({
      fee_amount: document_requests.fee_amount,
      payment_status: document_requests.payment_status,
      document_name: document_types.name,
    })
    .from(document_requests)
    .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
    .where(eq(document_requests.tracking_number, trackingNumber))
    .limit(1);

  const req = rows[0];

  if (!req) redirect('/dashboard');
  if (req.payment_status === 'Paid') redirect(`/requests/${trackingNumber}`);

  const apiKey = process.env.XENDIT_API_KEY!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: `EDOCS-${trackingNumber}-${Date.now()}`,
      amount: parseFloat(req.fee_amount ?? '0'),
      description: `PSU Document Request — ${req.document_name}`,
      success_redirect_url: `${appUrl}/api/portal/payment/xendit-callback?tracking=${trackingNumber}`,
      failure_redirect_url: `${appUrl}/requests/${trackingNumber}`,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    redirect(`/requests/${trackingNumber}`);
  }

  const invoice = await response.json() as { invoice_url: string };
  redirect(invoice.invoice_url);
}
