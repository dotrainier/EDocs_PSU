'use client';

import {
  Users,
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Static data ──────────────────────────────────────────────────────────────

const STATS = [
  { title: 'Total Users', value: 1_284, icon: Users, iconClass: 'text-blue-600', bgClass: 'bg-blue-100', description: 'Students, faculty & staff' },
  { title: 'Total Requests', value: 3_471, icon: ClipboardList, iconClass: 'text-indigo-600', bgClass: 'bg-indigo-100', description: 'All-time submissions' },
  { title: 'Pending Requests', value: 48, icon: Clock, iconClass: 'text-amber-600', bgClass: 'bg-amber-100', description: 'Awaiting processing' },
  { title: 'Completed Today', value: 23, icon: CheckCircle2, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100', description: 'Released this day' },
  { title: 'SLA Breached', value: 5, icon: AlertTriangle, iconClass: 'text-red-600', bgClass: 'bg-red-100', description: 'Past deadline' },
  { title: 'Active Offices', value: 8, icon: Building2, iconClass: 'text-violet-600', bgClass: 'bg-violet-100', description: 'Participating in clearance' },
];

const RECENT_ACTIVITY = [
  { id: '1', action: 'Request submitted', detail: 'TOR requested by Juan Dela Cruz', time: '2 min ago', type: 'info' },
  { id: '2', action: 'Clearance approved', detail: 'Registrar cleared EDC-2025-00421', time: '15 min ago', type: 'success' },
  { id: '3', action: 'SLA breached', detail: 'EDC-2025-00388 exceeded deadline', time: '1 hr ago', type: 'danger' },
  { id: '4', action: 'Payment received', detail: 'Maria Santos paid ₱150 for Certification', time: '2 hrs ago', type: 'success' },
  { id: '5', action: 'New user registered', detail: 'Carlo Reyes (Student) created account', time: '3 hrs ago', type: 'info' },
  { id: '6', action: 'Request rejected', detail: 'Incomplete requirements for EDC-2025-00410', time: '4 hrs ago', type: 'danger' },
  { id: '7', action: 'Document released', detail: 'Service Record released to Ana Gomez', time: '5 hrs ago', type: 'success' },
];

const TOP_DOCUMENTS = [
  { name: 'Transcript of Records', count: 1_240, pct: 36 },
  { name: 'Certificate of Enrollment', count: 820, pct: 24 },
  { name: 'Good Moral Certificate', count: 560, pct: 16 },
  { name: 'Clearance', count: 490, pct: 14 },
  { name: 'Service Record', count: 361, pct: 10 },
];

const ACTIVITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-red-100 text-red-700',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

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
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-3xl font-bold tracking-tight text-foreground'>Admin Dashboard</h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>System-wide overview of e-Docs activity</p>
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {STATS.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Recent activity */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <Activity className='h-4 w-4 text-primary' />
              Recent Activity
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Latest system events</p>
          </CardHeader>
          <CardContent className='space-y-3 pt-0'>
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className='flex items-start gap-3'>
                <span className={cn('mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', ACTIVITY_COLORS[item.type])}>
                  {item.type === 'info' ? 'Info' : item.type === 'success' ? 'OK' : 'Alert'}
                </span>
                <div className='flex-1 min-w-0'>
                  <p className='font-sans text-sm font-medium text-foreground'>{item.action}</p>
                  <p className='font-sans text-xs text-muted-foreground truncate'>{item.detail}</p>
                </div>
                <span className='font-sans shrink-0 text-xs text-muted-foreground'>{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top document types */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Top Document Types
            </CardTitle>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>Most requested documents (all-time)</p>
          </CardHeader>
          <CardContent className='space-y-4 pt-0'>
            {TOP_DOCUMENTS.map((doc) => (
              <div key={doc.name} className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='font-sans text-sm font-medium text-foreground'>{doc.name}</span>
                  <span className='font-sans text-sm text-muted-foreground'>{doc.count.toLocaleString()}</span>
                </div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary transition-all'
                    style={{ width: `${doc.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System status */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
            <FileText className='h-4 w-4 text-primary' />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            {[
              { label: 'Database', status: 'Operational' },
              { label: 'Email Service', status: 'Operational' },
              { label: 'AI Classification', status: 'Operational' },
              { label: 'Payment Gateway', status: 'Sandbox' },
            ].map((s) => (
              <div key={s.label} className='flex items-center justify-between rounded-lg border border-border px-4 py-3'>
                <span className='font-sans text-sm text-muted-foreground'>{s.label}</span>
                <Badge
                  variant='secondary'
                  className={cn(
                    'rounded-full text-xs',
                    s.status === 'Operational' && 'bg-emerald-100 text-emerald-700',
                    s.status === 'Sandbox' && 'bg-amber-100 text-amber-700',
                  )}
                >
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
