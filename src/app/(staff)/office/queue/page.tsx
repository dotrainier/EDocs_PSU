'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  ClipboardList,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateOptional, formatSLAStatus } from '@/lib/utils';
import type { ApiSLAStatus, PaymentStatus, SLAStatus } from '@/types/document.type';
import { useFetch } from '@/hooks/useFetch';

interface QueueApiTask {
  request_id: string;
  tracking_number: string;
  document_type: string;
  requestor_name: string;
  created_at: string;
  sla_due_at: string | null;
  sla_status: ApiSLAStatus;
  payment_status: PaymentStatus;
}

interface QueueApiResponse {
  tasks: QueueApiTask[];
  stats: {
    total_pending: number;
    on_track: number;
    at_risk: number;
    breached: number;
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SLA_CONFIG: Record<SLAStatus, { label: string; icon: React.ElementType; classes: string }> = {
  'On Track': {
    label: 'On Track',
    icon: CheckCircle2,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  'At Risk': {
    label: 'At Risk',
    icon: Clock,
    classes:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
  },
  Breached: {
    label: 'Breached',
    icon: AlertTriangle,
    classes:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
  },
};

const PAYMENT_CONFIG: Record<PaymentStatus, { classes: string }> = {
  Paid: { classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  Unpaid: { classes: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
};

function SLABadge({ status }: { status: SLAStatus }) {
  const cfg = SLA_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cfg.classes,
      )}
    >
      <Icon className='h-3 w-3' />
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_CONFIG[status];
  return (
    <Badge variant='secondary' className={cn('rounded-full text-xs font-medium', cfg.classes)}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfficeQueuePage() {
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('All Types');
  const [slaFilter, setSlaFilter] = useState('All');

  const { data, loading, error, refetch } = useFetch<QueueApiResponse>('/office/queue');
  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);

  const documentTypes = useMemo(() => {
    const unique = Array.from(new Set(tasks.map((task) => task.document_type))).sort();
    return ['All Types', ...unique];
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
        t.requestor_name.toLowerCase().includes(search.toLowerCase());
      const matchDoc = docType === 'All Types' || t.document_type === docType;
      const matchSla =
        slaFilter === 'All' || formatSLAStatus(t.sla_status) === (slaFilter as SLAStatus);
      return matchSearch && matchDoc && matchSla;
    });
  }, [tasks, search, docType, slaFilter]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Request Queue
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          {data?.stats?.total_pending ?? 0} pending tasks · act on requests by opening them below.
        </p>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by tracking number or requestor…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
          <div className='flex shrink-0 gap-2'>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className='font-sans w-[200px]'>
                <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
                <SelectValue placeholder='Document type' />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((t) => (
                  <SelectItem key={t} value={t} className='font-sans'>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger className='font-sans w-[160px]'>
                <Clock className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
                <SelectValue placeholder='SLA status' />
              </SelectTrigger>
              <SelectContent>
                {['All', 'On Track', 'At Risk', 'Breached'].map((s) => (
                  <SelectItem key={s} value={s} className='font-sans'>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <ClipboardList className='h-7 w-7 text-muted-foreground' />
              </div>
              <div>
                <p className='font-sans text-sm font-medium text-foreground'>Loading tasks...</p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>Please wait.</p>
              </div>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
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
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <ClipboardList className='h-7 w-7 text-muted-foreground' />
              </div>
              <div>
                <p className='font-sans text-sm font-medium text-foreground'>No pending tasks</p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>
                  {search || docType !== 'All Types' || slaFilter !== 'All'
                    ? 'Try adjusting your filters.'
                    : "You're all caught up! No requests in your queue."}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-transparent'>
                  {[
                    'Tracking No.',
                    'Document Type',
                    'Requestor',
                    'Date Submitted',
                    'SLA Deadline',
                    'Payment',
                    '',
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className={cn(
                        'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        h === 'Tracking No.' && 'pl-6',
                        h === '' && 'pr-6',
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow key={task.request_id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs font-medium text-foreground'>
                        {task.tracking_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>
                        {task.document_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>
                        {task.requestor_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {formatDateOptional(task.created_at, '—')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <span className='font-sans text-xs text-muted-foreground'>
                          {formatDateOptional(task.sla_due_at, '—')}
                        </span>
                        <SLABadge status={formatSLAStatus(task.sla_status)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <PaymentBadge status={task.payment_status} />
                    </TableCell>
                    <TableCell className='pr-6'>
                      <Button asChild size='sm' variant='outline' className='gap-1.5'>
                        <Link href={`/office/requests/${task.tracking_number}`}>
                          View
                          <ArrowRight className='h-3.5 w-3.5' />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
