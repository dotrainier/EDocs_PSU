'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  BarChart3,
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
import { cn } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import { AiInsights } from './_components/AiInsights';

// Local placeholder mirroring the fixed-deadline SLA statuses the dashboard
// route still emits (all "On Track" for now — see the NOTE in
// src/app/api/office/dashboard/route.ts). Dashboard SLA visuals are a
// separate follow-up task, not part of the expected-date rollout.
type SLAStatus = 'On Track' | 'At Risk' | 'Breached';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueuePreviewItem {
  request_id: string;
  tracking_number: string;
  document_type: string;
  requestor_name: string;
  sla_status: SLAStatus;
}

interface DashboardResponse {
  role: string;
  stats: { total_pending: number; on_track: number; at_risk: number; breached: number };
  slaWeeklyTrend: Array<{ week: string; onTrack: number; atRisk: number; breached: number }>;
  documentTypeDistribution: Array<{ name: string; value: number }>;
  processingTime: Array<{ docType: string; target: number; actual: number }>;
  clearancePerformance: Array<{ office: string; cleared: number; pending: number; rejected: number }>;
  tasks: Array<{
    request_id: string;
    tracking_number: string;
    document_type: string;
    requestor_name: string;
    sla_status: string;
    payment_status: string;
  }>;
  myStats: { my_cleared: number; my_rejected: number; my_pending: number };
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  indigo: '#6366F1',
  blue: '#3B82F6',
  violet: '#8B5CF6',
};

const base: ApexOptions = {
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    fontFamily: 'inherit',
    animations: { enabled: true, speed: 400 },
  },
  theme: { mode: 'light' },
  grid: { borderColor: '#F3F4F6', strokeDashArray: 4 },
  tooltip: { theme: 'light' },
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, iconClass, bgClass, description }: {
  title: string; value: number; icon: React.ElementType;
  iconClass: string; bgClass: string; description?: string;
}) {
  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='px-5 pb-4 pt-5'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>{title}</p>
            <p className='font-heading mt-1.5 text-3xl font-bold text-foreground'>{value}</p>
            {description && <p className='font-sans mt-1 text-xs text-muted-foreground'>{description}</p>}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bgClass)}>
            <Icon className={cn('h-5 w-5', iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SLA_CONFIG: Record<SLAStatus, { label: string; icon: React.ElementType; classes: string }> = {
  'On Track': { label: 'On Track', icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400' },
  'At Risk': { label: 'At Risk', icon: Clock, classes: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400' },
  Breached: { label: 'Breached', icon: AlertTriangle, classes: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400' },
};

function SLABadge({ status }: { status: SLAStatus }) {
  const cfg = SLA_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('font-sans inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', cfg.classes)}>
      <Icon className='h-3 w-3' />{cfg.label}
    </span>
  );
}

function EmptyChart({ message = 'No data available' }: { message?: string }) {
  return (
    <div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfficeDashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardResponse>('/office/dashboard');

  const stats = useMemo(
    () => data?.stats ?? { total_pending: 0, on_track: 0, at_risk: 0, breached: 0 },
    [data?.stats],
  );

  const queuePreview = useMemo<QueuePreviewItem[]>(
    () => (data?.tasks ?? []).map((item) => ({
      request_id: item.request_id,
      tracking_number: item.tracking_number,
      document_type: item.document_type,
      requestor_name: item.requestor_name,
      sla_status: item.sla_status as SLAStatus,
    })),
    [data?.tasks],
  );

  // ── SLA trend area ──
  const slaAreaOptions: ApexOptions = useMemo(() => ({
    ...base,
    chart: { ...base.chart, type: 'area', id: 'sla-trend' },
    colors: [C.emerald, C.amber, C.red],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
    xaxis: { categories: data?.slaWeeklyTrend?.map((d) => d.week) ?? [], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: '11px' } } },
    yaxis: { labels: { style: { fontSize: '11px' } } },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
    markers: { size: 3, hover: { size: 5 } },
  }), [data?.slaWeeklyTrend]);

  const slaAreaSeries = useMemo(() => [
    { name: 'On Track', data: data?.slaWeeklyTrend?.map((d) => d.onTrack) ?? [] },
    { name: 'At Risk', data: data?.slaWeeklyTrend?.map((d) => d.atRisk) ?? [] },
    { name: 'Breached', data: data?.slaWeeklyTrend?.map((d) => d.breached) ?? [] },
  ], [data?.slaWeeklyTrend]);

  // ── Queue donut ──
  const donutOptions: ApexOptions = useMemo(() => ({
    ...base,
    chart: { ...base.chart, type: 'donut', id: 'queue-status' },
    colors: [C.emerald, C.amber, C.red],
    labels: ['On Track', 'At Risk', 'Breached'],
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: { show: true, label: 'Pending', fontSize: '13px', fontWeight: 600, color: '#374151', formatter: () => String(stats.total_pending) },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '12px', itemMargin: { horizontal: 8 } },
    stroke: { width: 0 },
  }), [stats.total_pending]);

  const donutSeries = useMemo(() => [stats.on_track, stats.at_risk, stats.breached], [stats]);

  // ── Document type horizontal bar ──
  const docTypeOptions: ApexOptions = useMemo(() => ({
    ...base,
    chart: { ...base.chart, type: 'bar', id: 'doc-type' },
    colors: [C.indigo, C.emerald, C.amber, C.blue, C.violet],
    plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '55%', distributed: true } },
    xaxis: { categories: data?.documentTypeDistribution?.map((d) => d.name) ?? [], labels: { style: { fontSize: '11px' } } },
    yaxis: { labels: { style: { fontSize: '11px' }, maxWidth: 130 } },
    dataLabels: { enabled: false },
    legend: { show: false },
  }), [data?.documentTypeDistribution]);

  const docTypeSeries = useMemo(() => [
    { name: 'Requests', data: data?.documentTypeDistribution?.map((d) => d.value) ?? [] },
  ], [data?.documentTypeDistribution]);

  // ── Processing time grouped bar ──
  const processingOptions: ApexOptions = useMemo(() => ({
    ...base,
    chart: { ...base.chart, type: 'bar', id: 'processing' },
    colors: [C.amber, C.indigo],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    xaxis: { categories: data?.processingTime?.map((d) => d.docType) ?? [], labels: { style: { fontSize: '11px' }, rotate: -30 }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: '11px' }, formatter: (v) => `${v}d` } },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
  }), [data?.processingTime]);

  const processingSeries = useMemo(() => [
    { name: 'SLA Target', data: data?.processingTime?.map((d) => d.target) ?? [] },
    { name: 'Actual', data: data?.processingTime?.map((d) => d.actual) ?? [] },
  ], [data?.processingTime]);

  // ── Clearance performance grouped bar ──
  const clearanceOptions: ApexOptions = useMemo(() => ({
    ...base,
    chart: { ...base.chart, type: 'bar', id: 'clearance' },
    colors: [C.emerald, C.amber, C.red],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    xaxis: { categories: data?.clearancePerformance?.map((d) => d.office) ?? [], labels: { style: { fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: '11px' } } },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
  }), [data?.clearancePerformance]);

  const clearanceSeries = useMemo(() => [
    { name: 'Cleared', data: data?.clearancePerformance?.map((d) => d.cleared) ?? [] },
    { name: 'Pending', data: data?.clearancePerformance?.map((d) => d.pending) ?? [] },
    { name: 'Rejected', data: data?.clearancePerformance?.map((d) => d.rejected) ?? [] },
  ], [data?.clearancePerformance]);

  if (loading) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='h-8 w-48 animate-pulse rounded-lg bg-muted' />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array(4).fill(0).map((_, i) => <div key={i} className='h-32 animate-pulse rounded-lg bg-muted' />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'>
          <p className='font-semibold'>Error loading dashboard</p>
          <p className='text-sm'>{error}</p>
          <button onClick={refetch} className='mt-2 text-sm font-medium underline hover:no-underline'>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-3xl font-bold tracking-tight text-foreground'>Office Dashboard</h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>Real-time workload summary and performance metrics</p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard title='Pending Tasks' value={stats.total_pending} icon={ClipboardList} iconClass='text-primary' bgClass='bg-primary/10' description='In queue, not yet acted on' />
        <StatCard title='On Track' value={stats.on_track} icon={CheckCircle2} iconClass='text-emerald-600' bgClass='bg-emerald-100 dark:bg-emerald-950/40' description='Within SLA window' />
        <StatCard title='At Risk' value={stats.at_risk} icon={Clock} iconClass='text-amber-600' bgClass='bg-amber-100 dark:bg-amber-950/40' description='Near SLA deadline' />
        <StatCard title='SLA Breached' value={stats.breached} icon={AlertTriangle} iconClass='text-red-600' bgClass='bg-red-100 dark:bg-red-950/40' description='Past their deadline' />
      </div>

      <AiInsights data={data} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <TrendingUp className='h-4 w-4 text-primary' />SLA Performance (Weekly)
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Requests by SLA status over past 4 weeks</p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.slaWeeklyTrend?.length ?? 0) > 0
              ? <ReactApexChart type='area' height={250} options={slaAreaOptions} series={slaAreaSeries} />
              : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <BarChart3 className='h-4 w-4 text-primary' />Queue Status Distribution
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Current breakdown of {stats.total_pending} pending tasks</p>
          </CardHeader>
          <CardContent className='pt-0'>
            {stats.total_pending > 0
              ? <ReactApexChart type='donut' height={280} options={donutOptions} series={donutSeries} />
              : <EmptyChart message='No pending tasks' />}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>Requests by Document Type</CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>All-time distribution (volume)</p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.documentTypeDistribution?.length ?? 0) > 0
              ? <ReactApexChart type='bar' height={250} options={docTypeOptions} series={docTypeSeries} />
              : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>Avg. Processing Time vs SLA Target</CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Performance by document type (working days)</p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.processingTime?.length ?? 0) > 0
              ? <ReactApexChart type='bar' height={250} options={processingOptions} series={processingSeries} />
              : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='font-sans text-base font-semibold'>Clearance Performance by Office</CardTitle>
          <p className='font-sans mt-1 text-xs text-muted-foreground'>Task status across participating clearance offices</p>
        </CardHeader>
        <CardContent className='pt-0'>
          {(data?.clearancePerformance?.length ?? 0) > 0
            ? <ReactApexChart type='bar' height={250} options={clearanceOptions} series={clearanceSeries} />
            : <EmptyChart />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-3'>
          <CardTitle className='font-sans text-base font-semibold'>Queue Preview</CardTitle>
          <Button asChild variant='ghost' size='sm' className='gap-1 text-xs'>
            <a href='/office/queue'>View all <ChevronRight className='h-3.5 w-3.5' /></a>
          </Button>
        </CardHeader>
        <CardContent className='p-0'>
          {queuePreview.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-transparent'>
                  <TableHead className='font-sans pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Tracking No.</TableHead>
                  <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Document</TableHead>
                  <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Requestor</TableHead>
                  <TableHead className='font-sans pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground'>SLA Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuePreview.map((item) => (
                  <TableRow key={item.request_id} className='border-border hover:bg-muted/50'>
                    <TableCell className='font-sans pl-6 text-sm font-medium'>
                      <a href={`/office/request/${item.request_id}`} className='text-primary hover:underline'>{item.tracking_number}</a>
                    </TableCell>
                    <TableCell className='font-sans text-sm'>{item.document_type}</TableCell>
                    <TableCell className='font-sans text-sm text-muted-foreground'>{item.requestor_name}</TableCell>
                    <TableCell className='font-sans pr-6 text-right'><SLABadge status={item.sla_status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='p-8 text-center text-muted-foreground'>
              <p className='font-sans text-sm'>No pending tasks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
