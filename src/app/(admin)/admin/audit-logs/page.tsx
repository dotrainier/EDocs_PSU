'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

const LOGS = [
  { id: '1', action: 'REQUEST_SUBMITTED', user: 'Juan Dela Cruz', role: 'Student', detail: 'Submitted TOR request EDC-2025-00421', ip: '192.168.1.10', timestamp: 'May 8, 2025 09:14:22', category: 'request' },
  { id: '2', action: 'CLEARANCE_CLEARED', user: 'Liza Aquino', role: 'OfficeStaff', detail: "Registrar's Office cleared EDC-2025-00421", ip: '192.168.1.25', timestamp: 'May 8, 2025 10:02:55', category: 'clearance' },
  { id: '3', action: 'PAYMENT_RECEIVED', user: 'Maria Santos', role: 'Student', detail: 'Payment of ₱150 received for EDC-2025-00420', ip: '192.168.1.11', timestamp: 'May 8, 2025 08:45:10', category: 'payment' },
  { id: '4', action: 'USER_LOGIN', user: 'Admin User', role: 'Admin', detail: 'Successful login from admin@psu.edu.ph', ip: '192.168.1.1', timestamp: 'May 8, 2025 08:00:01', category: 'auth' },
  { id: '5', action: 'REQUEST_REJECTED', user: 'Roberto Cruz', role: 'OfficeHead', detail: 'Rejected EDC-2025-00410 — incomplete documents', ip: '192.168.1.20', timestamp: 'May 7, 2025 15:33:44', category: 'request' },
  { id: '6', action: 'DOCUMENT_RELEASED', user: 'Liza Aquino', role: 'OfficeStaff', detail: 'Released Service Record for Ana Gomez (EDC-2025-00408)', ip: '192.168.1.25', timestamp: 'May 7, 2025 14:10:05', category: 'clearance' },
  { id: '7', action: 'USER_CREATED', user: 'Admin User', role: 'Admin', detail: 'Created new user account carlo.reyes@psu.edu.ph', ip: '192.168.1.1', timestamp: 'May 7, 2025 11:20:33', category: 'admin' },
  { id: '8', action: 'SLA_BREACHED', user: 'System', role: 'System', detail: 'SLA deadline breached for EDC-2025-00388', ip: 'internal', timestamp: 'May 7, 2025 00:00:01', category: 'system' },
  { id: '9', action: 'USER_LOGIN', user: 'Ana Reyes', role: 'OfficeStaff', detail: 'Successful login from ana.reyes@psu.edu.ph', ip: '192.168.1.55', timestamp: 'May 6, 2025 08:15:22', category: 'auth' },
  { id: '10', action: 'CLEARANCE_REJECTED', user: 'Carlos Mendoza', role: 'OfficeStaff', detail: 'Accounting rejected clearance for EDC-2025-00415 — unpaid balance', ip: '192.168.1.30', timestamp: 'May 6, 2025 13:44:10', category: 'clearance' },
  { id: '11', action: 'REQUEST_SUBMITTED', user: 'Roy Bautista', role: 'Student', detail: 'Submitted COE request EDC-2025-00377', ip: '192.168.1.88', timestamp: 'Apr 25, 2025 10:05:00', category: 'request' },
  { id: '12', action: 'PASSWORD_RESET', user: 'Admin User', role: 'Admin', detail: 'Password reset for patricia.gomez@psu.edu.ph', ip: '192.168.1.1', timestamp: 'Apr 20, 2025 09:00:00', category: 'admin' },
];

const CATEGORY_COLORS: Record<string, string> = {
  request: 'bg-blue-100 text-blue-700',
  clearance: 'bg-violet-100 text-violet-700',
  payment: 'bg-emerald-100 text-emerald-700',
  auth: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-amber-100 text-amber-700',
  system: 'bg-muted text-muted-foreground',
};

const CATEGORIES = ['All', 'request', 'clearance', 'payment', 'auth', 'admin', 'system'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() =>
    LOGS.filter((l) => {
      const matchSearch =
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.user.toLowerCase().includes(search.toLowerCase()) ||
        l.detail.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'All' || l.category === category;
      return matchSearch && matchCategory;
    }), [search, category]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>Audit Logs</h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          Immutable record of all system events and user actions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by action, user, or detail…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className='font-sans w-[160px] shrink-0'>
              <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className='font-sans capitalize'>{c === 'All' ? 'All Categories' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <ScrollText className='h-7 w-7 text-muted-foreground' />
              </div>
              <p className='font-sans text-sm text-muted-foreground'>No logs match your filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-transparent'>
                  {['Timestamp', 'Action', 'Category', 'User', 'Role', 'Detail', 'IP Address'].map((h) => (
                    <TableHead
                      key={h}
                      className={cn(
                        'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        h === 'Timestamp' && 'pl-6',
                        h === 'IP Address' && 'pr-6',
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-mono text-xs text-muted-foreground whitespace-nowrap'>{log.timestamp}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono text-xs font-semibold text-foreground'>{log.action}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className={cn('rounded-full px-2 text-[10px] capitalize', CATEGORY_COLORS[log.category])}>
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-foreground'>{log.user}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-xs text-muted-foreground'>{log.role}</span>
                    </TableCell>
                    <TableCell className='max-w-xs'>
                      <span className='font-sans text-sm text-muted-foreground line-clamp-2'>{log.detail}</span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <span className='font-mono text-xs text-muted-foreground'>{log.ip}</span>
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
