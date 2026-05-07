'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Download,
  MapPin,
  AlertTriangle,
  Building2,
  FileText,
  Calendar,
  Copy,
  Printer,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useFetch } from '@/hooks/useFetch';
import {
  calculateDaysBetween,
  calculateElapsedDays,
  formatDate,
  formatDateTime,
  type ClearanceStatus,
  normalizeClearanceStatus,
  normalizeRequestStatus,
  type RequestStatus,
} from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClearanceOffice {
  name: string;
  status: ClearanceStatus;
  remark?: string;
  clearedAt?: string;
}

interface TimelineEntry {
  id: string;
  status: RequestStatus;
  timestamp: string;
  office: string;
  remark?: string;
}

interface DocumentRequest {
  id: string;
  trackingNumber: string;
  status: RequestStatus;
  documentType: string;
  issuingOffice: string;
  dateFiled: string;
  copies: number;
  purpose: string;
  releaseMode: 'digital' | 'physical' | 'both';
  slaDays: number;
  elapsedDays: number;
  fee: string | null;
  clearanceOffices: ClearanceOffice[];
  timeline: TimelineEntry[];
  actionRequiredReason?: string;
  actionRequiredInstruction?: string;
  downloadUrl?: string;
  pickupLocation?: string;
  pickupSchedule?: string;
  pickupBringItems?: string[];
  isCancellable: boolean;
}

interface RequestResponse {
  request: {
    tracking_number: string;
    document_type: string;
    handling_pattern: string;
    issuing_office: string;
    purpose: string;
    copies: number;
    release_mode: 'digital' | 'physical' | 'both';
    additional_notes: string | null;
    status: string;
    fee_amount: string | null;
    payment_status: string;
    payment_proof_path: string | null;
    sla_due_at: string | null;
    sla_status: 'OnTrack' | 'AtRisk' | 'Breached';
    created_at: string;
    clearance_tasks: Array<{
      office_name: string;
      status: string;
      sequence_order: number | null;
      remarks: string | null;
      cleared_at: string | null;
      cleared_by: string | null;
    }>;
    documents: Array<unknown>;
  };
}

// ── Loading & error UI ───────────────────────────────────────────────────────

function RequestSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='h-4 w-36 rounded bg-muted animate-pulse' />
      <div className='space-y-2'>
        <div className='h-6 w-64 rounded bg-muted animate-pulse' />
        <div className='h-4 w-40 rounded bg-muted animate-pulse' />
      </div>
      <Card>
        <CardContent className='pt-5 pb-5'>
          <div className='grid gap-6 sm:grid-cols-2'>
            <div className='space-y-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-detail-${i}`}
                  className='h-4 w-full rounded bg-muted animate-pulse'
                />
              ))}
            </div>
            <div className='rounded-lg bg-muted/40 p-4 space-y-3'>
              <div className='h-4 w-28 rounded bg-muted animate-pulse' />
              <div className='h-7 w-32 rounded bg-muted animate-pulse' />
              <div className='h-2 w-full rounded bg-muted animate-pulse' />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-3'>
          <div className='h-4 w-36 rounded bg-muted animate-pulse' />
        </CardHeader>
        <CardContent className='pt-0 space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-clearance-${i}`}
              className='h-4 w-full rounded bg-muted animate-pulse'
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RequestError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4'>
        <AlertCircle className='h-6 w-6 text-destructive' />
      </div>
      <p className='text-sm font-semibold text-foreground'>Failed to load request</p>
      <p className='mt-1 text-xs text-muted-foreground max-w-xs'>{message}</p>
      <Button variant='outline' size='sm' className='mt-5 gap-2' onClick={onRetry}>
        <RefreshCw className='h-3.5 w-3.5' />
        Try again
      </Button>
    </div>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const variants: Record<RequestStatus, string> = {
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    'In Process': 'bg-blue-50 text-blue-700 border-blue-200',
    'Action Required': 'bg-red-50 text-red-700 border-red-200',
    'Ready for Release': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Released: 'bg-purple-50 text-purple-700 border-purple-200',
    Cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[status]}`}
    >
      {status}
    </span>
  );
}

function ClearanceIcon({ status }: { status: ClearanceStatus }) {
  if (status === 'Cleared') return <CheckCircle2 className='h-4 w-4 text-emerald-500' />;
  if (status === 'Rejected') return <XCircle className='h-4 w-4 text-red-500' />;
  return <Clock className='h-4 w-4 text-muted-foreground' />;
}

function TimelineStatusDot({ status }: { status: RequestStatus }) {
  const colors: Record<RequestStatus, string> = {
    Pending: 'bg-slate-400',
    'In Process': 'bg-blue-500',
    'Action Required': 'bg-red-500',
    'Ready for Release': 'bg-emerald-500',
    Released: 'bg-purple-500',
    Cancelled: 'bg-zinc-400',
  };
  return <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-background ${colors[status]}`} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrackRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.id as string) ?? 'EDOC-2026-000123';

  const { data, loading, error, refetch } = useFetch<RequestResponse>(
    `/portal/requests/${requestId}`,
  );

  const request = useMemo<DocumentRequest | null>(() => {
    if (!data?.request) return null;

    const apiRequest = data.request;
    const status = normalizeRequestStatus(apiRequest.status);
    const slaDays = calculateDaysBetween(apiRequest.created_at, apiRequest.sla_due_at);
    const elapsedDays = calculateElapsedDays(apiRequest.created_at);

    return {
      id: apiRequest.tracking_number,
      trackingNumber: apiRequest.tracking_number,
      status,
      documentType: apiRequest.document_type,
      issuingOffice: apiRequest.issuing_office,
      dateFiled: formatDate(apiRequest.created_at),
      copies: apiRequest.copies,
      purpose: apiRequest.purpose,
      releaseMode: apiRequest.release_mode,
      slaDays: slaDays || 1,
      elapsedDays,
      fee: apiRequest.fee_amount,
      clearanceOffices: apiRequest.clearance_tasks.map((task) => ({
        name: task.office_name,
        status: normalizeClearanceStatus(task.status),
        remark: task.remarks ?? undefined,
        clearedAt: task.cleared_at ? formatDate(task.cleared_at) : undefined,
      })),
      timeline: apiRequest.clearance_tasks.map((task, index) => ({
        id: `${apiRequest.tracking_number}-${index}`,
        status,
        timestamp: task.cleared_at
          ? formatDateTime(task.cleared_at)
          : formatDateTime(apiRequest.created_at),
        office: task.office_name,
        remark: task.remarks ?? undefined,
      })),
      actionRequiredReason: undefined,
      actionRequiredInstruction: undefined,
      downloadUrl: apiRequest.payment_proof_path ?? undefined,
      pickupLocation: undefined,
      pickupSchedule: undefined,
      pickupBringItems: undefined,
      isCancellable: status === 'Pending' || status === 'In Process',
    };
  }, [data]);

  const slaPercent = request ? Math.min((request.elapsedDays / request.slaDays) * 100, 100) : 0;
  const slaColor =
    slaPercent < 50 ? 'text-emerald-600' : slaPercent < 85 ? 'text-amber-600' : 'text-red-600';
  const slaBarColor =
    slaPercent < 50
      ? '[&>div]:bg-emerald-500'
      : slaPercent < 85
        ? '[&>div]:bg-amber-500'
        : '[&>div]:bg-red-500';

  const hasClearance = (request?.clearanceOffices.length ?? 0) > 0;
  const isReadyOrReleased =
    request?.status === 'Ready for Release' || request?.status === 'Released';
  const isActionRequired = request?.status === 'Action Required';

  if (loading) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-8 space-y-6'>
        <RequestSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-8 space-y-6'>
        <RequestError message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-8 space-y-6'>
        <RequestError message='Request not found.' onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-3xl px-4 py-8 space-y-6'>
      {/* Breadcrumb */}
      <nav className='flex items-center gap-1.5 text-sm text-muted-foreground'>
        <button
          type='button'
          className='hover:text-foreground transition-colors'
          onClick={() => router.push('/requests')}
        >
          My Requests
        </button>
        <ChevronRight className='h-3.5 w-3.5' />
        <span className='text-foreground font-medium'>{request.trackingNumber}</span>
      </nav>

      {/* Action Required banner — top of page */}
      {isActionRequired && request.actionRequiredReason && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription className='mt-1 space-y-1'>
            <p>{request.actionRequiredReason}</p>
            {request.actionRequiredInstruction && (
              <p className='font-medium'>{request.actionRequiredInstruction}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Page header */}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <h1 className='text-xl font-bold tracking-tight text-foreground font-mono'>
              {request.trackingNumber}
            </h1>
            <StatusBadge status={request.status} />
          </div>
          <p className='text-sm text-muted-foreground mt-1'>{request.documentType}</p>
        </div>
      </div>

      {/* Top summary card */}
      <Card>
        <CardContent className='pt-5 pb-5'>
          <div className='grid gap-6 sm:grid-cols-2'>
            {/* Left: request details */}
            <div className='space-y-3'>
              {[
                { icon: FileText, label: 'Document Type', value: request.documentType },
                { icon: Calendar, label: 'Date Filed', value: request.dateFiled },
                { icon: Building2, label: 'Issuing Office', value: request.issuingOffice },
                { icon: Copy, label: 'Number of Copies', value: String(request.copies) },
                { icon: FileText, label: 'Purpose', value: request.purpose },
                {
                  icon: Printer,
                  label: 'Release Mode',
                  value:
                    request.releaseMode === 'both'
                      ? 'Digital + Physical Pickup'
                      : request.releaseMode === 'digital'
                        ? 'Digital (PDF)'
                        : 'Physical Pickup',
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className='flex items-start gap-2.5'>
                  <Icon className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                  <div>
                    <p className='text-xs text-muted-foreground'>{label}</p>
                    <p className='text-sm font-medium text-foreground'>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: SLA indicator */}
            <div className='flex flex-col justify-center gap-3 rounded-lg bg-muted/40 p-4'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                  SLA Progress
                </p>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </div>
              <div>
                <p className={`text-2xl font-bold ${slaColor}`}>
                  Day {request.elapsedDays}
                  <span className='text-base font-normal text-muted-foreground'>
                    {' '}
                    of {request.slaDays}
                  </span>
                </p>
                <p className='text-xs text-muted-foreground mt-0.5'>working days</p>
              </div>
              <Progress value={slaPercent} className={`h-2 ${slaBarColor}`} />
              <p className='text-xs text-muted-foreground'>
                {request.slaDays - request.elapsedDays > 0
                  ? `${request.slaDays - request.elapsedDays} working day(s) remaining`
                  : 'SLA deadline reached'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clearance progress */}
      {hasClearance && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Clearance Progress</CardTitle>
          </CardHeader>
          <CardContent className='pt-0 space-y-2'>
            {request.clearanceOffices.map((office, i) => (
              <div key={office.name}>
                {i > 0 && <Separator className='my-2' />}
                <div className='flex items-start gap-3'>
                  <ClearanceIcon status={office.status} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-sm font-medium text-foreground'>{office.name}</p>
                      <span
                        className={`text-xs font-medium ${
                          office.status === 'Cleared'
                            ? 'text-emerald-600'
                            : office.status === 'Rejected'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {office.status}
                      </span>
                    </div>
                    {office.clearedAt && (
                      <p className='text-xs text-muted-foreground mt-0.5'>{office.clearedAt}</p>
                    )}
                    {office.status === 'Rejected' && office.remark && (
                      <div className='mt-2 rounded-md bg-red-50 border border-red-100 px-3 py-2'>
                        <p className='text-xs text-red-700'>{office.remark}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document download / pickup */}
      {isReadyOrReleased && (
        <Card className='border-emerald-200 bg-emerald-50/50'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-emerald-800 flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4' />
              Document Ready
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            {request.releaseMode === 'digital' || request.releaseMode === 'both' ? (
              <div className='space-y-3'>
                <p className='text-sm text-emerald-800'>
                  Your document is ready for download. The file is valid and digitally signed by the
                  issuing office.
                </p>
                <Button className='gap-2' asChild>
                  <a href={request.downloadUrl ?? '#'} download>
                    <Download className='h-4 w-4' />
                    Download PDF
                  </a>
                </Button>
              </div>
            ) : (
              <div className='space-y-3'>
                <p className='text-sm text-emerald-800'>
                  Your document is ready for physical pickup. Please bring the following:
                </p>
                {request.pickupBringItems && (
                  <ul className='space-y-1'>
                    {request.pickupBringItems.map((item) => (
                      <li key={item} className='flex items-center gap-2 text-sm text-emerald-800'>
                        <CheckCircle2 className='h-3.5 w-3.5 shrink-0' />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {request.pickupLocation && (
                  <div className='flex items-start gap-2 text-sm text-emerald-800'>
                    <MapPin className='h-4 w-4 mt-0.5 shrink-0' />
                    <div>
                      <p className='font-medium'>{request.pickupLocation}</p>
                      {request.pickupSchedule && (
                        <p className='text-emerald-700'>{request.pickupSchedule}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status timeline */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium'>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <ol className='relative space-y-0'>
            {request.timeline.map((entry, i) => (
              <li key={entry.id} className='flex gap-4 pb-6 last:pb-0'>
                <div className='flex flex-col items-center'>
                  <TimelineStatusDot status={entry.status} />
                  {i < request.timeline.length - 1 && (
                    <div className='w-px flex-1 bg-border mt-1' />
                  )}
                </div>
                <div className='flex-1 min-w-0 pb-0'>
                  <div className='flex items-start justify-between gap-2 flex-wrap'>
                    <StatusBadge status={entry.status} />
                    <span className='text-xs text-muted-foreground whitespace-nowrap'>
                      {entry.timestamp}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>{entry.office}</p>
                  {entry.remark && <p className='text-sm text-foreground mt-1'>{entry.remark}</p>}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Cancel button */}
      {request.isCancellable && (
        <div className='flex justify-end pt-2'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                className='text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive'
              >
                Cancel Request
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel request{' '}
                  <span className='font-mono font-medium'>{request.trackingNumber}</span>? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep request</AlertDialogCancel>
                <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                  Yes, cancel it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
