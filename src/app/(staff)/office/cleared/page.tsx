'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, CheckSquare, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
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
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type ActionTaken = 'Cleared' | 'Rejected';

interface ClearedTask {
  id: string;
  trackingNumber: string;
  documentType: string;
  requestorName: string;
  dateSubmitted: string;
  actionTaken: ActionTaken;
  actedAt: string;
  remarks?: string;
}

const MOCK_CLEARED: ClearedTask[] = [
  {
    id: 'req-021',
    trackingNumber: 'REQ-2025-00421',
    documentType: 'Transcript of Records',
    requestorName: 'Juan Dela Cruz',
    dateSubmitted: 'May 2, 2025',
    actionTaken: 'Cleared',
    actedAt: 'May 4, 2025 · 10:34 AM',
  },
  {
    id: 'req-018',
    trackingNumber: 'REQ-2025-00418',
    documentType: 'Certificate of Enrollment',
    requestorName: 'Ana Reyes',
    dateSubmitted: 'May 1, 2025',
    actionTaken: 'Cleared',
    actedAt: 'May 4, 2025 · 9:51 AM',
  },
  {
    id: 'req-015',
    trackingNumber: 'REQ-2025-00415',
    documentType: 'Diploma',
    requestorName: 'Pedro Bautista',
    dateSubmitted: 'Apr 30, 2025',
    actionTaken: 'Rejected',
    actedAt: 'May 4, 2025 · 9:22 AM',
    remarks: 'Incomplete supporting documents submitted.',
  },
  {
    id: 'req-409',
    trackingNumber: 'REQ-2025-00409',
    documentType: 'Certificate of Graduation',
    requestorName: 'Rosa Santos',
    dateSubmitted: 'Apr 29, 2025',
    actionTaken: 'Cleared',
    actedAt: 'May 3, 2025 · 4:10 PM',
  },
  {
    id: 'req-401',
    trackingNumber: 'REQ-2025-00401',
    documentType: 'Transcript of Records',
    requestorName: 'Carlo Mendoza',
    dateSubmitted: 'Apr 28, 2025',
    actionTaken: 'Cleared',
    actedAt: 'May 3, 2025 · 2:55 PM',
  },
  {
    id: 'req-395',
    trackingNumber: 'REQ-2025-00395',
    documentType: 'Good Moral Certificate',
    requestorName: 'Liza Flores',
    dateSubmitted: 'Apr 27, 2025',
    actionTaken: 'Rejected',
    actedAt: 'May 2, 2025 · 11:08 AM',
    remarks: 'Student has an existing academic case under review.',
  },
  {
    id: 'req-388',
    trackingNumber: 'REQ-2025-00388',
    documentType: 'Certificate of Enrollment',
    requestorName: 'Marco Villanueva',
    dateSubmitted: 'Apr 26, 2025',
    actionTaken: 'Cleared',
    actedAt: 'May 2, 2025 · 9:40 AM',
  },
];

const DOCUMENT_TYPES = [
  'All Types',
  'Transcript of Records',
  'Certificate of Enrollment',
  'Certificate of Graduation',
  'Diploma',
  'Good Moral Certificate',
];

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

  const filtered = MOCK_CLEARED.filter((t) => {
    const matchSearch =
      t.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.requestorName.toLowerCase().includes(search.toLowerCase());
    const matchDoc = docType === 'All Types' || t.documentType === docType;
    const matchAction = actionFilter === 'All' || t.actionTaken === actionFilter;
    return matchSearch && matchDoc && matchAction;
  });

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
              <SelectTrigger className='font-sans w-[200px]'>
                <SelectValue placeholder='Document type' />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
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
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <CheckSquare className='h-7 w-7 text-muted-foreground' />
              </div>
              <div>
                <p className='font-sans text-sm font-medium text-foreground'>No results found</p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>
                  Try adjusting your search or filters.
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
                  <TableRow key={task.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs font-medium text-foreground'>
                        {task.trackingNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>{task.documentType}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>
                        {task.requestorName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {task.dateSubmitted}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <ActionBadge action={task.actionTaken} />
                        {task.remarks && (
                          <p
                            className='font-sans max-w-[200px] truncate text-[11px] text-muted-foreground'
                            title={task.remarks}
                          >
                            {task.remarks}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock className='h-3 w-3 shrink-0' />
                        {task.actedAt}
                      </span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <Button asChild size='sm' variant='outline' className='gap-1.5'>
                        <Link href={`/office/request/${task.id}`}>
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
