'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
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
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  cn,
  formatDateOptional,
  formatDateTime,
  formatSLAStatus,
  normalizeClearanceStatus,
} from '@/lib/utils';
import { api } from '@/lib/axios';
import { useFetch } from '@/hooks/useFetch';
import { ApiSLAStatus, ClearanceStatus, PaymentStatus, SLAStatus } from '@/types/document.type';

interface ClearanceTask {
  task_id: string;
  office_name: string;
  office_id: number;
  status: ClearanceStatus;
  sequence_order: number;
  remarks: string | null;
  cleared_at: string | null;
  cleared_by: string | null;
}

interface TimelineEvent {
  id: string;
  title: string;
  at: string;
  subtitle?: string | null;
}

interface RequestDetailApiResponse {
  request: {
    tracking_number: string;
    document_type: string;
    handling_pattern: string;
    issuing_office: string;
    purpose: string;
    copies: number;
    release_mode: string;
    additional_notes: string | null;
    status: string;
    fee_amount: number | null;
    payment_status: PaymentStatus;
    payment_proof_path: string | null;
    sla_due_at: string | null;
    sla_status: ApiSLAStatus;
    created_at: string;
    requestor_name: string;
    requestor_school_id: string;
    requestor_email: string;
    clearance_tasks: ClearanceTask[];
    my_task: ClearanceTask | null;
    timeline: TimelineEvent[];
  };
}

const SLA_CONFIG: Record<SLAStatus, { icon: React.ElementType; classes: string }> = {
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

export default function OfficeRequestDetailPage() {
  const [remarks, setRemarks] = useState('');
  const [actionTaken, setActionTaken] = useState<'Cleared' | 'Rejected' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useParams<{ id: string }>();
  const requestId = params?.id ?? '';
  const { data, loading, error, refetch } = useFetch<RequestDetailApiResponse>(
    requestId ? `/office/requests/${requestId}` : '',
  );

  const req = data?.request;
  const slaStatus: SLAStatus = req?.sla_status ? formatSLAStatus(req.sla_status) : 'On Track';
  const slaCfg = SLA_CONFIG[slaStatus];
  const SLAIcon = slaCfg.icon;

  const officeName = req?.my_task?.office_name ?? '';
  const isCashier = officeName.toLowerCase().includes('cashier');
  const myTaskStatus = req?.my_task?.status ?? null;
  const isTaskPending = myTaskStatus === 'Pending';
  const displayStatus = actionTaken ?? (!isTaskPending ? myTaskStatus : null);
  const displayBy = req?.my_task?.cleared_by ?? null;
  const displayAt = req?.my_task?.cleared_at ?? null;

  async function handleClear() {
    if (!req?.my_task?.task_id) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/office/clearance/${req.my_task.task_id}`, {
        action: 'cleared',
        remarks: remarks || null,
      });
      setActionTaken('Cleared');
      setTimeout(() => refetch(), 500);
    } catch (err) {
      console.error('Clear error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!remarks.trim() || !req?.my_task?.task_id) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/office/clearance/${req.my_task.task_id}`, {
        action: 'rejected',
        remarks,
      });
      setActionTaken('Rejected');
      setTimeout(() => refetch(), 500);
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
              <ClipboardList className='h-7 w-7 text-muted-foreground' />
            </div>
            <div>
              <p className='font-sans text-sm font-medium text-foreground'>Loading request...</p>
              <p className='font-sans mt-1 text-xs text-muted-foreground'>Please wait.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
              <AlertTriangle className='h-7 w-7 text-muted-foreground' />
            </div>
            <div>
              <p className='font-sans text-sm font-medium text-foreground'>Failed to load</p>
              <p className='font-sans mt-1 text-xs text-muted-foreground'>{error}</p>
              <Button variant='outline' size='sm' onClick={refetch} className='mt-4 gap-1.5'>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!req) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
              <ClipboardList className='h-7 w-7 text-muted-foreground' />
            </div>
            <div>
              <p className='font-sans text-sm font-medium text-foreground'>Request not found</p>
              <p className='font-sans mt-1 text-xs text-muted-foreground'>Try another request.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
              {req.document_type}
            </h1>
            <p className='mt-1 font-mono text-sm text-muted-foreground'>{req.tracking_number}</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
              slaCfg.classes,
            )}
          >
            <SLAIcon className='h-3.5 w-3.5' />
            SLA: {slaStatus} · Due {formatDateOptional(req.sla_due_at, '—')}
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
                  value={<span className='font-medium'>{req.requestor_name}</span>}
                />
                <InfoRow label='ID Number' value={req.requestor_school_id} />
                <InfoRow label='Purpose' value={req.purpose} />
                <InfoRow label='Copies' value={req.copies} />
                <InfoRow label='Release Mode' value={req.release_mode} />
                <InfoRow label='Date Submitted' value={formatDateTime(req.created_at)} />
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
              {req.payment_status === 'Unpaid' && (
                <div className='flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400'>
                  <AlertTriangle className='h-4 w-4 shrink-0' />
                  Payment not yet received. This request cannot be processed until payment is
                  confirmed.
                </div>
              )}

              {req.payment_status === 'Pending Verification' && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400'>
                    <Clock className='h-4 w-4 shrink-0' />
                    Payment proof uploaded — awaiting Cashier verification.
                  </div>
                  {isCashier && (
                    <>
                      <div className='relative h-48 overflow-hidden rounded-lg border border-border'>
                        {req.payment_proof_path ? (
                          <Image
                            src={req.payment_proof_path}
                            alt='Payment proof'
                            fill
                            className='object-cover'
                            sizes='(min-width: 1280px) 50vw, 100vw'
                          />
                        ) : (
                          <div className='flex h-48 items-center justify-center bg-muted'>
                            <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                              <ImageIcon className='h-8 w-8' />
                              <p className='text-xs'>Payment proof image</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button className='gap-2' size='sm'>
                        <CheckCircle2 className='h-4 w-4' />
                        Confirm Payment
                      </Button>
                    </>
                  )}
                </div>
              )}

              {req.payment_status === 'Paid' && (
                <div className='flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400'>
                  <CheckCircle2 className='h-4 w-4 shrink-0' />
                  Payment confirmed
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action section — only for own office task */}
          {isTaskPending && !actionTaken ? (
            <Card className='border-primary/20 bg-primary/5'>
              <CardHeader className='pb-3'>
                <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold text-primary'>
                  <Shield className='h-4 w-4' />
                  Your Action · {req.my_task?.office_name ?? 'Your Office'}
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
                    disabled={isSubmitting}
                    className='gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
                  >
                    {isSubmitting ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <CheckCircle2 className='h-4 w-4' />
                    )}
                    {isSubmitting ? 'Processing...' : 'Clear'}
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant='destructive'
                    className='gap-2'
                    disabled={!remarks.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <XCircle className='h-4 w-4' />
                    )}
                    {isSubmitting ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
                {!remarks.trim() && (
                  <p className='font-sans text-xs text-muted-foreground'>
                    Remarks are required to reject a request.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : displayStatus ? (
            <Card
              className={cn(
                'border',
                displayStatus === 'Cleared'
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
                  : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
              )}
            >
              <CardContent className='flex items-center gap-3 px-5 py-4'>
                {displayStatus === 'Cleared' ? (
                  <CheckCircle2 className='h-5 w-5 text-emerald-600' />
                ) : (
                  <XCircle className='h-5 w-5 text-red-600' />
                )}
                <div>
                  <p
                    className={cn(
                      'font-sans text-sm font-semibold',
                      displayStatus === 'Cleared' ? 'text-emerald-700' : 'text-red-700',
                    )}
                  >
                    Request {displayStatus}
                  </p>
                  {(remarks || req.my_task?.remarks) && (
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      {remarks || req.my_task?.remarks}
                    </p>
                  )}
                  {(displayBy || displayAt) && (
                    <p className='mt-0.5 text-[11px] text-muted-foreground'>
                      {displayBy ? `By ${displayBy}` : ''}
                      {displayAt ? `${displayBy ? ' - ' : ''}${formatDateTime(displayAt)}` : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
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
              {req.clearance_tasks.map((task, idx) => {
                const status = normalizeClearanceStatus(task.status);
                const cfg = CLEARANCE_STATUS_CONFIG[status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={task.task_id}
                    className={cn(
                      'rounded-lg border p-3',
                      task.task_id === req.my_task?.task_id
                        ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-card',
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : status === 'Rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {idx + 1}
                        </div>
                        <span className='font-sans text-sm font-medium text-foreground'>
                          {task.office_name}
                        </span>
                        {task.task_id === req.my_task?.task_id && (
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
                    {task.cleared_by && (
                      <p className='font-sans mt-2 text-[11px] text-muted-foreground'>
                        By {task.cleared_by}
                        {task.cleared_at ? ` · ${formatDateTime(task.cleared_at)}` : ''}
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
              {req.timeline?.length ? (
                <div className='space-y-4'>
                  {req.timeline.map((event) => (
                    <div key={event.id} className='flex items-start gap-3'>
                      <div className='mt-1 h-2 w-2 rounded-full bg-primary' />
                      <div className='space-y-0.5'>
                        <p className='font-sans text-sm font-medium text-foreground'>
                          {event.title}
                        </p>
                        {event.subtitle && (
                          <p className='font-sans text-xs text-muted-foreground'>
                            {event.subtitle}
                          </p>
                        )}
                        <p className='font-sans text-[11px] text-muted-foreground'>
                          {formatDateTime(event.at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center'>
                  <Activity className='h-5 w-5 text-muted-foreground' />
                  <p className='font-sans text-sm font-medium text-foreground'>No timeline yet</p>
                  <p className='font-sans text-xs text-muted-foreground'>
                    Events will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
