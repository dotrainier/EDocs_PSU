'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateTime } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import MarkAsReleasedPanel from '@/components/shared/MarkAsReleasedPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestDetailResponse {
  request: {
    tracking_number: string;
    document_type: string;
    purpose: string;
    copies: number;
    status: string;
    fee_amount: string | null;
    payment_status: string;
    created_at: string;
    updated_at: string;
    requestor_name: string;
    requestor_email: string;
    requestor_school_id: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  'In Process': 'bg-blue-100 text-blue-700',
  'Action Required': 'bg-red-100 text-red-700',
  'Ready for Release': 'bg-violet-100 text-violet-700',
  Released: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-muted text-muted-foreground',
};

const PAYMENT_COLORS: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Unpaid: 'bg-red-100 text-red-700',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-4 py-2 text-sm'>
      <span className='font-sans text-muted-foreground'>{label}</span>
      <span className='font-sans font-medium text-foreground'>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const trackingNumber = decodeURIComponent(params.id);

  const { data, loading, error, refetch } = useFetch<RequestDetailResponse>(
    `/admin/requests/${trackingNumber}`,
  );

  if (loading) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='h-8 w-56 animate-pulse rounded-lg bg-muted' />
        <div className='h-64 animate-pulse rounded-lg bg-muted' />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
              <ClipboardList className='h-7 w-7 text-muted-foreground' />
            </div>
            <div>
              <p className='font-sans text-sm font-medium text-foreground'>
                {error || 'Request not found'}
              </p>
              <button
                onClick={refetch}
                className='font-sans mt-2 text-xs font-medium text-primary underline hover:no-underline'
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const req = data.request;

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <Link
          href='/admin/requests'
          className='font-sans mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to All Requests
        </Link>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
              {req.document_type}
            </h1>
            <p className='mt-1 font-mono text-sm text-muted-foreground'>{req.tracking_number}</p>
          </div>
          <Badge
            variant='secondary'
            className={cn('rounded-full text-xs', STATUS_COLORS[req.status] ?? '')}
          >
            {req.status}
          </Badge>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <div className='space-y-6 xl:col-span-2'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
                <FileText className='h-4 w-4 text-primary' />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent className='divide-y divide-border'>
              <DetailRow label='Requester' value={req.requestor_name} />
              <DetailRow label='Email' value={req.requestor_email} />
              <DetailRow label='School ID' value={req.requestor_school_id ?? '—'} />
              <DetailRow label='Document Type' value={req.document_type} />
              <DetailRow label='Purpose' value={req.purpose} />
              <DetailRow label='Copies' value={req.copies} />
              <DetailRow
                label='Payment'
                value={
                  <Badge
                    variant='secondary'
                    className={cn('rounded-full text-xs', PAYMENT_COLORS[req.payment_status] ?? '')}
                  >
                    {req.payment_status}
                    {req.fee_amount ? ` · ₱${req.fee_amount}` : ''}
                  </Badge>
                }
              />
              <DetailRow label='Submitted' value={formatDateTime(req.created_at)} />
              <DetailRow label='Last Updated' value={formatDateTime(req.updated_at)} />
            </CardContent>
          </Card>

          {req.status === 'Ready for Release' && (
            <MarkAsReleasedPanel trackingNumber={req.tracking_number} onReleased={refetch} />
          )}
        </div>
      </div>
    </div>
  );
}
