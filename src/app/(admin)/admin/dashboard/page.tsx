'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  Activity,
  UserCheck,
  UserRoundX,
  Hourglass,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import { AiInsights } from './_components/AiInsights';

interface DashboardResponse {
  stats: {
    totalUsers: number;
    totalRequests: number;
    pendingRequests: number;
    completedToday: number;
    onTrack: number;
    overdue: number;
  };
  registrationFunnel: { pending: number; approved: number; rejected: number };
  requestsByStatus: Array<{ status: string; count: number }>;
  documentTypeVolume: Array<{ name: string; value: number }>;
  participatingOffices: Array<{ id: number; name: string }>;
  officeBacklogs: Array<{
    officeId: number;
    officeName: string;
    totalWeight: number;
    dailyCapacity: number | null;
    backlogDays: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    label: string;
    type: 'info' | 'success' | 'danger';
    actor: string | null;
    detail: string | null;
    trackingNumber: string | null;
    at: string;
  }>;
}

const ACTIVITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-red-100 text-red-700',
};

function formatTimeAgo(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

function localDateString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function withParams(path: string, params: Record<string, string>) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}

function activityHref(item: { action: string; trackingNumber: string | null }) {
  return item.trackingNumber
    ? `/admin/requests/${item.trackingNumber}`
    : withParams('/admin/audit-logs', { action: item.action });
}

function officeScopeNote(offices: Array<{ id: number; name: string }>) {
  if (offices.length === 0) return 'No office currently routes documents';
  if (offices.length === 1) return `${offices[0].name} only — no other office is routing documents yet`;
  return `Across ${offices.length} offices: ${offices.map((o) => o.name).join(', ')}`;
}

function StatCard({ title, value, icon: Icon, iconClass, bgClass, description, href }: {
  title: string; value: number; icon: React.ElementType;
  iconClass: string; bgClass: string; description?: string; href?: string;
}) {
  const card = (
    <Card className={cn('relative h-full overflow-hidden', href && 'transition-colors hover:border-primary/40 hover:bg-muted/30')}>
      <CardContent className='px-5 pb-4 pt-5'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>{title}</p>
            <p className='font-heading mt-1.5 text-3xl font-bold text-foreground'>{value.toLocaleString()}</p>
            {description && <p className='font-sans mt-1 text-xs text-muted-foreground'>{description}</p>}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bgClass)}>
            <Icon className={cn('h-5 w-5', iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className='block' aria-label={`${title}: ${value}. View details`}>
      {card}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardResponse>('/admin/dashboard');

  if (loading) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='h-8 w-56 animate-pulse rounded-lg bg-muted' />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {Array(6).fill(0).map((_, i) => <div key={i} className='h-28 animate-pulse rounded-lg bg-muted' />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'>
          <p className='font-semibold'>Error loading dashboard</p>
          <p className='text-sm'>{error || 'No data returned'}</p>
          <button onClick={refetch} className='mt-2 text-sm font-medium underline hover:no-underline'>Try again</button>
        </div>
      </div>
    );
  }

  const { stats, registrationFunnel, requestsByStatus, documentTypeVolume, participatingOffices, officeBacklogs, recentActivity } = data;

  const maxDocTypeVolume = Math.max(1, ...documentTypeVolume.map((d) => d.value));
  const maxStatusCount = Math.max(1, ...requestsByStatus.map((s) => s.count));
  const today = localDateString(new Date());

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-3xl font-bold tracking-tight text-foreground'>Admin Dashboard</h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>System-wide overview of e-Docs activity</p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard title='Total Users' value={stats.totalUsers} icon={Users} iconClass='text-blue-600' bgClass='bg-blue-100' description='Students, faculty & staff' href='/admin/users' />
        <StatCard title='Total Requests' value={stats.totalRequests} icon={ClipboardList} iconClass='text-indigo-600' bgClass='bg-indigo-100' description='All-time submissions' href='/admin/requests' />
        <StatCard title='Pending Requests' value={stats.pendingRequests} icon={Clock} iconClass='text-amber-600' bgClass='bg-amber-100' description='Pending or in process' href='/admin/requests?status=active' />
        <StatCard title='Completed Today' value={stats.completedToday} icon={CheckCircle2} iconClass='text-emerald-600' bgClass='bg-emerald-100' description='Released this day' href={withParams('/admin/audit-logs', { action: 'REQUEST_RELEASED', from: today, to: today })} />
        <StatCard title='Overdue' value={stats.overdue} icon={AlertTriangle} iconClass='text-red-600' bgClass='bg-red-100' description={officeScopeNote(participatingOffices)} href='/admin/requests?overdue=1' />
        <StatCard title='Active Offices' value={participatingOffices.length} icon={Building2} iconClass='text-violet-600' bgClass='bg-violet-100' description={officeScopeNote(participatingOffices)} href='/admin/offices' />
      </div>

      <AiInsights data={data} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
                <Activity className='h-4 w-4 text-primary' />
                Recent Activity
              </CardTitle>
              <Button asChild variant='ghost' size='sm' className='gap-1 text-xs'>
                <Link href='/admin/audit-logs'>View all <ChevronRight className='h-3.5 w-3.5' /></Link>
              </Button>
            </div>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Latest system events · click one to open it</p>
          </CardHeader>
          <CardContent className='space-y-1 pt-0'>
            {recentActivity.length === 0 && (
              <p className='font-sans text-sm text-muted-foreground'>No activity yet</p>
            )}
            {recentActivity.map((item) => (
              <Link
                key={item.id}
                href={activityHref(item)}
                className='-mx-2 flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60'
              >
                <span className={cn('mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', ACTIVITY_COLORS[item.type])}>
                  {item.type === 'info' ? 'Info' : item.type === 'success' ? 'OK' : 'Alert'}
                </span>
                <div className='flex-1 min-w-0'>
                  <p className='font-sans text-sm font-medium text-foreground'>{item.label}</p>
                  <p className='font-sans text-xs text-muted-foreground truncate'>
                    {[item.detail, item.actor ? `By ${item.actor}` : null].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <span className='font-sans shrink-0 text-xs text-muted-foreground'>{formatTimeAgo(item.at)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Requests by Document Type
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>All-time volume, top 5 · click a row to view those requests</p>
          </CardHeader>
          <CardContent className='space-y-1 pt-0'>
            {documentTypeVolume.length === 0 && (
              <p className='font-sans text-sm text-muted-foreground'>No requests yet</p>
            )}
            {documentTypeVolume.map((doc) => (
              <Link
                key={doc.name}
                href={withParams('/admin/requests', { type: doc.name })}
                className='-mx-2 block space-y-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-sans text-sm font-medium text-foreground'>{doc.name}</span>
                  <span className='font-sans text-sm text-muted-foreground'>{doc.value.toLocaleString()}</span>
                </div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary transition-all'
                    style={{ width: `${Math.round((doc.value / maxDocTypeVolume) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <ClipboardList className='h-4 w-4 text-primary' />
              Requests by Status
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>All-time, across every document type · click a row to view those requests</p>
          </CardHeader>
          <CardContent className='space-y-1 pt-0'>
            {requestsByStatus.map((s) => (
              <Link
                key={s.status}
                href={withParams('/admin/requests', { status: s.status })}
                className='-mx-2 block space-y-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted/60'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-sans text-sm font-medium text-foreground'>{s.status}</span>
                  <span className='font-sans text-sm text-muted-foreground'>{s.count.toLocaleString()}</span>
                </div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-indigo-500 transition-all'
                    style={{ width: `${Math.round((s.count / maxStatusCount) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <UserCheck className='h-4 w-4 text-primary' />
              Registration Funnel
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Verification status across all accounts</p>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='grid grid-cols-3 gap-3'>
              <Link href='/admin/verification' className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center transition-colors hover:border-amber-300 hover:bg-amber-100'>
                <Hourglass className='mx-auto h-4 w-4 text-amber-600' />
                <p className='font-heading mt-1 text-2xl font-bold text-amber-700'>{registrationFunnel.pending}</p>
                <p className='font-sans text-[11px] font-medium uppercase tracking-wide text-amber-700/80'>Pending</p>
              </Link>
              <Link href='/admin/users?verification=approved' className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-100'>
                <UserCheck className='mx-auto h-4 w-4 text-emerald-600' />
                <p className='font-heading mt-1 text-2xl font-bold text-emerald-700'>{registrationFunnel.approved}</p>
                <p className='font-sans text-[11px] font-medium uppercase tracking-wide text-emerald-700/80'>Approved</p>
              </Link>
              <Link href='/admin/users?verification=rejected' className='rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-center transition-colors hover:border-red-300 hover:bg-red-100'>
                <UserRoundX className='mx-auto h-4 w-4 text-red-600' />
                <p className='font-heading mt-1 text-2xl font-bold text-red-700'>{registrationFunnel.rejected}</p>
                <p className='font-sans text-[11px] font-medium uppercase tracking-wide text-red-700/80'>Rejected</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
            <Gauge className='h-4 w-4 text-primary' />
            Live Backlog by Office
          </CardTitle>
          <p className='font-sans mt-1 text-xs text-muted-foreground'>
            A live snapshot of queued weight vs. daily capacity — {officeScopeNote(participatingOffices)}. Click an office to adjust its capacity.
          </p>
        </CardHeader>
        <CardContent className='pt-0'>
          {officeBacklogs.length === 0 ? (
            <p className='font-sans text-sm text-muted-foreground'>No office is currently routing documents.</p>
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {officeBacklogs.map((b) => (
                <Link
                  key={b.officeId}
                  href='/admin/capacity-settings'
                  className='rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/30'
                >
                  <p className='font-sans text-sm font-medium text-foreground'>{b.officeName}</p>
                  <div className='mt-1 flex items-baseline gap-1.5'>
                    <span className={cn('font-heading text-2xl font-bold', b.backlogDays > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                      {b.backlogDays}
                    </span>
                    <span className='font-sans text-xs text-muted-foreground'>day{b.backlogDays === 1 ? '' : 's'} of backlog</span>
                  </div>
                  <p className='font-sans mt-1 text-[11px] text-muted-foreground'>
                    {b.totalWeight} weighted request{b.totalWeight === 1 ? '' : 's'} vs.{' '}
                    {b.dailyCapacity !== null ? `${b.dailyCapacity}/day` : 'default'} capacity
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
