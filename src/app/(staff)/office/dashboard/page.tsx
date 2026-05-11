'use client';

import { useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
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
import { SLAStatus } from '@/types/document.type';

interface QueuePreviewItem {
  request_id: string;
  tracking_number: string;
  document_type: string;
  requestor_name: string;
  sla_status: SLAStatus;
  sla_due_at: Date | null;
}

interface DashboardResponse {
  stats: {
    total_pending: number;
    on_track: number;
    at_risk: number;
    breached: number;
  };
  slaWeeklyTrend: Array<{
    week: string;
    onTrack: number;
    atRisk: number;
    breached: number;
  }>;
  documentTypeDistribution: Array<{
    name: string;
    value: number;
  }>;
  processingTime: Array<{
    docType: string;
    target: number;
    actual: number;
  }>;
  clearancePerformance: Array<{
    office: string;
    cleared: number;
    pending: number;
    rejected: number;
  }>;
  tasks: Array<{
    request_id: string;
    tracking_number: string;
    document_type: string;
    requestor_name: string;
    sla_due_at: string | null;
    sla_status: string;
    payment_status: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────

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

// Custom chart colors matching design tokens
const ChartColors = {
  chart1: 'var(--color-chart-1)', // Maroon - Primary
  chart2: 'var(--color-chart-2)', // Gold - Warning/At Risk
  chart3: 'var(--color-chart-3)', // Blue - Secondary
  chart4: 'var(--color-chart-4)', // Teal - On Track
  chart5: 'var(--color-chart-5)', // Red - Breached
};

// ─────────────────────────────────────────────────────────────────────────────

export default function OfficeDashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardResponse>('/office/dashboard');

  const stats = useMemo(
    () =>
      data?.stats ?? {
        total_pending: 0,
        on_track: 0,
        at_risk: 0,
        breached: 0,
      },
    [data?.stats],
  );

  const queuePreview = useMemo<QueuePreviewItem[]>(() => {
    return (data?.tasks ?? []).map((item) => ({
      request_id: item.request_id,
      tracking_number: item.tracking_number,
      document_type: item.document_type,
      requestor_name: item.requestor_name,
      sla_status: item.sla_status as SLAStatus,
      sla_due_at: item.sla_due_at ? new Date(item.sla_due_at) : null,
    }));
  }, [data?.tasks]);

  const queueStats = useMemo(() => {
    const total = stats.total_pending;
    const onTrackPct = total > 0 ? Math.round((stats.on_track / total) * 100) : 0;
    const atRiskPct = total > 0 ? Math.round((stats.at_risk / total) * 100) : 0;
    const breachedPct = total > 0 ? Math.round((stats.breached / total) * 100) : 0;

    return [
      { name: 'On Track', value: stats.on_track, percentage: onTrackPct, fill: ChartColors.chart4 },
      { name: 'At Risk', value: stats.at_risk, percentage: atRiskPct, fill: ChartColors.chart2 },
      {
        name: 'Breached',
        value: stats.breached,
        percentage: breachedPct,
        fill: ChartColors.chart5,
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='h-8 w-48 animate-pulse rounded-lg bg-muted' />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className='h-32 animate-pulse rounded-lg bg-muted' />
            ))}
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
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-3xl font-bold tracking-tight text-foreground'>
          Office Dashboard
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          Real-time workload summary and performance metrics
        </p>
      </div>

      {/* Top Stats */}
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
          icon={Clock}
          iconClass='text-amber-600'
          bgClass='bg-amber-100 dark:bg-amber-950/40'
          description='Near SLA deadline'
        />
        <StatCard
          title='SLA Breached'
          value={stats.breached}
          icon={AlertTriangle}
          iconClass='text-red-600'
          bgClass='bg-red-100 dark:bg-red-950/40'
          description='Past their deadline'
        />
      </div>

      {/* Charts Row 1 */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* SLA Trend Chart */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
                <TrendingUp className='h-4 w-4 text-primary' />
                SLA Performance (Weekly)
              </CardTitle>
            </div>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              Requests by SLA status over past 4 weeks
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.slaWeeklyTrend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <AreaChart data={data?.slaWeeklyTrend || []}>
                  <defs>
                    <linearGradient id='colorOnTrack' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={ChartColors.chart4} stopOpacity={0.3} />
                      <stop offset='95%' stopColor={ChartColors.chart4} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='colorAtRisk' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={ChartColors.chart2} stopOpacity={0.3} />
                      <stop offset='95%' stopColor={ChartColors.chart2} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='colorBreached' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={ChartColors.chart5} stopOpacity={0.3} />
                      <stop offset='95%' stopColor={ChartColors.chart5} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border)' />
                  <XAxis
                    dataKey='week'
                    stroke='var(--color-muted-foreground)'
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke='var(--color-muted-foreground)' style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Legend />
                  <Area
                    type='monotone'
                    dataKey='onTrack'
                    stroke={ChartColors.chart4}
                    fillOpacity={1}
                    fill='url(#colorOnTrack)'
                    name='On Track'
                  />
                  <Area
                    type='monotone'
                    dataKey='atRisk'
                    stroke={ChartColors.chart2}
                    fillOpacity={1}
                    fill='url(#colorAtRisk)'
                    name='At Risk'
                  />
                  <Area
                    type='monotone'
                    dataKey='breached'
                    stroke={ChartColors.chart5}
                    fillOpacity={1}
                    fill='url(#colorBreached)'
                    name='Breached'
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[250px] flex items-center justify-center text-muted-foreground'>
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Distribution Pie */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <BarChart3 className='h-4 w-4 text-primary' />
              Queue Status Distribution
            </CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              Current breakdown of {stats.total_pending} pending tasks
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {stats.total_pending > 0 && (stats.on_track > 0 || stats.at_risk > 0 || stats.breached > 0) ? (
              <>
                <ResponsiveContainer width='100%' height={250}>
                  <PieChart>
                    <Pie
                      data={queueStats}
                      cx='50%'
                      cy='50%'
                      labelLine={true}
                      label={({ name, percentage }: { name: string; percentage: number }) =>
                        `${name} ${percentage}%`
                      }
                      outerRadius={80}
                      fill='var(--color-chart-1)'
                      dataKey='value'
                    >
                      {queueStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: 'var(--color-foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-4 space-y-2'>
                  {queueStats.map((stat) => (
                    <div key={stat.name} className='flex items-center justify-between text-sm'>
                      <div className='flex items-center gap-2'>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: stat.fill }}
                        />
                        <span className='font-sans text-muted-foreground'>{stat.name}</span>
                      </div>
                      <span
                        className={cn(
                          'font-sans font-semibold',
                          stat.value === 0 && 'text-muted-foreground',
                        )}
                      >
                        {stat.value} ({stat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='h-[250px] flex items-center justify-center text-muted-foreground'>
                <div className='text-center'>
                  <p className='font-medium'>No status data available</p>
                  <p className='text-xs mt-1'>Pending tasks are being processed</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Document Type Distribution */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>
              Requests by Document Type
            </CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              All-time distribution (volume)
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.documentTypeDistribution?.length ?? 0) > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={data?.documentTypeDistribution || []}>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border)' />
                  <XAxis
                    dataKey='name'
                    stroke='var(--color-muted-foreground)'
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke='var(--color-muted-foreground)' style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Bar dataKey='value' radius={[8, 8, 0, 0]} fill={ChartColors.chart1} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[250px] flex items-center justify-center text-muted-foreground'>
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Time vs SLA Target */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>
              Avg. Processing Time vs SLA Target
            </CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              Performance by document type (working days)
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.processingTime?.length ?? 0) > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <ComposedChart data={data?.processingTime || []}>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border)' />
                  <XAxis
                    dataKey='docType'
                    stroke='var(--color-muted-foreground)'
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke='var(--color-muted-foreground)' style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Legend />
                  <Bar
                    dataKey='target'
                    fill={ChartColors.chart2}
                    radius={[8, 8, 0, 0]}
                    name='SLA Target'
                  />
                  <Bar
                    dataKey='actual'
                    fill={ChartColors.chart1}
                    radius={[8, 8, 0, 0]}
                    name='Actual'
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[250px] flex items-center justify-center text-muted-foreground'>
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clearance Performance */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='font-sans text-base font-semibold'>
            Clearance Performance by Office
          </CardTitle>
          <p className='font-sans text-xs text-muted-foreground mt-1'>
            Task status across participating clearance offices
          </p>
        </CardHeader>
        <CardContent className='pt-0'>
          {(data?.clearancePerformance?.length ?? 0) > 0 ? (
            <ResponsiveContainer width='100%' height={250}>
              <BarChart
                data={data?.clearancePerformance || []}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border)' />
                <XAxis
                  dataKey='office'
                  stroke='var(--color-muted-foreground)'
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke='var(--color-muted-foreground)' style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                />
                <Legend />
                <Bar
                  dataKey='cleared'
                  fill={ChartColors.chart4}
                  name='Cleared'
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey='pending'
                  fill={ChartColors.chart2}
                  name='Pending'
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey='rejected'
                  fill={ChartColors.chart5}
                  name='Rejected'
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-[250px] flex items-center justify-center text-muted-foreground'>
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Preview Table */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-3'>
          <CardTitle className='font-sans text-base font-semibold'>Queue Preview</CardTitle>
          <Button asChild variant='ghost' size='sm' className='gap-1 text-xs'>
            <a href='/office/queue'>
              View all <ChevronRight className='h-3.5 w-3.5' />
            </a>
          </Button>
        </CardHeader>
        <CardContent className='p-0'>
          {queuePreview.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-transparent'>
                  <TableHead className='font-sans pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    Tracking No.
                  </TableHead>
                  <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    Document
                  </TableHead>
                  <TableHead className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    Requestor
                  </TableHead>
                  <TableHead className='font-sans text-right pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    SLA Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuePreview.map((item) => (
                  <TableRow key={item.request_id} className='border-border hover:bg-muted/50'>
                    <TableCell className='font-sans pl-6 text-sm font-medium'>
                      <a
                        href={`/office/request/${item.request_id}`}
                        className='text-primary hover:underline'
                      >
                        {item.tracking_number}
                      </a>
                    </TableCell>
                    <TableCell className='font-sans text-sm'>{item.document_type}</TableCell>
                    <TableCell className='font-sans text-sm text-muted-foreground'>
                      {item.requestor_name}
                    </TableCell>
                    <TableCell className='font-sans pr-6 text-right'>
                      <SLABadge status={item.sla_status} />
                    </TableCell>
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
