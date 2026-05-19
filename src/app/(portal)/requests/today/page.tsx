'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  CalendarDays,
  Eye,
  Download,
  Clock,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Hourglass,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import { RequestStatus } from '@/types/document.type';

interface RequestRecord {
  tracking_number: string;
  document_type: string;
  created_at: string;
  updated_at: string;
  purpose: string;
  status: string;
  has_download: boolean;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RequestStatus, { icon: React.ElementType; color: string }> = {
  Pending: {
    icon: Hourglass,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  'In Process': {
    icon: Clock,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  'Action Required': {
    icon: AlertCircle,
    color: 'bg-red-50 text-red-700 border-red-200',
  },
  'Ready for Release': {
    icon: PackageCheck,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Released: {
    icon: CheckCircle2,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  Cancelled: {
    icon: XCircle,
    color: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  },
};

const UNKNOWN_STATUS = {
  icon: AlertCircle,
  color: 'bg-amber-50 text-amber-800 border-amber-200',
};

function normalizeStatus(status: string): RequestStatus | null {
  const map: Record<string, RequestStatus> = {
    pending: 'Pending',
    'in process': 'In Process',
    'action required': 'Action Required',
    'ready for release': 'Ready for Release',
    released: 'Released',
    cancelled: 'Cancelled',
  };
  return map[status.trim().toLowerCase()] ?? null;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const cfg = (normalized ? STATUS_CONFIG[normalized] : undefined) ?? UNKNOWN_STATUS;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cfg.color,
      )}
    >
      <Icon className='h-3 w-3' />
      {normalized ?? status}
    </span>
  );
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          <TableCell><div className='h-3 w-20 rounded bg-muted animate-pulse' /></TableCell>
          <TableCell><div className='h-3 w-36 rounded bg-muted animate-pulse' /></TableCell>
          <TableCell><div className='h-3 w-28 rounded bg-muted animate-pulse' /></TableCell>
          <TableCell><div className='h-5 w-28 rounded-full bg-muted animate-pulse' /></TableCell>
          <TableCell><div className='h-3 w-24 rounded bg-muted animate-pulse' /></TableCell>
          <TableCell><div className='h-8 w-16 rounded-md bg-muted animate-pulse' /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={`csk-${i}`} className='p-4 space-y-2'>
          <div className='h-4 w-36 rounded bg-muted animate-pulse' />
          <div className='h-3 w-24 rounded bg-muted animate-pulse' />
          <div className='h-3 w-48 rounded bg-muted animate-pulse' />
          <div className='h-5 w-28 rounded-full bg-muted animate-pulse' />
        </Card>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const openPdfPreview = async (trackingNumber: string) => {
  try {
    const res = await fetch(`/api/portal/documents/download/${trackingNumber}`);
    if (!res.ok) throw new Error('Failed to fetch PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (err) {
    console.error(err);
  }
};

export default function TodaysHistoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useFetch<{ requests: RequestRecord[] }>(
    '/portal/requests',
  );

  const todayRequests = useMemo(() => {
    const all = data?.requests ?? [];
    return all.filter((r) => isToday(r.updated_at));
  }, [data?.requests]);

  const filtered = useMemo(() => {
    if (search === '') return todayRequests;
    const q = search.toLowerCase();
    return todayRequests.filter(
      (r) =>
        r.tracking_number.toLowerCase().includes(q) ||
        r.document_type.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q),
    );
  }, [todayRequests, search]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className='space-y-5 px-4 py-6 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2 mb-0.5'>
            <button
              type='button'
              onClick={() => router.push('/requests')}
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              <ArrowLeft className='h-4 w-4' />
            </button>
            <h1 className='text-2xl font-bold tracking-tight text-foreground flex items-center gap-2'>
              <CalendarDays className='h-6 w-6 text-primary' />
              Today&apos;s History
            </h1>
          </div>
          <p className='text-sm text-muted-foreground ml-6'>{today}</p>
        </div>
        <Button variant='outline' size='sm' onClick={refetch} className='gap-1.5 shrink-0'>
          <RefreshCw className='h-3.5 w-3.5' />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className='relative max-w-sm'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
        <Input
          placeholder='Search tracking number or document…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Count */}
      {!loading && !error && (
        <p className='text-xs text-muted-foreground'>
          {filtered.length === 0
            ? 'No activity today yet.'
            : (
              <>
                <span className='font-medium text-foreground'>{filtered.length}</span>{' '}
                request{filtered.length !== 1 ? 's' : ''} had activity today
              </>
            )}
        </p>
      )}

      {/* Table — desktop */}
      <div className='hidden md:block rounded-xl border overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              {['Tracking No.', 'Document Type', 'Date Filed', 'Status', 'Activity Time', 'Actions'].map(
                (h) => (
                  <TableHead
                    key={h}
                    className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                  >
                    {h}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <AlertCircle className='h-8 w-8 text-destructive mb-3' />
                    <p className='text-sm font-semibold'>Failed to load</p>
                    <p className='text-xs text-muted-foreground mt-1'>{error}</p>
                    <Button variant='outline' size='sm' className='mt-4 gap-2' onClick={refetch}>
                      <RefreshCw className='h-3.5 w-3.5' />
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <CalendarDays className='h-10 w-10 text-muted-foreground/40 mb-3' />
                    <p className='text-sm font-semibold text-foreground'>No activity today</p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {search
                        ? 'No matching requests for your search.'
                        : 'None of your requests were updated today.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => (
                <TableRow key={req.tracking_number}>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {req.tracking_number}
                  </TableCell>
                  <TableCell className='text-sm font-medium text-foreground'>
                    {req.document_type}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDate(req.created_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell>
                    <span className='flex items-center gap-1.5 text-sm font-medium text-foreground'>
                      <Clock className='h-3.5 w-3.5 shrink-0 text-primary' />
                      {formatDateTime(req.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <Button variant='outline' size='sm' className='h-8 gap-1.5 text-xs' asChild>
                        <Link href={`/requests/${req.tracking_number}`}>
                          <Eye className='h-3.5 w-3.5' />
                          View
                        </Link>
                      </Button>
                      {req.has_download &&
                        (req.status === 'Ready for Release' || req.status === 'Released') && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 gap-1.5 text-xs'
                            onClick={() => openPdfPreview(req.tracking_number)}
                          >
                            <Download className='h-3.5 w-3.5' />
                            Download
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Card list — mobile */}
      <div className='space-y-3 md:hidden'>
        {loading ? (
          <CardSkeleton />
        ) : error ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center'>
            <AlertCircle className='h-8 w-8 text-destructive mb-3' />
            <p className='text-sm font-semibold'>Failed to load</p>
            <Button variant='outline' size='sm' className='mt-4 gap-2' onClick={refetch}>
              <RefreshCw className='h-3.5 w-3.5' />
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border px-6 py-12 text-center'>
            <CalendarDays className='h-10 w-10 text-muted-foreground/40 mb-3' />
            <p className='text-sm font-semibold text-foreground'>No activity today</p>
            <p className='text-xs text-muted-foreground mt-1'>
              None of your requests were updated today.
            </p>
          </div>
        ) : (
          filtered.map((req) => (
            <Card key={req.tracking_number} className='p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1 space-y-1.5'>
                  <p className='text-sm font-semibold text-foreground leading-tight'>
                    {req.document_type}
                  </p>
                  <p className='font-mono text-xs text-muted-foreground'>{req.tracking_number}</p>
                  <p className='text-xs text-muted-foreground'>
                    Filed: {formatDate(req.created_at)}
                  </p>
                  <StatusBadge status={req.status} />
                  <p className='flex items-center gap-1.5 text-xs font-medium text-foreground pt-0.5'>
                    <Clock className='h-3 w-3 text-primary shrink-0' />
                    {formatDateTime(req.updated_at)}
                  </p>
                </div>
                <div className='flex shrink-0 flex-col items-end gap-1.5'>
                  <Button variant='outline' size='sm' className='h-8 gap-1.5 text-xs' asChild>
                    <Link href={`/requests/${req.tracking_number}`}>
                      <Eye className='h-3.5 w-3.5' />
                      View
                    </Link>
                  </Button>
                  {req.has_download &&
                    (req.status === 'Ready for Release' || req.status === 'Released') && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-8 gap-1.5 text-xs'
                        onClick={() => openPdfPreview(req.tracking_number)}
                      >
                        <Download className='h-3.5 w-3.5' />
                        Download
                      </Button>
                    )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
