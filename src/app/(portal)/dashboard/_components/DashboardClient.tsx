'use client';

import { useMemo } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
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
import { useFetch } from '@/hooks/useFetch';

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

// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardClient({ user }: DashboardClientProps) {
  const greeting = getGreeting();

  const { data, loading, error, refetch } = useFetch<PortalDashboardResponse>('/portal/dashboard');

  const stats = useMemo(
    () =>
      data?.stats ?? {
        total: 0,
        pending: 0,
        inProcess: 0,
        readyForRelease: 0,
        completed: 0,
      },
    [data?.stats],
  );

  const statusDistribution = useMemo(() => {
    const total = stats.total;
    return [
      {
        name: 'Pending',
        value: stats.pending,
        pct: total > 0 ? Math.round((stats.pending / total) * 100) : 0,
        fill: 'hsl(44, 100%, 50%)',
      },
      {
        name: 'In Process',
        value: stats.inProcess,
        pct: total > 0 ? Math.round((stats.inProcess / total) * 100) : 0,
        fill: 'hsl(200, 100%, 50%)',
      },
      {
        name: 'Ready',
        value: stats.readyForRelease,
        pct: total > 0 ? Math.round((stats.readyForRelease / total) * 100) : 0,
        fill: 'hsl(150, 100%, 40%)',
      },
      {
        name: 'Completed',
        value: stats.completed,
        pct: total > 0 ? Math.round((stats.completed / total) * 100) : 0,
        fill: 'hsl(150, 80%, 35%)',
      },
    ];
  }, [stats]);

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
    <div
      className='mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Hero Banner */}
      <div className='relative overflow-hidden rounded-2xl bg-primary px-6 py-7 shadow-lg shadow-primary/20 sm:px-8 sm:py-10'>
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
            <a href='/request/new'>
              <FilePlus2 className='h-4 w-4' />
              Request a Document
            </a>
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
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

      {/* Charts Row 1 */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Request Trend */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Request Trend
            </CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              Requests filed vs completed over time
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.requestTrend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart data={data?.requestTrend || []}>
                  <defs>
                    <linearGradient id='colorFiled' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='hsl(15, 100%, 29%)' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='hsl(15, 100%, 29%)' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='colorCompleted' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='hsl(150, 100%, 40%)' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='hsl(150, 100%, 40%)' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border)' />
                  <XAxis
                    dataKey='month'
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
                    dataKey='requests'
                    stroke='hsl(15, 100%, 29%)'
                    fillOpacity={1}
                    fill='url(#colorFiled)'
                    name='Filed'
                  />
                  <Area
                    type='monotone'
                    dataKey='completed'
                    stroke='hsl(150, 100%, 40%)'
                    fillOpacity={1}
                    fill='url(#colorCompleted)'
                    name='Completed'
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[220px] flex items-center justify-center text-muted-foreground'>
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <Zap className='h-4 w-4 text-primary' />
              Your Requests Status
            </CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              Current breakdown of all {stats.total} requests
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {stats.total > 0 ? (
              <>
                <ResponsiveContainer width='100%' height={220}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, pct }: { name: string; pct: number }) => `${name} ${pct}%`}
                      outerRadius={75}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {statusDistribution.map((entry, index) => (
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
                  {statusDistribution.map((stat) => (
                    <div key={stat.name} className='flex items-center justify-between text-sm'>
                      <div className='flex items-center gap-2'>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: stat.fill }}
                        />
                        <span className='font-sans text-muted-foreground'>{stat.name}</span>
                      </div>
                      <span className='font-sans font-semibold'>
                        {stat.value} ({stat.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='h-[220px] flex items-center justify-center text-muted-foreground'>
                No requests yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Document Type Breakdown */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>Documents Requested</CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              Your document request distribution
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.documentTypeBreakdown?.length ?? 0) > 0 ? (
              <ResponsiveContainer width='100%' height={220}>
                <BarChart data={data?.documentTypeBreakdown || []}>
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
                  <Bar dataKey='value' radius={[8, 8, 0, 0]} fill='hsl(15, 100%, 29%)' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[220px] flex items-center justify-center text-muted-foreground'>
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Processing Time */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans text-base font-semibold'>
              Avg. Processing Time
            </CardTitle>
            <p className='font-sans text-xs text-muted-foreground mt-1'>
              By document type (working days)
            </p>
          </CardHeader>
          <CardContent className='pt-0'>
            {(data?.avgProcessingTime?.length ?? 0) > 0 ? (
              <ResponsiveContainer width='100%' height={220}>
                <BarChart data={data?.avgProcessingTime || []}>
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
                  <Bar dataKey='avgDays' fill='hsl(15, 100%, 29%)' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-[220px] flex items-center justify-center text-muted-foreground'>
                No completed requests yet
              </div>
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

        {/* Mobile view */}
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
