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
import { Button } from '@/components/ui/button';
import {
  cn,
  formatDateOptional,
  formatSLAStatus,
  type ApiSLAStatus,
  type SLAStatus,
} from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';

interface QueuePreviewItem {
  id: string;
  trackingNumber: string;
  documentType: string;
  requestorName: string;
  slaStatus: SLAStatus;
  slaDueAt: string | null;
}

interface DashboardResponse {
  stats: {
    total_pending: number;
    on_track: number;
    at_risk: number;
    breached: number;
  };
  tasks: {
    request_id: string;
    tracking_number: string;
    document_type: string;
    requestor_name: string;
    created_at: string;
    sla_due_at: string | null;
    sla_status: ApiSLAStatus;
    payment_status: string;
  }[];
}

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

function SLABadge({ status }: { status: SLAStatus }) {
  const cfg = SLA_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'font-sans inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cfg.classes,
      )}
    >
      <Icon className='h-3 w-3' />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfficeDashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardResponse>('/office/queue');

  const stats = data?.stats ?? {
    total_pending: 0,
    on_track: 0,
    at_risk: 0,
    breached: 0,
  };

  const queuePreview: QueuePreviewItem[] = (data?.tasks ?? []).slice(0, 5).map((item) => ({
    id: item.request_id,
    trackingNumber: item.tracking_number,
    documentType: item.document_type,
    requestorName: item.requestor_name,
    slaStatus: formatSLAStatus(item.sla_status),
    slaDueAt: item.sla_due_at,
  }));

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Office Dashboard
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          Here's your workload summary for today.
        </p>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Pending Tasks'
          value={stats.total_pending}
          icon={ClipboardList}
          iconClass='text-primary'
          bgClass='bg-primary/10'
          description='In queue, not yet acted on'
        />
        <StatCard
          title='On Track'
          value={stats.on_track}
          icon={CheckCircle2}
          iconClass='text-emerald-600'
          bgClass='bg-emerald-100 dark:bg-emerald-950/40'
          description='Within SLA window'
        />
        <StatCard
          title='At Risk'
          value={stats.at_risk}
          icon={XCircle}
          iconClass='text-red-600'
          bgClass='bg-red-100 dark:bg-red-950/40'
          description='Near SLA deadline'
        />
        <StatCard
          title='SLA Breached'
          value={stats.breached}
          icon={AlertTriangle}
          iconClass='text-amber-600'
          bgClass='bg-amber-100 dark:bg-amber-950/40'
          description='Past their deadline'
        />
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='font-sans text-base font-semibold'>Queue Preview</CardTitle>
          <a
            href='/office/queue'
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
                  SLA Status
                </TableHead>
                <TableHead className='font-sans pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  SLA Due
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className='pl-6'>
                    <span className='text-sm text-muted-foreground'>Loading tasks...</span>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className='pl-6'>
                    <div className='flex flex-col gap-2 py-3'>
                      <span className='text-sm text-muted-foreground'>{error}</span>
                      <Button size='sm' variant='outline' className='w-fit' onClick={refetch}>
                        Try again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : queuePreview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='pl-6'>
                    <span className='text-sm text-muted-foreground'>No tasks yet.</span>
                  </TableCell>
                </TableRow>
              ) : (
                queuePreview.map((item) => (
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
                      <span className='font-sans text-sm text-foreground'>
                        {item.requestorName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SLABadge status={item.slaStatus} />
                    </TableCell>
                    <TableCell className='pr-6 text-right'>
                      <span className='flex items-center justify-end gap-1 text-xs text-muted-foreground'>
                        <Clock className='h-3 w-3' />
                        {formatDateOptional(item.slaDueAt, '—')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
