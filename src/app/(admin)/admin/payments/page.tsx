'use client';

import { Wallet, AlertTriangle, CheckCircle2, Receipt, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentsResponse {
  totals: {
    collected: number;
    outstanding: number;
    paidCount: number;
    unpaidCount: number;
  };
  byDocumentType: Array<{
    documentTypeId: number;
    name: string;
    code: string;
    paidCount: number;
    paidAmount: number;
    unpaidCount: number;
    unpaidAmount: number;
  }>;
}

function peso(amount: number) {
  return `₱${amount.toFixed(2)}`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  bgClass,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
  description?: string;
}) {
  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='px-5 pb-4 pt-5'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {title}
            </p>
            <p className='font-heading mt-1.5 text-3xl font-bold text-foreground'>{value}</p>
            {description && (
              <p className='font-sans mt-1 text-xs text-muted-foreground'>{description}</p>
            )}
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

export default function AdminPaymentsPage() {
  const { data, loading, error, refetch } = useFetch<PaymentsResponse>('/admin/payments');

  if (loading) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <div className='h-8 w-56 animate-pulse rounded-lg bg-muted' />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className='h-28 animate-pulse rounded-lg bg-muted' />
            ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='space-y-6 p-6 lg:p-8'>
        <Alert variant='destructive'>
          <AlertDescription>
            {error || 'No data returned'}{' '}
            <button onClick={refetch} className='font-medium underline hover:no-underline'>
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { totals, byDocumentType } = data;
  const totalRequests = totals.paidCount + totals.unpaidCount;
  const collectionRate = totalRequests === 0 ? 0 : Math.round((totals.paidCount / totalRequests) * 100);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>Payments</h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          Live snapshot of fees collected and outstanding across all document requests
        </p>
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Total Collected'
          value={peso(totals.collected)}
          icon={Wallet}
          iconClass='text-emerald-600'
          bgClass='bg-emerald-100'
          description={`${totals.paidCount} paid request${totals.paidCount === 1 ? '' : 's'}`}
        />
        <StatCard
          title='Total Outstanding'
          value={peso(totals.outstanding)}
          icon={AlertTriangle}
          iconClass='text-red-600'
          bgClass='bg-red-100'
          description={`${totals.unpaidCount} unpaid request${totals.unpaidCount === 1 ? '' : 's'}`}
        />
        <StatCard
          title='Paid Requests'
          value={String(totals.paidCount)}
          icon={CheckCircle2}
          iconClass='text-blue-600'
          bgClass='bg-blue-100'
          description={`${collectionRate}% of all requests`}
        />
        <StatCard
          title='Unpaid Requests'
          value={String(totals.unpaidCount)}
          icon={Receipt}
          iconClass='text-amber-600'
          bgClass='bg-amber-100'
          description='Awaiting payment confirmation'
        />
      </div>

      {/* Breakdown by document type */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
            <PieChart className='h-4 w-4 text-primary' />
            Revenue by Document Type
          </CardTitle>
          <p className='font-sans mt-1 text-xs text-muted-foreground'>
            All-time paid vs. unpaid, by document type
          </p>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                {['Document Type', 'Paid', 'Unpaid', 'Collection Rate'].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      h === 'Document Type' && 'pl-6',
                      h === 'Collection Rate' && 'pr-6',
                    )}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {byDocumentType.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='py-16 text-center text-sm text-muted-foreground'>
                    No document types configured yet.
                  </TableCell>
                </TableRow>
              ) : (
                byDocumentType.map((doc) => {
                  const docTotal = doc.paidCount + doc.unpaidCount;
                  const rate = docTotal === 0 ? 0 : Math.round((doc.paidCount / docTotal) * 100);
                  return (
                    <TableRow key={doc.documentTypeId} className='border-border'>
                      <TableCell className='pl-6'>
                        <div className='flex items-center gap-2'>
                          <span className='font-sans text-sm font-medium text-foreground'>
                            {doc.name}
                          </span>
                          <span className='font-mono rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground'>
                            {doc.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-sans text-sm text-foreground'>{peso(doc.paidAmount)}</span>
                        <span className='font-sans ml-1.5 text-xs text-muted-foreground'>
                          ({doc.paidCount})
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='font-sans text-sm text-foreground'>
                          {peso(doc.unpaidAmount)}
                        </span>
                        <span className='font-sans ml-1.5 text-xs text-muted-foreground'>
                          ({doc.unpaidCount})
                        </span>
                      </TableCell>
                      <TableCell className='pr-6'>
                        <div className='flex items-center gap-2'>
                          <div className='h-2 w-24 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full rounded-full bg-emerald-500 transition-all'
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className='font-sans text-xs text-muted-foreground'>{rate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
