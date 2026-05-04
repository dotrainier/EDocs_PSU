'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  Shield,
  Activity,
  Building2,
  ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending Verification';
type ClearanceStatus = 'Pending' | 'Cleared' | 'Rejected';

interface ClearanceOffice {
  id: string;
  officeName: string;
  status: ClearanceStatus;
  clearedBy?: string;
  clearedAt?: string;
  isCurrentOffice: boolean;
}

interface TimelineEvent {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

const MOCK_REQUEST = {
  trackingNumber: 'REQ-2025-00430',
  documentType: 'Certificate of Enrollment',
  requestorName: 'Ana Reyes',
  requestorId: '2021-00142',
  purpose: 'Employment requirement for SSS application',
  copies: 2,
  releaseMode: 'Pick-up',
  dateSubmitted: 'May 1, 2025 · 9:14 AM',
  slaDeadline: 'May 5, 2025',
  slaStatus: 'At Risk' as const,

  payment: {
    status: 'Pending Verification' as PaymentStatus,
    proofImageUrl: '/mock-payment-proof.jpg',
  },

  clearanceOffices: [
    {
      id: 'o1',
      officeName: 'Cashier Office',
      status: 'Cleared' as ClearanceStatus,
      clearedBy: 'Liza Torres',
      clearedAt: 'May 2, 2025 · 10:30 AM',
      isCurrentOffice: false,
    },
    {
      id: 'o2',
      officeName: 'Registrar Office',
      status: 'Pending' as ClearanceStatus,
      isCurrentOffice: true,
    },
    {
      id: 'o3',
      officeName: 'Academic Affairs',
      status: 'Pending' as ClearanceStatus,
      isCurrentOffice: false,
    },
  ] as ClearanceOffice[],

  timeline: [
    {
      id: 't1',
      actor: 'Ana Reyes',
      action: 'Submitted request',
      timestamp: 'May 1, 2025 · 9:14 AM',
    },
    {
      id: 't2',
      actor: 'System',
      action: 'Request routed to Cashier Office, Registrar Office, Academic Affairs',
      timestamp: 'May 1, 2025 · 9:14 AM',
    },
    {
      id: 't3',
      actor: 'Ana Reyes',
      action: 'Uploaded payment proof',
      timestamp: 'May 1, 2025 · 9:22 AM',
    },
    {
      id: 't4',
      actor: 'Liza Torres (Cashier Office)',
      action: 'Confirmed payment · Cleared',
      timestamp: 'May 2, 2025 · 10:30 AM',
    },
  ] as TimelineEvent[],
};

// Whether this office is the Cashier (shows Confirm Payment button)
const IS_CASHIER = false;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SLA_CONFIG = {
  'On Track': {
    icon: CheckCircle2,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  'At Risk': {
    icon: Clock,
    classes:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
  },
  Breached: {
    icon: AlertTriangle,
    classes:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
  },
};

const CLEARANCE_STATUS_CONFIG: Record<
  ClearanceStatus,
  { icon: React.ElementType; classes: string; label: string }
> = {
  Pending: {
    icon: Clock,
    classes: 'border-border bg-muted text-muted-foreground',
    label: 'Pending',
  },
  Cleared: {
    icon: CheckCircle2,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400',
    label: 'Cleared',
  },
  Rejected: {
    icon: XCircle,
    classes:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
    label: 'Rejected',
  },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3'>
      <dt className='font-sans w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {label}
      </dt>
      <dd className='font-sans text-sm text-foreground'>{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfficeRequestDetailPage() {
  const [remarks, setRemarks] = useState('');
  const [actionTaken, setActionTaken] = useState<'Cleared' | 'Rejected' | null>(null);

  const req = MOCK_REQUEST;
  const slaCfg = SLA_CONFIG[req.slaStatus];
  const SLAIcon = slaCfg.icon;

  function handleClear() {
    // TODO: POST /api/office/clearance/:taskId/clear with { remarks }
    setActionTaken('Cleared');
  }

  function handleReject() {
    if (!remarks.trim()) return; // remarks required for rejection
    // TODO: POST /api/office/clearance/:taskId/reject with { remarks }
    setActionTaken('Rejected');
  }

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Back + header */}
      <div>
        <Link
          href='/office/queue'
          className='font-sans mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Queue
        </Link>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
              {req.documentType}
            </h1>
            <p className='mt-1 font-mono text-sm text-muted-foreground'>{req.trackingNumber}</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
              slaCfg.classes,
            )}
          >
            <SLAIcon className='h-3.5 w-3.5' />
            SLA: {req.slaStatus} · Due {req.slaDeadline}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        {/* Left column — main info */}
        <div className='space-y-6 xl:col-span-2'>
          {/* Request info */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
                <FileText className='h-4 w-4 text-primary' />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className='space-y-3'>
                <InfoRow
                  label='Requestor'
                  value={<span className='font-medium'>{req.requestorName}</span>}
                />
                <InfoRow label='ID Number' value={req.requestorId} />
                <InfoRow label='Purpose' value={req.purpose} />
                <InfoRow label='Copies' value={req.copies} />
                <InfoRow label='Release Mode' value={req.releaseMode} />
                <InfoRow label='Date Submitted' value={req.dateSubmitted} />
              </dl>
            </CardContent>
          </Card>

          {/* Payment section */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
                <CreditCard className='h-4 w-4 text-primary' />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {req.payment.status === 'Unpaid' && (
                <div className='flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400'>
                  <AlertTriangle className='h-4 w-4 shrink-0' />
                  Payment not yet received. This request cannot be processed until payment is
                  confirmed.
                </div>
              )}

              {req.payment.status === 'Pending Verification' && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400'>
                    <Clock className='h-4 w-4 shrink-0' />
                    Payment proof uploaded — awaiting Cashier verification.
                  </div>
                  {IS_CASHIER && (
                    <>
                      <div className='overflow-hidden rounded-lg border border-border'>
                        <div className='flex h-48 items-center justify-center bg-muted'>
                          <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                            <ImageIcon className='h-8 w-8' />
                            <p className='text-xs'>Payment proof image</p>
                          </div>
                        </div>
                      </div>
                      <Button className='gap-2' size='sm'>
                        <CheckCircle2 className='h-4 w-4' />
                        Confirm Payment
                      </Button>
                    </>
                  )}
                </div>
              )}

              {req.payment.status === 'Paid' && (
                <div className='flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400'>
                  <CheckCircle2 className='h-4 w-4 shrink-0' />
                  Payment confirmed
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action section — only for own office task */}
          {!actionTaken ? (
            <Card className='border-primary/20 bg-primary/5'>
              <CardHeader className='pb-3'>
                <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold text-primary'>
                  <Shield className='h-4 w-4' />
                  Your Action · Registrar Office
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-1.5'>
                  <label className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    Remarks{' '}
                    <span className='normal-case font-normal text-muted-foreground/70'>
                      (required if rejecting)
                    </span>
                  </label>
                  <Textarea
                    placeholder='Add any remarks or notes about this request…'
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className='font-sans'
                  />
                </div>
                <div className='flex gap-2'>
                  <Button
                    onClick={handleClear}
                    className='gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
                  >
                    <CheckCircle2 className='h-4 w-4' />
                    Clear
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant='destructive'
                    className='gap-2'
                    disabled={!remarks.trim()}
                  >
                    <XCircle className='h-4 w-4' />
                    Reject
                  </Button>
                </div>
                {!remarks.trim() && (
                  <p className='font-sans text-xs text-muted-foreground'>
                    Remarks are required to reject a request.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card
              className={cn(
                'border',
                actionTaken === 'Cleared'
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
                  : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
              )}
            >
              <CardContent className='flex items-center gap-3 px-5 py-4'>
                {actionTaken === 'Cleared' ? (
                  <CheckCircle2 className='h-5 w-5 text-emerald-600' />
                ) : (
                  <XCircle className='h-5 w-5 text-red-600' />
                )}
                <div>
                  <p
                    className={cn(
                      'font-sans text-sm font-semibold',
                      actionTaken === 'Cleared' ? 'text-emerald-700' : 'text-red-700',
                    )}
                  >
                    Request {actionTaken}
                  </p>
                  {remarks && <p className='mt-0.5 text-xs text-muted-foreground'>{remarks}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className='space-y-6'>
          {/* Clearance progress */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
                <Building2 className='h-4 w-4 text-primary' />
                Clearance Progress
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {req.clearanceOffices.map((office, idx) => {
                const cfg = CLEARANCE_STATUS_CONFIG[office.status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={office.id}
                    className={cn(
                      'rounded-lg border p-3',
                      office.isCurrentOffice
                        ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-card',
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            office.status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : office.status === 'Rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {idx + 1}
                        </div>
                        <span className='font-sans text-sm font-medium text-foreground'>
                          {office.officeName}
                        </span>
                        {office.isCurrentOffice && (
                          <Badge
                            variant='secondary'
                            className='ml-1 rounded-full bg-primary/15 px-2 text-[10px] font-semibold text-primary'
                          >
                            You
                          </Badge>
                        )}
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          cfg.classes,
                        )}
                      >
                        <Icon className='h-3 w-3' />
                        {cfg.label}
                      </span>
                    </div>
                    {office.clearedBy && (
                      <p className='font-sans mt-2 text-[11px] text-muted-foreground'>
                        By {office.clearedBy} · {office.clearedAt}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
                <Activity className='h-4 w-4 text-primary' />
                Request Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className='relative border-l border-border pl-5 space-y-4'>
                {req.timeline.map((event) => (
                  <li key={event.id} className='relative'>
                    <span className='absolute -left-[21px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary' />
                    <p className='font-sans text-sm font-medium text-foreground'>{event.action}</p>
                    <p className='font-sans mt-0.5 text-xs text-muted-foreground'>
                      {event.actor} · {event.timestamp}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
