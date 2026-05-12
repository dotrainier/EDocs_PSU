'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ─── Static data ──────────────────────────────────────────────────────────────

const OFFICES = [
  { id: '1', name: "Registrar's Office", code: 'REG', staff: 4, pendingTasks: 12, isActive: true },
  { id: '2', name: "Dean's Office - CCS", code: 'DCCS', staff: 2, pendingTasks: 5, isActive: true },
  { id: '3', name: 'Accounting Office', code: 'ACCT', staff: 3, pendingTasks: 8, isActive: true },
  { id: '4', name: 'Library', code: 'LIB', staff: 2, pendingTasks: 3, isActive: true },
  { id: '5', name: 'NSTP Office', code: 'NSTP', staff: 1, pendingTasks: 1, isActive: true },
  {
    id: '6',
    name: 'Student Affairs Office',
    code: 'SAO',
    staff: 2,
    pendingTasks: 6,
    isActive: true,
  },
  { id: '7', name: 'Guidance Office', code: 'GUID', staff: 1, pendingTasks: 0, isActive: true },
  { id: '8', name: 'Health Services', code: 'HLTH', staff: 2, pendingTasks: 2, isActive: true },
  { id: '9', name: 'Athletics Office', code: 'ATH', staff: 1, pendingTasks: 0, isActive: false },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOfficesPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      OFFICES.filter(
        (o) =>
          o.name.toLowerCase().includes(search.toLowerCase()) ||
          o.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const activeCount = OFFICES.filter((o) => o.isActive).length;

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
            Offices
          </h1>
          <p className='font-sans mt-1 text-sm text-muted-foreground'>
            {activeCount} active offices participating in clearance workflows
          </p>
        </div>
        <Button size='sm' className='gap-1.5'>
          <Plus className='h-4 w-4' />
          Add Office
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className='px-5 py-4'>
          <div className='relative max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search offices…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                {['Office Name', 'Code', 'Staff Count', 'Pending Tasks', 'Status', ''].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      h === 'Office Name' && 'pl-6',
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
                  <TableCell
                    colSpan={6}
                    className='py-16 text-center text-sm text-muted-foreground'
                  >
                    No offices match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((office) => (
                  <TableRow key={office.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-sans text-sm font-medium text-foreground'>
                        {office.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
                        {office.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {office.staff}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'font-sans text-sm font-medium',
                          office.pendingTasks === 0
                            ? 'text-muted-foreground'
                            : office.pendingTasks > 5
                              ? 'text-red-600'
                              : 'text-amber-600',
                        )}
                      >
                        {office.pendingTasks}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium',
                          office.isActive ? 'text-emerald-600' : 'text-muted-foreground',
                        )}
                      >
                        {office.isActive ? (
                          <CheckCircle2 className='h-3.5 w-3.5' />
                        ) : (
                          <XCircle className='h-3.5 w-3.5' />
                        )}
                        {office.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>View staff</DropdownMenuItem>
                          <DropdownMenuItem>Edit office</DropdownMenuItem>
                          <DropdownMenuItem>Assign staff</DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive focus:text-destructive'>
                            {office.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
