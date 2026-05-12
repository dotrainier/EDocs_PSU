'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

// ─── Static data ──────────────────────────────────────────────────────────────

const REQUESTS = [
  { id: '1', tracking: 'EDC-2025-00421', requester: 'Juan Dela Cruz', docType: 'Transcript of Records', status: 'Pending Clearance', payment: 'Paid', submitted: 'May 8, 2025', sla: 'On Track' },
  { id: '2', tracking: 'EDC-2025-00420', requester: 'Maria Santos', docType: 'Certificate of Enrollment', status: 'Processing', payment: 'Paid', submitted: 'May 8, 2025', sla: 'On Track' },
  { id: '3', tracking: 'EDC-2025-00419', requester: 'Grace Villanueva', docType: 'Good Moral Certificate', status: 'Ready for Release', payment: 'Paid', submitted: 'May 7, 2025', sla: 'On Track' },
  { id: '4', tracking: 'EDC-2025-00418', requester: 'Carlo Reyes', docType: 'Clearance', status: 'Released', payment: 'Free', submitted: 'May 6, 2025', sla: 'On Track' },
  { id: '5', tracking: 'EDC-2025-00415', requester: 'Patricia Gomez', docType: 'Transcript of Records', status: 'Pending Clearance', payment: 'Unpaid', submitted: 'May 5, 2025', sla: 'At Risk' },
  { id: '6', tracking: 'EDC-2025-00410', requester: 'Lito Ramos', docType: 'Honorable Dismissal', status: 'Rejected', payment: 'Paid', submitted: 'May 3, 2025', sla: 'Breached' },
  { id: '7', tracking: 'EDC-2025-00408', requester: 'Ana Gomez', docType: 'Service Record', status: 'Released', payment: 'Paid', submitted: 'May 2, 2025', sla: 'On Track' },
  { id: '8', tracking: 'EDC-2025-00405', requester: 'Ben Aquino', docType: 'COR', status: 'Released', payment: 'Free', submitted: 'May 1, 2025', sla: 'On Track' },
  { id: '9', tracking: 'EDC-2025-00388', requester: 'Nina Cruz', docType: 'Transcript of Records', status: 'Pending Clearance', payment: 'Paid', submitted: 'Apr 28, 2025', sla: 'Breached' },
  { id: '10', tracking: 'EDC-2025-00377', requester: 'Roy Bautista', docType: 'Certificate of Enrollment', status: 'Processing', payment: 'Paid', submitted: 'Apr 25, 2025', sla: 'At Risk' },
];

const STATUS_COLORS: Record<string, string> = {
  'Pending Clearance': 'bg-amber-100 text-amber-700',
  'Processing': 'bg-blue-100 text-blue-700',
  'Ready for Release': 'bg-violet-100 text-violet-700',
  'Released': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Cancelled': 'bg-muted text-muted-foreground',
};

const SLA_COLORS: Record<string, string> = {
  'On Track': 'text-emerald-600',
  'At Risk': 'text-amber-600',
  'Breached': 'text-red-600',
};

const PAYMENT_COLORS: Record<string, string> = {
  'Paid': 'bg-emerald-100 text-emerald-700',
  'Unpaid': 'bg-red-100 text-red-700',
  'Free': 'bg-muted text-muted-foreground',
};

const STATUSES = ['All Statuses', 'Pending Clearance', 'Processing', 'Ready for Release', 'Released', 'Rejected', 'Cancelled'];
const PAYMENTS = ['All', 'Paid', 'Unpaid', 'Free'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [payment, setPayment] = useState('All');

  const filtered = useMemo(() =>
    REQUESTS.filter((r) => {
      const matchSearch =
        r.tracking.toLowerCase().includes(search.toLowerCase()) ||
        r.requester.toLowerCase().includes(search.toLowerCase()) ||
        r.docType.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === 'All Statuses' || r.status === status;
      const matchPayment = payment === 'All' || r.payment === payment;
      return matchSearch && matchStatus && matchPayment;
    }), [search, status, payment]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>All Requests</h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          System-wide view of all document requests
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by tracking number, requester, or document…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
          <div className='flex shrink-0 gap-2'>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='font-sans w-[200px]'>
                <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className='font-sans'>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className='font-sans w-[140px]'>
                <SelectValue placeholder='Payment' />
              </SelectTrigger>
              <SelectContent>
                {PAYMENTS.map((p) => (
                  <SelectItem key={p} value={p} className='font-sans'>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                {['Tracking No.', 'Requester', 'Document Type', 'Status', 'Payment', 'SLA', 'Submitted', ''].map((h) => (
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='py-16 text-center text-sm text-muted-foreground'>
                    No requests match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow key={req.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs font-medium text-foreground'>{req.tracking}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>{req.requester}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>{req.docType}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className={cn('rounded-full text-xs', STATUS_COLORS[req.status] ?? '')}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className={cn('rounded-full text-xs', PAYMENT_COLORS[req.payment] ?? '')}>
                        {req.payment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-sans text-xs font-medium', SLA_COLORS[req.sla] ?? '')}>
                        {req.sla}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>{req.submitted}</span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <Button variant='outline' size='sm' className='gap-1.5'>
                        View
                        <ArrowRight className='h-3.5 w-3.5' />
                      </Button>
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
