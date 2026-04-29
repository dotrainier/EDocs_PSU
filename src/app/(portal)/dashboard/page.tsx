'use client';

import Link from 'next/link';
import {
  FilePlus2,
  Clock,
  CheckCircle2,
  PackageCheck,
  FileStack,
  Eye,
  ArrowUpRight,
  Hourglass,
  Loader2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const MOCK_USER = {
  firstName: 'Juan',
  role: 'Student',
  idNumber: '2021-00142',
};

type RequestStatus =
  | 'Pending'
  | 'In Process'
  | 'Ready for Release'
  | 'Released'
  | 'Rejected'
  | 'Action Required';

interface RecentRequest {
  trackingNo: string;
  documentType: string;
  dateFiled: string;
  status: RequestStatus;
}

const MOCK_STATS = {
  total: 8,
  pending: 2,
  inProcess: 1,
  readyForRelease: 1,
  completed: 4,
};

const MOCK_RECENT: RecentRequest[] = [
  {
    trackingNo: 'EDOC-2026-000087',
    documentType: 'Transcript of Records',
    dateFiled: 'Apr 24, 2026',
    status: 'In Process',
  },
  {
    trackingNo: 'EDOC-2026-000081',
    documentType: 'Certificate of Enrollment',
    dateFiled: 'Apr 18, 2026',
    status: 'Ready for Release',
  },
  {
    trackingNo: 'EDOC-2026-000074',
    documentType: 'Certificate of Good Moral',
    dateFiled: 'Apr 10, 2026',
    status: 'Released',
  },
  {
    trackingNo: 'EDOC-2026-000069',
    documentType: 'Certificate of Grades',
    dateFiled: 'Mar 28, 2026',
    status: 'Pending',
  },
  {
    trackingNo: 'EDOC-2026-000055',
    documentType: 'Transfer Credential',
    dateFiled: 'Mar 12, 2026',
    status: 'Action Required',
  },
];

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  Pending: {
    label: 'Pending',
    color:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
    icon: Hourglass,
  },
  'In Process': {
    label: 'In Process',
    color:
      'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
    icon: Loader2,
  },
  'Ready for Release': {
    label: 'Ready for Release',
    color:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    icon: PackageCheck,
  },
  Released: {
    label: 'Released',
    color:
      'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/30',
    icon: CheckCircle2,
  },
  Rejected: {
    label: 'Rejected',
    color:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900',
    icon: XCircle,
  },
  'Action Required': {
    label: 'Action Required',
    color:
      'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900',
    icon: AlertCircle,
  },
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        cfg.color,
      )}
    >
      <Icon className='h-3 w-3' />
      {cfg.label}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
  description?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent = 'text-primary',
  description,
}: StatCardProps) {
  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='pt-5 pb-4 px-5'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p
              className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {title}
            </p>
            <p
              className='mt-1.5 text-3xl font-bold text-foreground'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {value}
            </p>
            {description && <p className='mt-1 text-xs text-muted-foreground'>{description}</p>}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              accent === 'text-primary' ? 'bg-primary/10' : 'bg-muted',
            )}
          >
            <Icon className={cn('h-5 w-5', accent)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const greeting = getGreeting();

  return (
    <div className='mx-auto max-w-5xl space-y-6' style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className='relative overflow-hidden rounded-2xl bg-primary px-6 py-7 shadow-lg shadow-primary/20'>
        {/* Decorative circles */}
        <div className='pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5' />
        <div className='pointer-events-none absolute -bottom-6 right-12 h-24 w-24 rounded-full bg-white/5' />
        <div className='pointer-events-none absolute bottom-0 right-32 h-12 w-12 rounded-full bg-white/5' />

        <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm font-medium text-primary-foreground/70'>{greeting},</p>
            <h2
              className='mt-0.5 text-2xl font-bold text-primary-foreground sm:text-3xl'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {MOCK_USER.firstName}!
            </h2>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <Badge
                variant='secondary'
                className='border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground'
              >
                {MOCK_USER.role}
              </Badge>
              <span className='text-xs text-primary-foreground/60'>
                ID No. {MOCK_USER.idNumber}
              </span>
            </div>
          </div>

          <Button
            asChild
            size='lg'
            className='shrink-0 gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md'
          >
            <Link href='/portal/request'>
              <FilePlus2 className='h-4 w-4' />
              Request a Document
            </Link>
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatCard
          title='Total Requests'
          value={MOCK_STATS.total}
          icon={FileStack}
          accent='text-primary'
        />
        <StatCard
          title='Pending / In Process'
          value={MOCK_STATS.pending + MOCK_STATS.inProcess}
          icon={Clock}
          accent='text-amber-500'
          description={`${MOCK_STATS.pending} pending · ${MOCK_STATS.inProcess} in process`}
        />
        <StatCard
          title='Ready for Release'
          value={MOCK_STATS.readyForRelease}
          icon={PackageCheck}
          accent='text-emerald-500'
        />
        <StatCard
          title='Completed'
          value={MOCK_STATS.completed}
          icon={CheckCircle2}
          accent='text-blue-500'
        />
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-3 pt-5 px-5'>
          <CardTitle
            className='text-base font-semibold text-foreground'
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Recent Requests
          </CardTitle>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='gap-1 text-xs text-primary hover:text-primary'
          >
            <Link href='/portal/requests'>
              View All
              <ArrowUpRight className='h-3.5 w-3.5' />
            </Link>
          </Button>
        </CardHeader>

        <Separator />

        <div className='hidden md:block'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Tracking No.
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Document Type
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Date Filed
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Status
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right'>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RECENT.map((req) => (
                <TableRow key={req.trackingNo} className='group'>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {req.trackingNo}
                  </TableCell>
                  <TableCell className='text-sm font-medium text-foreground'>
                    {req.documentType}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>{req.dateFiled}</TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      asChild
                      variant='ghost'
                      size='sm'
                      className='gap-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100'
                    >
                      <Link href={`/portal/requests/${req.trackingNo}`}>
                        <Eye className='h-3.5 w-3.5' />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='divide-y divide-border md:hidden'>
          {MOCK_RECENT.map((req) => (
            <div
              key={req.trackingNo}
              className='flex items-start justify-between gap-3 px-5 py-3.5'
            >
              <div className='min-w-0 flex-1 space-y-1'>
                <p className='text-sm font-medium text-foreground'>{req.documentType}</p>
                <p className='font-mono text-xs text-muted-foreground'>{req.trackingNo}</p>
                <p className='text-xs text-muted-foreground'>{req.dateFiled}</p>
                <StatusBadge status={req.status} />
              </div>
              <Button asChild variant='ghost' size='icon' className='mt-0.5 shrink-0'>
                <Link href={`/portal/requests/${req.trackingNo}`}>
                  <Eye className='h-4 w-4' />
                  <span className='sr-only'>View</span>
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {MOCK_RECENT.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <FileStack className='mb-3 h-10 w-10 text-muted-foreground/40' />
            <p className='text-sm font-medium text-muted-foreground'>No requests yet</p>
            <p className='mt-1 text-xs text-muted-foreground/70'>
              Submit your first document request to get started.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
