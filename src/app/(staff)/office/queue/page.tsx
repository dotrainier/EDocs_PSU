'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type SLAStatus = 'On Track' | 'At Risk' | 'Breached';
type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending Verification';

interface QueueTask {
  id: string;
  trackingNumber: string;
  documentType: string;
  requestorName: string;
  dateSubmitted: string;
  slaDeadline: string;
  slaStatus: SLAStatus;
  paymentStatus: PaymentStatus;
}

const MOCK_TASKS: QueueTask[] = [
  {
    id: 'req-001',
    trackingNumber: 'REQ-2025-00435',
    documentType: 'Transcript of Records',
    requestorName: 'Juan Dela Cruz',
    dateSubmitted: 'May 2, 2025',
    slaDeadline: 'May 7, 2025',
    slaStatus: 'On Track',
    paymentStatus: 'Paid',
  },
  {
    id: 'req-002',
    trackingNumber: 'REQ-2025-00430',
    documentType: 'Certificate of Enrollment',
    requestorName: 'Ana Reyes',
    dateSubmitted: 'May 1, 2025',
    slaDeadline: 'May 5, 2025',
    slaStatus: 'At Risk',
    paymentStatus: 'Pending Verification',
  },
  {
    id: 'req-003',
    trackingNumber: 'REQ-2025-00421',
    documentType: 'Diploma',
    requestorName: 'Pedro Bautista',
    dateSubmitted: 'Apr 29, 2025',
    slaDeadline: 'May 4, 2025',
    slaStatus: 'Breached',
    paymentStatus: 'Paid',
  },
  {
    id: 'req-004',
    trackingNumber: 'REQ-2025-00418',
    documentType: 'Certificate of Graduation',
    requestorName: 'Rosa Santos',
    dateSubmitted: 'Apr 30, 2025',
    slaDeadline: 'May 6, 2025',
    slaStatus: 'On Track',
    paymentStatus: 'Unpaid',
  },
  {
    id: 'req-005',
    trackingNumber: 'REQ-2025-00409',
    documentType: 'Transcript of Records',
    requestorName: 'Carlo Mendoza',
    dateSubmitted: 'Apr 28, 2025',
    slaDeadline: 'May 3, 2025',
    slaStatus: 'Breached',
    paymentStatus: 'Paid',
  },
];

const DOCUMENT_TYPES = [
  'All Types',
  'Transcript of Records',
  'Certificate of Enrollment',
  'Certificate of Graduation',
  'Diploma',
  'Good Moral Certificate',
];

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
  'Pending Verification': {
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
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

  const filtered = MOCK_TASKS.filter((t) => {
    const matchSearch =
      t.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.requestorName.toLowerCase().includes(search.toLowerCase());
    const matchDoc = docType === 'All Types' || t.documentType === docType;
    const matchSla = slaFilter === 'All' || t.slaStatus === slaFilter;
    return matchSearch && matchDoc && matchSla;
  });

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Request Queue
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          {MOCK_TASKS.length} pending tasks · act on requests by opening them below.
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
                {DOCUMENT_TYPES.map((t) => (
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
          {filtered.length === 0 ? (
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
                  <TableRow key={task.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs font-medium text-foreground'>
                        {task.trackingNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>{task.documentType}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>
                        {task.requestorName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {task.dateSubmitted}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <span className='font-sans text-xs text-muted-foreground'>
                          {task.slaDeadline}
                        </span>
                        <SLABadge status={task.slaStatus} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <PaymentBadge status={task.paymentStatus} />
                    </TableCell>
                    <TableCell className='pr-6'>
                      <Button asChild size='sm' variant='outline' className='gap-1.5'>
                        <Link href={`/office/request/${task.id}`}>
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
