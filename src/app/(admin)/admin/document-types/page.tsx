'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const DOCUMENT_TYPES = [
  {
    id: '1',
    name: 'Transcript of Records',
    code: 'TOR',
    issuingOffice: "Registrar's Office",
    fee: 150,
    slaDays: 5,
    requiresClearance: true,
    availableTo: ['Student', 'Alumni'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Certificate of Enrollment',
    code: 'COE',
    issuingOffice: "Registrar's Office",
    fee: 50,
    slaDays: 3,
    requiresClearance: false,
    availableTo: ['Student'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Good Moral Certificate',
    code: 'GMC',
    issuingOffice: 'Guidance Office',
    fee: 50,
    slaDays: 3,
    requiresClearance: false,
    availableTo: ['Student'],
    isActive: true,
  },
  {
    id: '4',
    name: 'Clearance',
    code: 'CLR',
    issuingOffice: "Registrar's Office",
    fee: 0,
    slaDays: 7,
    requiresClearance: true,
    availableTo: ['Student', 'Faculty', 'NonTeachingStaff'],
    isActive: true,
  },
  {
    id: '5',
    name: 'Service Record',
    code: 'SRV',
    issuingOffice: 'HR Office',
    fee: 75,
    slaDays: 5,
    requiresClearance: false,
    availableTo: ['Faculty', 'NonTeachingStaff'],
    isActive: true,
  },
  {
    id: '6',
    name: 'Class Schedule / COR',
    code: 'COR',
    issuingOffice: "Registrar's Office",
    fee: 0,
    slaDays: 1,
    requiresClearance: false,
    availableTo: ['Student'],
    isActive: true,
  },
  {
    id: '7',
    name: 'Honorable Dismissal',
    code: 'HOD',
    issuingOffice: "Registrar's Office",
    fee: 100,
    slaDays: 5,
    requiresClearance: true,
    availableTo: ['Student'],
    isActive: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDocumentTypesPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    DOCUMENT_TYPES.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
    ), [search]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>Document Types</h1>
          <p className='font-sans mt-1 text-sm text-muted-foreground'>
            {DOCUMENT_TYPES.filter((d) => d.isActive).length} active document types configured
          </p>
        </div>
        <Button size='sm' className='gap-1.5'>
          <Plus className='h-4 w-4' />
          Add Document Type
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className='px-5 py-4'>
          <div className='relative max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search document types…'
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
                {['Document Name', 'Code', 'Issuing Office', 'Fee', 'SLA (days)', 'Clearance', 'Available To', 'Status', ''].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      h === 'Document Name' && 'pl-6',
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
                  <TableCell colSpan={9} className='py-16 text-center text-sm text-muted-foreground'>
                    No document types match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc) => (
                  <TableRow key={doc.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-sans text-sm font-medium text-foreground'>{doc.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
                        {doc.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>{doc.issuingOffice}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm font-medium text-foreground'>
                        {doc.fee === 0 ? (
                          <span className='text-emerald-600'>Free</span>
                        ) : (
                          `₱${doc.fee}`
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>{doc.slaDays}d</span>
                    </TableCell>
                    <TableCell>
                      {doc.requiresClearance ? (
                        <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                      ) : (
                        <XCircle className='h-4 w-4 text-muted-foreground' />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {doc.availableTo.map((role) => (
                          <Badge key={role} variant='secondary' className='rounded-full px-1.5 py-0 text-[10px]'>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', doc.isActive ? 'text-emerald-600' : 'text-muted-foreground')}>
                        {doc.isActive
                          ? <CheckCircle2 className='h-3.5 w-3.5' />
                          : <XCircle className='h-3.5 w-3.5' />}
                        {doc.isActive ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Manage clearance steps</DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive focus:text-destructive'>
                            {doc.isActive ? 'Deactivate' : 'Activate'}
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
