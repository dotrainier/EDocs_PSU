'use client';

import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Loader2, FileStack } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { api } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestRow = {
  id: string;
  tracking_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  document_type: string;
  requester_name: string;
};

const STATUSES = [
  'All Statuses',
  'Pending',
  'In Process',
  'Action Required',
  'Ready for Release',
  'Released',
  'Cancelled',
];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  'In Process': 'bg-blue-100 text-blue-700',
  'Action Required': 'bg-red-100 text-red-700',
  'Ready for Release': 'bg-violet-100 text-violet-700',
  Released: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-muted text-muted-foreground',
};

const PAYMENT_COLORS: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Unpaid: 'bg-red-100 text-red-700',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [status, setStatus] = useState('All Statuses');
  const [documentType, setDocumentType] = useState('All Types');

  useEffect(() => {
    let active = true;
    api
      .get<{ requests: RequestRow[] }>('/admin/requests')
      .then((res) => {
        if (active) setRequests(res.requests);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to load requests.';
        setLoadError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const documentTypes = useMemo(
    () => ['All Types', ...Array.from(new Set(requests.map((r) => r.document_type))).sort()],
    [requests],
  );

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = status === 'All Statuses' || r.status === status;
      const matchDocType = documentType === 'All Types' || r.document_type === documentType;
      return matchStatus && matchDocType;
    });
  }, [requests, status, documentType]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          All Requests
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          System-wide view of all document requests
        </p>
      </div>

      {loadError && (
        <Alert variant='destructive'>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className='font-sans w-full sm:w-50'>
              <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className='font-sans'>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className='font-sans w-full sm:w-55'>
              <SelectValue placeholder='Document Type' />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((d) => (
                <SelectItem key={d} value={d} className='font-sans'>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                {['Tracking No.', 'Requester', 'Document Type', 'Status', 'Payment', 'Submitted'].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className={cn(
                        'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        h === 'Tracking No.' && 'pl-6',
                        h === 'Submitted' && 'pr-6',
                      )}
                    >
                      {h}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-16 text-center text-sm text-muted-foreground'>
                    <Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />
                    Loading requests…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-16 text-center text-sm text-muted-foreground'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                        <FileStack className='h-7 w-7 text-muted-foreground' />
                      </div>
                      {requests.length === 0
                        ? 'No document requests yet.'
                        : 'No requests match your filters.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow key={req.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs font-medium text-foreground'>
                        {req.tracking_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>{req.requester_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {req.document_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='secondary'
                        className={cn('rounded-full text-xs', STATUS_COLORS[req.status] ?? '')}
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='secondary'
                        className={cn(
                          'rounded-full text-xs',
                          PAYMENT_COLORS[req.payment_status] ?? '',
                        )}
                      >
                        {req.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {formatDate(req.created_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
