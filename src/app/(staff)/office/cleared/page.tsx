'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { cn, formatDateOptional, formatDateTime } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type ActionTaken = 'Cleared' | 'Rejected';

interface ClearedTask {
  task_id: string;
  task_status: ActionTaken;
  remarks: string | null;
  cleared_at: string | null;
  cleared_by_name: string | null;
  request_id: string;
  tracking_number: string;
  status: string;
  purpose: string;
  created_at: string;
  document_type: string;
  requestor_name: string;
  requestor_school_id: string;
}

interface ClearedApiResponse {
  tasks: ClearedTask[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionBadge({ action }: { action: ActionTaken }) {
  return (
    <span
      className={cn(
        'font-sans inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        action === 'Cleared'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400'
          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
      )}
    >
      {action === 'Cleared' ? (
        <CheckCircle2 className='h-3 w-3' />
      ) : (
        <XCircle className='h-3 w-3' />
      )}
      {action}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfficeClearedPage() {
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('All Types');
  const [actionFilter, setActionFilter] = useState('All');

  const { data, loading, error, refetch } = useFetch<ClearedApiResponse>('/office/cleared');
  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);

  const documentTypes = useMemo(() => {
    const unique = Array.from(new Set(tasks.map((task) => task.document_type))).sort();
    return ['All Types', ...unique];
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
        t.requestor_name.toLowerCase().includes(search.toLowerCase());
      const matchDoc = docType === 'All Types' || t.document_type === docType;
      const matchAction = actionFilter === 'All' || t.task_status === actionFilter;
      return matchSearch && matchDoc && matchAction;
    });
  }, [tasks, search, docType, actionFilter]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Cleared Tasks
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          History of all requests your office has acted on.
        </p>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by tracking number or requestor…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
          <div className='flex shrink-0 gap-2'>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className='font-sans w-50'>
                <SelectValue placeholder='Document type' />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((t) => (
                  <SelectItem key={t} value={t} className='font-sans'>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className='font-sans w-[140px]'>
                <SelectValue placeholder='Action' />
              </SelectTrigger>
              <SelectContent>
                {['All', 'Cleared', 'Rejected'].map((a) => (
                  <SelectItem key={a} value={a} className='font-sans'>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <ClipboardList className='h-7 w-7 text-muted-foreground' />
              </div>
              <div>
                <p className='font-sans text-sm font-medium text-foreground'>Loading tasks...</p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>Please wait.</p>
              </div>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <AlertTriangle className='h-7 w-7 text-muted-foreground' />
              </div>
              <div>
                <p className='font-sans text-sm font-medium text-foreground'>Failed to load</p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>{error}</p>
                <Button variant='outline' size='sm' onClick={refetch} className='mt-4 gap-1.5'>
                  Try again
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <CheckSquare className='h-7 w-7 text-muted-foreground' />
              </div>
              <div>
                <p className='font-sans text-sm font-medium text-foreground'>No results found</p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>
                  {search || docType !== 'All Types' || actionFilter !== 'All'
                    ? 'Try adjusting your search or filters.'
                    : 'No cleared or rejected tasks yet.'}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-transparent'>
                  {[
                    'Tracking No.',
                    'Document Type',
                    'Requestor',
                    'Submitted',
                    'Action',
                    'Acted At',
                    '',
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className={cn(
                        'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        h === 'Tracking No.' && 'pl-6',
                        h === '' && 'pr-6',
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow key={task.task_id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs font-medium text-foreground'>
                        {task.tracking_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>
                        {task.document_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>
                        {task.requestor_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {formatDateOptional(task.created_at, '—')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <ActionBadge action={task.task_status} />
                        {task.remarks ? (
                          <p
                            className='font-sans max-w-[200px] truncate text-[11px] text-muted-foreground'
                            title={task.remarks}
                          >
                            {task.remarks}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock className='h-3 w-3 shrink-0' />
                        {task.cleared_at ? formatDateTime(task.cleared_at) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <Button asChild size='sm' variant='outline' className='gap-1.5'>
                        <Link href={`/office/requests/${task.tracking_number}`}>
                          View
                          <ArrowRight className='h-3.5 w-3.5' />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
