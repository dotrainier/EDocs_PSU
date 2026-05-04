'use client';

import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mock data — replace with real API calls
// ---------------------------------------------------------------------------

const MOCK_STAFF = {
  firstName: 'Maria',
  officeName: 'Registrar Office',
};

const MOCK_STATS = {
  pending: 14,
  clearedToday: 7,
  rejectedToday: 2,
  slaBreached: 3,
};

type ActionTaken = 'Cleared' | 'Rejected';

interface RecentActivity {
  id: string;
  trackingNumber: string;
  documentType: string;
  requestorName: string;
  action: ActionTaken;
  time: string;
}

const MOCK_RECENT: RecentActivity[] = [
  {
    id: '1',
    trackingNumber: 'REQ-2025-00421',
    documentType: 'Transcript of Records',
    requestorName: 'Juan Dela Cruz',
    action: 'Cleared',
    time: '10:34 AM',
  },
  {
    id: '2',
    trackingNumber: 'REQ-2025-00418',
    documentType: 'Certificate of Enrollment',
    requestorName: 'Ana Reyes',
    action: 'Cleared',
    time: '9:51 AM',
  },
  {
    id: '3',
    trackingNumber: 'REQ-2025-00415',
    documentType: 'Diploma',
    requestorName: 'Pedro Bautista',
    action: 'Rejected',
    time: '9:22 AM',
  },
  {
    id: '4',
    trackingNumber: 'REQ-2025-00409',
    documentType: 'Certificate of Graduation',
    requestorName: 'Rosa Santos',
    action: 'Cleared',
    time: 'Yesterday',
  },
  {
    id: '5',
    trackingNumber: 'REQ-2025-00401',
    documentType: 'Transcript of Records',
    requestorName: 'Carlo Mendoza',
    action: 'Cleared',
    time: 'Yesterday',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
  description?: string;
}

function StatCard({ title, value, icon: Icon, iconClass, bgClass, description }: StatCardProps) {
  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='px-5 pb-4 pt-5'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {title}
            </p>
            <p className='font-heading mt-1.5 text-3xl font-bold text-foreground'>{value}</p>
            {description && (
              <p className='font-sans mt-1 text-xs text-muted-foreground'>{description}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              bgClass,
            )}
          >
            <Icon className={cn('h-5 w-5', iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionBadge({ action }: { action: ActionTaken }) {
  return (
    <span
      className={cn(
        'font-sans inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        action === 'Cleared'
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400'
          : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
      )}
    >
      {action === 'Cleared' ? (
        <CheckCircle2 className='h-3 w-3' />
      ) : (
        <XCircle className='h-3 w-3' />
      )}
      {action}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfficeDashboardPage() {
  return (
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Good morning, {MOCK_STAFF.firstName} 👋
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          {MOCK_STAFF.officeName} · Here's your workload summary for today.
        </p>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Pending Tasks'
          value={MOCK_STATS.pending}
          icon={ClipboardList}
          iconClass='text-primary'
          bgClass='bg-primary/10'
          description='In queue, not yet acted on'
        />
        <StatCard
          title='Cleared Today'
          value={MOCK_STATS.clearedToday}
          icon={CheckCircle2}
          iconClass='text-emerald-600'
          bgClass='bg-emerald-100 dark:bg-emerald-950/40'
          description='Requests you cleared today'
        />
        <StatCard
          title='Rejected Today'
          value={MOCK_STATS.rejectedToday}
          icon={XCircle}
          iconClass='text-red-600'
          bgClass='bg-red-100 dark:bg-red-950/40'
          description='Requests you rejected today'
        />
        <StatCard
          title='SLA Breached'
          value={MOCK_STATS.slaBreached}
          icon={AlertTriangle}
          iconClass='text-amber-600'
          bgClass='bg-amber-100 dark:bg-amber-950/40'
          description='Past their deadline'
        />
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='font-sans text-base font-semibold'>Recent Activity</CardTitle>
          <a
            href='/office/cleared'
            className='font-sans flex items-center gap-1 text-xs text-primary hover:underline'
          >
            View all <ChevronRight className='h-3.5 w-3.5' />
          </a>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                <TableHead className='font-sans pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Tracking No.
                </TableHead>
                <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Document Type
                </TableHead>
                <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Requestor
                </TableHead>
                <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Action
                </TableHead>
                <TableHead className='font-sans pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RECENT.map((item) => (
                <TableRow key={item.id} className='border-border'>
                  <TableCell className='pl-6'>
                    <span className='font-mono text-xs font-medium text-foreground'>
                      {item.trackingNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='font-sans text-sm text-foreground'>{item.documentType}</span>
                  </TableCell>
                  <TableCell>
                    <span className='font-sans text-sm text-foreground'>{item.requestorName}</span>
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={item.action} />
                  </TableCell>
                  <TableCell className='pr-6 text-right'>
                    <span className='flex items-center justify-end gap-1 text-xs text-muted-foreground'>
                      <Clock className='h-3 w-3' />
                      {item.time}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
