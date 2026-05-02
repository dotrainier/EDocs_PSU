'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileStack, Filter, ChevronRight, Eye, Download, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus =
  | 'Pending'
  | 'In Process'
  | 'Action Required'
  | 'Ready for Release'
  | 'Released'
  | 'Cancelled';

interface RequestRecord {
  trackingNo: string;
  documentType: string;
  dateFiled: string;
  status: RequestStatus;
  copies: number;
  purpose: string;
  issuingOffice: string;
  hasDownload: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: RequestRecord[] = [
  {
    trackingNo: 'EDOC-2026-000123',
    documentType: 'Transcript of Records',
    dateFiled: 'April 25, 2026',
    status: 'In Process',
    copies: 2,
    purpose: 'Employment',
    issuingOffice: "Registrar's Office",
    hasDownload: false,
  },
  {
    trackingNo: 'EDOC-2026-000115',
    documentType: 'Certificate of Enrollment',
    dateFiled: 'April 18, 2026',
    status: 'Released',
    copies: 1,
    purpose: 'Scholarship Application',
    issuingOffice: "Registrar's Office",
    hasDownload: true,
  },
  {
    trackingNo: 'EDOC-2026-000098',
    documentType: 'Certificate of Good Moral',
    dateFiled: 'April 10, 2026',
    status: 'Action Required',
    copies: 1,
    purpose: 'Government Requirement',
    issuingOffice: 'Student Affairs Office',
    hasDownload: false,
  },
  {
    trackingNo: 'EDOC-2026-000082',
    documentType: 'Certificate of Grades',
    dateFiled: 'March 28, 2026',
    status: 'Ready for Release',
    copies: 2,
    purpose: 'Board Examination',
    issuingOffice: "Registrar's Office",
    hasDownload: true,
  },
  {
    trackingNo: 'EDOC-2026-000071',
    documentType: 'Certificate of Enrollment',
    dateFiled: 'March 15, 2026',
    status: 'Released',
    copies: 1,
    purpose: 'Loan Application',
    issuingOffice: "Registrar's Office",
    hasDownload: true,
  },
  {
    trackingNo: 'EDOC-2026-000054',
    documentType: 'Transcript of Records',
    dateFiled: 'February 20, 2026',
    status: 'Cancelled',
    copies: 1,
    purpose: 'Personal Record',
    issuingOffice: "Registrar's Office",
    hasDownload: false,
  },
];

const ALL_STATUSES: RequestStatus[] = [
  'Pending',
  'In Process',
  'Action Required',
  'Ready for Release',
  'Released',
  'Cancelled',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    'In Process': 'bg-blue-50 text-blue-700 border-blue-200',
    'Action Required': 'bg-red-50 text-red-700 border-red-200',
    'Ready for Release': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Released: 'bg-purple-50 text-purple-700 border-purple-200',
    Cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_REQUESTS.filter((r) => {
      const matchesSearch =
        search === '' ||
        r.trackingNo.toLowerCase().includes(search.toLowerCase()) ||
        r.documentType.toLowerCase().includes(search.toLowerCase()) ||
        r.purpose.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const hasActiveFilters = search !== '' || statusFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
  }

  return (
    <div className='space-y-6'>
      {/* Breadcrumb */}
      <nav className='flex items-center gap-1.5 text-sm text-muted-foreground'>
        <Link href='/dashboard' className='hover:text-foreground transition-colors'>
          Dashboard
        </Link>
        <ChevronRight className='h-3.5 w-3.5' />
        <span className='text-foreground font-medium'>My Requests</span>
      </nav>

      {/* Page header */}
      <div>
        <h1
          className='text-2xl font-bold tracking-tight text-foreground'
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          My Requests
        </h1>
        <p className='text-sm text-muted-foreground mt-1'>
          View and track all your document requests.
        </p>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by tracking number, document type, or purpose…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-44 gap-2'>
              <Filter className='h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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
      <p className='text-xs text-muted-foreground'>
        Showing <span className='font-medium text-foreground'>{filtered.length}</span> of{' '}
        <span className='font-medium text-foreground'>{MOCK_REQUESTS.length}</span> requests
      </p>

      {/* Table — desktop */}
      <Card className='hidden md:block overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/40 hover:bg-muted/40'>
              {['Tracking No.', 'Document Type', 'Date Filed', 'Purpose', 'Status', ''].map((h) => (
                <TableHead
                  key={h}
                  className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='py-16 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <FileStack className='h-8 w-8 text-muted-foreground/40' />
                    <p className='text-sm font-medium text-muted-foreground'>No requests found</p>
                    {hasActiveFilters && (
                      <button
                        type='button'
                        onClick={clearFilters}
                        className='text-xs text-primary hover:underline'
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => (
                <TableRow key={req.trackingNo} className='group'>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {req.trackingNo}
                  </TableCell>
                  <TableCell className='text-sm font-medium text-foreground'>
                    {req.documentType}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>{req.dateFiled}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>{req.purpose}</TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                      {req.hasDownload && (
                        <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
                          <a href='#' download>
                            <Download className='h-3.5 w-3.5' />
                            <span className='sr-only'>Download</span>
                          </a>
                        </Button>
                      )}
                      <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
                        <Link href={`/request/${req.trackingNo}`}>
                          <Eye className='h-3.5 w-3.5' />
                          <span className='sr-only'>View</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Card list — mobile */}
      <div className='space-y-3 md:hidden'>
        {filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center'>
            <FileStack className='mb-2 h-8 w-8 text-muted-foreground/40' />
            <p className='text-sm font-medium text-muted-foreground'>No requests found</p>
            {hasActiveFilters && (
              <button
                type='button'
                onClick={clearFilters}
                className='mt-1 text-xs text-primary hover:underline'
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((req) => (
            <Card key={req.trackingNo} className='px-4 py-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1 space-y-1'>
                  <p className='text-sm font-semibold text-foreground'>{req.documentType}</p>
                  <p className='font-mono text-xs text-muted-foreground'>{req.trackingNo}</p>
                  <p className='text-xs text-muted-foreground'>
                    {req.dateFiled} · {req.purpose}
                  </p>
                  <div className='pt-1'>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
                <div className='flex shrink-0 flex-col items-end gap-1'>
                  <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
                    <Link href={`/request/${req.trackingNo}`}>
                      <Eye className='h-4 w-4' />
                      <span className='sr-only'>View</span>
                    </Link>
                  </Button>
                  {req.hasDownload && (
                    <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
                      <a href='#' download>
                        <Download className='h-4 w-4' />
                        <span className='sr-only'>Download</span>
                      </a>
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
