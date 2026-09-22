'use client';

import { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  ScrollText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { cn, formatDateTime } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import { KNOWN_AUDIT_ACTIONS, humanizeAction } from '@/lib/audit-labels';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditLogRow = {
  id: string;
  action: string;
  label: string;
  detail: string | null;
  actor_name: string | null;
  actor_email: string | null;
  timestamp: string;
};

type AuditLogsResponse = {
  logs: AuditLogRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const ACTION_COLORS: Record<string, string> = {
  REQUEST_SUBMITTED: 'bg-blue-100 text-blue-700',
  CLEARANCE_CLEARED: 'bg-emerald-100 text-emerald-700',
  CLEARANCE_REJECTED: 'bg-red-100 text-red-700',
  PAYMENT_CONFIRMED: 'bg-emerald-100 text-emerald-700',
  DOCUMENT_GENERATED: 'bg-violet-100 text-violet-700',
  REQUEST_READY_FOR_RELEASE: 'bg-amber-100 text-amber-700',
  REQUEST_RELEASED: 'bg-indigo-100 text-indigo-700',
  REGISTRATION_APPROVED: 'bg-emerald-100 text-emerald-700',
  REGISTRATION_REJECTED: 'bg-red-100 text-red-700',
};

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditLogsPage() {
  const [action, setAction] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (action !== 'all') params.set('action', action);
    // Sent as full instants (not bare YYYY-MM-DD) so "today" means the
    // browser's local calendar day, matching what the Timestamp column
    // already shows in local time — not the server's UTC day.
    if (from) params.set('from', new Date(`${from}T00:00:00`).toISOString());
    if (to) params.set('to', new Date(`${to}T23:59:59.999`).toISOString());
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    return `/admin/audit-logs?${params.toString()}`;
  }, [action, from, to, page]);

  const { data, loading, error, refetch } = useFetch<AuditLogsResponse>(queryUrl);

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasFilters = action !== 'all' || from !== '' || to !== '';

  function handleActionChange(value: string) {
    setAction(value);
    setPage(1);
  }

  function handleFromChange(value: string) {
    setFrom(value);
    setPage(1);
  }

  function handleToChange(value: string) {
    setTo(value);
    setPage(1);
  }

  function clearFilters() {
    setAction('all');
    setFrom('');
    setTo('');
    setPage(1);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Audit Logs
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          Immutable record of all system events and user actions
        </p>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <Select value={action} onValueChange={handleActionChange}>
            <SelectTrigger className='font-sans w-full sm:w-55'>
              <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='Action' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='font-sans'>
                All Actions
              </SelectItem>
              {KNOWN_AUDIT_ACTIONS.map((a) => (
                <SelectItem key={a} value={a} className='font-sans'>
                  {humanizeAction(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='flex flex-1 items-center gap-2'>
            <CalendarRange className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
            <Input
              type='date'
              value={from}
              onChange={(e) => handleFromChange(e.target.value)}
              max={to || undefined}
              className='font-sans'
              aria-label='From date'
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <Input
              type='date'
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
              min={from || undefined}
              className='font-sans'
              aria-label='To date'
            />
          </div>

          {hasFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearFilters}
              className='font-sans shrink-0 gap-1.5 text-muted-foreground'
            >
              <X className='h-3.5 w-3.5' />
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
              <p className='font-sans text-sm text-muted-foreground'>Loading logs…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <ScrollText className='h-7 w-7 text-muted-foreground' />
              </div>
              <p className='font-sans text-sm text-muted-foreground'>
                {hasFilters ? 'No logs match your filters.' : 'No audit events recorded yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-transparent'>
                  {['Timestamp', 'Action', 'Actor', 'Details'].map((h) => (
                    <TableHead
                      key={h}
                      className={cn(
                        'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        h === 'Timestamp' && 'pl-6',
                        h === 'Details' && 'pr-6',
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs text-muted-foreground whitespace-nowrap'>
                        {formatDateTime(log.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <span className='font-sans text-sm font-medium text-foreground'>
                          {log.label}
                        </span>
                        <Badge
                          variant='secondary'
                          className={cn(
                            'w-fit rounded-full px-2 font-mono text-[10px]',
                            ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.actor_name ? (
                        <div className='flex flex-col'>
                          <span className='font-sans text-sm text-foreground'>{log.actor_name}</span>
                          {log.actor_email && (
                            <span className='font-sans text-xs text-muted-foreground'>
                              {log.actor_email}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className='font-sans text-sm text-muted-foreground'>System</span>
                      )}
                    </TableCell>
                    <TableCell className='max-w-sm pr-6'>
                      <span className='font-sans text-sm text-muted-foreground line-clamp-2'>
                        {log.detail ?? '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
          <p className='font-sans text-xs text-muted-foreground'>
            Showing <span className='font-medium text-foreground'>{rangeStart}</span>–
            <span className='font-medium text-foreground'>{rangeEnd}</span> of{' '}
            <span className='font-medium text-foreground'>{total}</span> entries
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className='gap-1'
            >
              <ChevronLeft className='h-3.5 w-3.5' />
              Prev
            </Button>
            <span className='font-sans text-xs text-muted-foreground'>
              Page {page} of {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className='gap-1'
            >
              Next
              <ChevronRight className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      )}

      {!loading && error && (
        <Button variant='outline' size='sm' onClick={refetch} className='font-sans'>
          Try again
        </Button>
      )}
    </div>
  );
}
