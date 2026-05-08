'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  FileStack,
  Filter,
  Eye,
  Download,
  X,
  Clock,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Hourglass,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatDate } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import { RequestStatus } from '@/types/document.type';

interface RequestRecord {
  tracking_number: string;
  document_type: string;
  created_at: string;
  purpose: string;
  status: RequestStatus;
  has_download: boolean;
}

const ALL_STATUSES: RequestStatus[] = [
  'Pending',
  'In Process',
  'Action Required',
  'Ready for Release',
  'Released',
  'Cancelled',
];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Pending: {
    icon: Hourglass,
    color:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  'In Process': {
    icon: Clock,
    color:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
    dot: 'bg-blue-500',
  },
  'Action Required': {
    icon: AlertCircle,
    color:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
    dot: 'bg-red-500',
  },
  'Ready for Release': {
    icon: PackageCheck,
    color:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
    dot: 'bg-emerald-500',
  },
  Released: {
    icon: CheckCircle2,
    color: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30',
    dot: 'bg-primary',
  },
  Cancelled: {
    icon: XCircle,
    color:
      'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  },
} satisfies Record<RequestStatus, { color: string; icon: React.ElementType; dot: string }>;

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cfg.color,
      )}
    >
      <Icon className='h-3 w-3' />
      {status}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4'>
        <FileStack className='h-6 w-6 text-muted-foreground/60' />
      </div>
      <p className='text-sm font-semibold text-foreground'>
        {hasFilters ? 'No matching requests' : 'No requests yet'}
      </p>
      <p className='mt-1 text-xs text-muted-foreground max-w-xs'>
        {hasFilters
          ? 'Try adjusting your search or filter to find what you are looking for.'
          : 'Submit your first document request to get started.'}
      </p>
      {hasFilters && (
        <Button variant='outline' size='sm' onClick={onClear} className='mt-4 gap-1.5'>
          <X className='h-3.5 w-3.5' />
          Clear filters
        </Button>
      )}
    </div>
  );
}

function RequestListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4'>
        <AlertCircle className='h-6 w-6 text-destructive' />
      </div>
      <p className='text-sm font-semibold text-foreground'>Failed to load requests</p>
      <p className='mt-1 text-xs text-muted-foreground max-w-xs'>{message}</p>
      <Button variant='outline' size='sm' className='mt-5 gap-2' onClick={onRetry}>
        <RefreshCw className='h-3.5 w-3.5' />
        Try again
      </Button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell className='py-4'>
            <div className='h-3 w-20 rounded bg-muted animate-pulse' />
          </TableCell>
          <TableCell>
            <div className='h-3 w-40 rounded bg-muted animate-pulse' />
          </TableCell>
          <TableCell>
            <div className='h-3 w-24 rounded bg-muted animate-pulse' />
          </TableCell>
          <TableCell>
            <div className='h-3 w-44 rounded bg-muted animate-pulse' />
          </TableCell>
          <TableCell>
            <div className='h-5 w-24 rounded-full bg-muted animate-pulse' />
          </TableCell>
          <TableCell>
            <div className='h-8 w-24 rounded-md bg-muted animate-pulse' />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`card-skeleton-${index}`} className='p-4'>
          <div className='space-y-2'>
            <div className='h-4 w-40 rounded bg-muted animate-pulse' />
            <div className='h-3 w-28 rounded bg-muted animate-pulse' />
            <div className='h-3 w-52 rounded bg-muted animate-pulse' />
            <div className='h-5 w-24 rounded-full bg-muted animate-pulse' />
          </div>
        </Card>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RequestPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getDownloadUrl = (trackingNumber: string) =>
    `/api/portal/documents/download/${trackingNumber}`;

  const openPdfPreview = async (trackingNumber: string) => {
    try {
      const response = await fetch(getDownloadUrl(trackingNumber));
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch (err) {
      console.error(err);
    }
  };

  const { data, loading, error, refetch } = useFetch<{ requests: RequestRecord[] }>(
    '/portal/requests',
  );
  const requests = useMemo(() => data?.requests ?? [], [data?.requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        search === '' ||
        r.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
        r.document_type.toLowerCase().includes(search.toLowerCase()) ||
        r.purpose.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const hasActiveFilters = search !== '' || statusFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
  }

  return (
    <div className='space-y-5'>
      {/* Page header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>My Requests</h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            View and track all your document requests.
          </p>
        </div>
        <Button asChild size='sm'>
          <Link href='/requests/new'>New Request</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
          <Input
            placeholder='Search tracking number, document, or purpose…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-44'>
              <Filter className='h-3.5 w-3.5 text-muted-foreground mr-1' />
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <div className='flex items-center gap-2'>
                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[s].dot)} />
                    {s}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearFilters}
              className='gap-1.5 text-muted-foreground'
            >
              <X className='h-3.5 w-3.5' />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && requests.length > 0 && (
        <p className='text-xs text-muted-foreground'>
          Showing <span className='font-medium text-foreground'>{filtered.length}</span> of{' '}
          <span className='font-medium text-foreground'>{requests.length}</span> requests
        </p>
      )}

      {/* Table — desktop */}
      <div className='hidden md:block rounded-xl border overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              {['Tracking No.', 'Document Type', 'Date Filed', 'Purpose', 'Status', 'Actions'].map(
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
                  <RequestListError message={error} onRetry={refetch} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
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
                  <TableCell className='text-sm text-muted-foreground'>{req.purpose}</TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  {/* Actions — always visible */}
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
          <RequestListError message={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
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
                    {formatDate(req.created_at)} · {req.purpose}
                  </p>
                  <StatusBadge status={req.status} />
                </div>
                {/* Actions — always visible on mobile */}
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
