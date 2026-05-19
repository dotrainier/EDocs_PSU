'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  FilePlus2,
  Clock,
  CheckCircle2,
  PackageCheck,
  FileStack,
  ArrowUpRight,
  Hourglass,
  Loader2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  CreditCard,
} from 'lucide-react';
import { ApexOptions } from 'apexcharts';
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
import { cn, getGreeting } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardClientProps {
  user: {
    firstName: string;
    role: string;
    idNumber: string;
  };
}

type RequestStatus =
  | 'Pending'
  | 'In Process'
  | 'Ready for Release'
  | 'Released'
  | 'Rejected'
  | 'Action Required';

interface PortalDashboardResponse {
  stats: {
    total: number;
    pending: number;
    inProcess: number;
    readyForRelease: number;
    completed: number;
    actionRequired: number;
    unpaidCount: number;
  };
  requestTrend: Array<{
    month: string;
    requests: number;
    completed: number;
  }>;
  documentTypeBreakdown: Array<{
    name: string;
    value: number;
  }>;
  avgProcessingTime: Array<{
    docType: string;
    avgDays: number;
  }>;
  recentRequests: Array<{
    request_id: string;
    tracking_number: string;
    document_type: string;
    status: RequestStatus;
    created_at: string;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = {
  primary: '#6366F1',
  emerald: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
  violet: '#8B5CF6',
};

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
      'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseOptions(): ApexOptions {
  return {
    chart: {
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { enabled: true, speed: 400 },
    },
    theme: { mode: 'light' },
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 4,
    },
    tooltip: { theme: 'light' },
  };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  description?: string;
}

function StatCard({ title, value, icon: Icon, accent, description }: StatCardProps) {
  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {title}
            </p>
            <p className='font-heading mt-1 text-2xl font-bold text-foreground sm:mt-1.5 sm:text-3xl'>
              {value}
            </p>
            {description && (
              <p className='font-sans mt-0.5 text-xs text-muted-foreground sm:mt-1'>
                {description}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
              accent === 'text-primary' ? 'bg-primary/10' : 'bg-muted',
            )}
          >
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', accent)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chart placeholder ────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className='flex h-[220px] items-center justify-center text-sm text-muted-foreground'>
      {message}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardClient({ user }: DashboardClientProps) {
  const greeting = getGreeting();
  const base = baseOptions();

  const { data, loading, error, refetch } = useFetch<PortalDashboardResponse>('/portal/dashboard');

  const stats = useMemo(
    () =>
      data?.stats ?? {
        total: 0,
        pending: 0,
        inProcess: 0,
        readyForRelease: 0,
        completed: 0,
        actionRequired: 0,
        unpaidCount: 0,
      },
    [data?.stats],
  );

  // ── Area chart ──
  const areaOptions: ApexOptions = useMemo(
    () => ({
      ...base,
      chart: { ...base.chart, type: 'area', id: 'trend' },
      colors: [CHART_COLORS.primary, CHART_COLORS.emerald],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
      },
      xaxis: {
        categories: data?.requestTrend?.map((d) => d.month) ?? [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { fontSize: '11px' } },
      },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
      markers: { size: 3, hover: { size: 5 } },
    }),
    [base, data?.requestTrend],
  );

  const areaSeries = useMemo(
    () => [
      { name: 'Filed', data: data?.requestTrend?.map((d) => d.requests) ?? [] },
      { name: 'Completed', data: data?.requestTrend?.map((d) => d.completed) ?? [] },
    ],
    [data?.requestTrend],
  );

  // ── Donut chart ──
  const donutOptions: ApexOptions = useMemo(
    () => ({
      ...base,
      chart: { ...base.chart, type: 'donut', id: 'status' },
      colors: [CHART_COLORS.amber, CHART_COLORS.blue, CHART_COLORS.emerald, CHART_COLORS.violet],
      labels: ['Pending', 'In Process', 'Ready', 'Completed'],
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                formatter: () => String(stats.total),
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', fontSize: '12px', itemMargin: { horizontal: 8 } },
      stroke: { width: 0 },
    }),
    [base, stats.total],
  );

  const donutSeries = useMemo(
    () => [stats.pending, stats.inProcess, stats.readyForRelease, stats.completed],
    [stats],
  );

  // ── Bar chart: document types ──
  const docTypeOptions: ApexOptions = useMemo(
    () => ({
      ...base,
      chart: { ...base.chart, type: 'bar', id: 'doctype' },
      colors: [
        CHART_COLORS.primary,
        CHART_COLORS.emerald,
        CHART_COLORS.amber,
        CHART_COLORS.blue,
        CHART_COLORS.violet,
      ],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          barHeight: '55%',
          distributed: true,
        },
      },
      xaxis: {
        categories: data?.documentTypeBreakdown?.map((d) => d.name) ?? [],
        labels: { style: { fontSize: '11px' } },
      },
      yaxis: { labels: { style: { fontSize: '11px' }, maxWidth: 130 } },
      dataLabels: { enabled: false },
      legend: { show: false },
    }),
    [base, data?.documentTypeBreakdown],
  );

  const docTypeSeries = useMemo(
    () => [{ name: 'Requests', data: data?.documentTypeBreakdown?.map((d) => d.value) ?? [] }],
    [data?.documentTypeBreakdown],
  );

  // ── Bar chart: avg processing time ──
  const avgTimeOptions: ApexOptions = useMemo(
    () => ({
      ...base,
      chart: { ...base.chart, type: 'bar', id: 'avgtime' },
      colors: [CHART_COLORS.violet],
      plotOptions: {
        bar: { borderRadius: 5, columnWidth: '50%' },
      },
      xaxis: {
        categories: data?.avgProcessingTime?.map((d) => d.docType) ?? [],
        labels: { style: { fontSize: '11px' }, rotate: -30 },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { fontSize: '11px' }, formatter: (v) => `${v}d` },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
    }),
    [base, data?.avgProcessingTime],
  );

  const avgTimeSeries = useMemo(
    () => [{ name: 'Avg Days', data: data?.avgProcessingTime?.map((d) => d.avgDays) ?? [] }],
    [data?.avgProcessingTime],
  );

  // ── Loading / error ──
  if (loading) {
    return (
      <div className='mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'>
        <div className='h-8 w-48 animate-pulse rounded-lg bg-muted' />
        <div className='h-32 animate-pulse rounded-2xl bg-primary' />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className='h-20 animate-pulse rounded-lg bg-muted' />
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'>
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'>
          <p className='font-semibold'>Error loading dashboard</p>
          <p className='text-sm'>{error}</p>
          <button
            onClick={refetch}
            className='mt-2 text-sm font-medium underline hover:no-underline'
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'>
      {/* Hero Banner */}
      <div className='relative overflow-hidden rounded-2xl bg-primary px-6 py-7 shadow-lg shadow-primary/20 sm:px-8 sm:py-10'>
        <div className='pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5' />
        <div className='pointer-events-none absolute -bottom-6 right-12 h-24 w-24 rounded-full bg-white/5' />
        <div className='pointer-events-none absolute bottom-0 right-32 h-12 w-12 rounded-full bg-white/5' />

        <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm font-medium text-primary-foreground/70'>{greeting},</p>
            <h2 className='font-heading mt-0.5 text-2xl font-bold text-primary-foreground sm:text-3xl'>
              {user.firstName}!
            </h2>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <Badge
                variant='secondary'
                className='border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground'
              >
                {user.role}
              </Badge>
              <span className='text-xs text-primary-foreground/60'>ID No. {user.idNumber}</span>
            </div>
          </div>

          <Button
            asChild
            size='lg'
            className='shrink-0 gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md hover:text-primary-foreground'
          >
            <Link href='/requests/new'>
              <FilePlus2 className='h-4 w-4' />
              Request a Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatCard
          title='Total Requests'
          value={stats.total}
          icon={FileStack}
          accent='text-primary'
        />
        <StatCard
          title='Active'
          value={stats.pending + stats.inProcess}
          icon={Clock}
          accent='text-amber-500'
          description={`${stats.pending} pending`}
        />
        <StatCard
          title='Ready'
          value={stats.readyForRelease}
          icon={PackageCheck}
          accent='text-emerald-500'
        />
        <StatCard
          title='Completed'
          value={stats.completed}
          icon={CheckCircle2}
          accent='text-blue-500'
        />
      </div>

      {/* Smart Alert Banners */}
      {(stats.actionRequired > 0 || stats.readyForRelease > 0 || stats.unpaidCount > 0) && (
        <div className='space-y-2.5'>
          {stats.actionRequired > 0 && (
            <div className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
              <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-red-500' />
              <div className='flex-1'>
                <p className='font-semibold'>
                  {stats.actionRequired} request{stats.actionRequired > 1 ? 's' : ''} require{stats.actionRequired === 1 ? 's' : ''} your action
                </p>
                <p className='mt-0.5 text-xs text-red-700'>
                  Additional information or documents may be needed to continue processing.
                </p>
              </div>
              <Link
                href='/requests'
                className='shrink-0 text-xs font-semibold text-red-700 underline-offset-2 hover:underline'
              >
                View →
              </Link>
            </div>
          )}

          {stats.readyForRelease > 0 && (
            <div className='flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'>
              <PackageCheck className='mt-0.5 h-4 w-4 shrink-0 text-emerald-500' />
              <div className='flex-1'>
                <p className='font-semibold'>
                  {stats.readyForRelease} document{stats.readyForRelease > 1 ? 's' : ''} ready for pick-up
                </p>
                <p className='mt-0.5 text-xs text-emerald-700'>
                  Please visit the registrar&apos;s office to claim your document{stats.readyForRelease > 1 ? 's' : ''}.
                </p>
              </div>
              <Link
                href='/requests'
                className='shrink-0 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline'
              >
                View →
              </Link>
            </div>
          )}

          {stats.unpaidCount > 0 && (
            <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
              <CreditCard className='mt-0.5 h-4 w-4 shrink-0 text-amber-500' />
              <div className='flex-1'>
                <p className='font-semibold'>
                  {stats.unpaidCount} request{stats.unpaidCount > 1 ? 's' : ''} pending payment
                </p>
                <p className='mt-0.5 text-xs text-amber-700'>
                  Complete your payment to allow processing of your request{stats.unpaidCount > 1 ? 's' : ''}.
                </p>
              </div>
              <Link
                href='/requests'
                className='shrink-0 text-xs font-semibold text-amber-700 underline-offset-2 hover:underline'
              >
                Pay now →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Request Trend
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>
              Requests filed vs completed over time
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.requestTrend?.length ?? 0) > 0 ? (
              <ReactApexChart type='area' height={220} options={areaOptions} series={areaSeries} />
            ) : (
              <EmptyChart message='No data available' />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <Zap className='h-4 w-4 text-primary' />
              Your Requests Status
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>
              Current breakdown of all {stats.total} requests
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {stats.total > 0 ? (
              <ReactApexChart
                type='donut'
                height={260}
                options={donutOptions}
                series={donutSeries}
              />
            ) : (
              <EmptyChart message='No requests yet' />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>Documents Requested</CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>
              Your document request distribution
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.documentTypeBreakdown?.length ?? 0) > 0 ? (
              <ReactApexChart
                type='bar'
                height={220}
                options={docTypeOptions}
                series={docTypeSeries}
              />
            ) : (
              <EmptyChart message='No data available' />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>
              Avg. Processing Time
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>
              By document type (working days)
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.avgProcessingTime?.length ?? 0) > 0 ? (
              <ReactApexChart
                type='bar'
                height={220}
                options={avgTimeOptions}
                series={avgTimeSeries}
              />
            ) : (
              <EmptyChart message='No completed requests yet' />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-3 pt-5 px-5 sm:pb-4'>
          <CardTitle className='text-base font-semibold text-foreground'>Recent Requests</CardTitle>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='gap-1 text-xs text-primary hover:text-primary'
          >
            <Link href='/requests'>
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
                  Document
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Date Filed
                </TableHead>
                <TableHead className='text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.recentRequests ?? []).map((req) => {
                const statusCfg = STATUS_CONFIG[req.status];
                const Icon = statusCfg.icon;
                const dateStr = new Date(req.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <TableRow key={req.request_id} className='hover:bg-muted/50'>
                    <TableCell className='font-mono text-sm font-medium'>
                      <a
                        href={`/request/${req.request_id}`}
                        className='text-primary hover:underline'
                      >
                        {req.tracking_number}
                      </a>
                    </TableCell>
                    <TableCell className='text-sm'>{req.document_type}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>{dateStr}</TableCell>
                    <TableCell className='text-right'>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                          statusCfg.color,
                        )}
                      >
                        <Icon className='h-3 w-3' />
                        {statusCfg.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className='space-y-3 p-5 md:hidden'>
          {(data?.recentRequests ?? []).map((req) => {
            const statusCfg = STATUS_CONFIG[req.status];
            const Icon = statusCfg.icon;
            const dateStr = new Date(req.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={req.request_id}
                className='flex flex-col gap-2 rounded-lg border border-border p-3'
              >
                <div className='flex items-start justify-between gap-2'>
                  <a
                    href={`/request/${req.request_id}`}
                    className='font-mono text-sm font-medium text-primary hover:underline'
                  >
                    {req.tracking_number}
                  </a>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
                      statusCfg.color,
                    )}
                  >
                    <Icon className='h-2.5 w-2.5' />
                    {statusCfg.label}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>{req.document_type}</p>
                <p className='text-xs text-muted-foreground'>{dateStr}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
