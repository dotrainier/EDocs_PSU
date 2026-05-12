'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ─── Static data ──────────────────────────────────────────────────────────────

const USERS = [
  { id: '1', name: 'Juan Dela Cruz', schoolId: '2021-00001', email: 'juan.delacruz@psu.edu.ph', role: 'Student', status: 'Active', created: 'Jan 10, 2025' },
  { id: '2', name: 'Maria Santos', schoolId: '2020-00045', email: 'maria.santos@psu.edu.ph', role: 'Student', status: 'Active', created: 'Jan 12, 2025' },
  { id: '3', name: 'Dr. Ana Reyes', schoolId: 'FAC-0021', email: 'ana.reyes@psu.edu.ph', role: 'Faculty', status: 'Active', created: 'Aug 5, 2024' },
  { id: '4', name: 'Carlos Mendoza', schoolId: 'STF-0008', email: 'carlos.mendoza@psu.edu.ph', role: 'NonTeachingStaff', status: 'Active', created: 'Mar 3, 2024' },
  { id: '5', name: 'Liza Aquino', schoolId: 'OFF-0003', email: 'liza.aquino@psu.edu.ph', role: 'OfficeStaff', status: 'Active', created: 'Feb 14, 2024' },
  { id: '6', name: 'Roberto Cruz', schoolId: 'OFF-0001', email: 'roberto.cruz@psu.edu.ph', role: 'OfficeHead', status: 'Active', created: 'Jan 2, 2024' },
  { id: '7', name: 'Patricia Gomez', schoolId: '2022-00312', email: 'patricia.gomez@psu.edu.ph', role: 'Student', status: 'Inactive', created: 'Jun 20, 2024' },
  { id: '8', name: 'Admin User', schoolId: 'ADM-0001', email: 'admin@psu.edu.ph', role: 'Admin', status: 'Active', created: 'Jan 1, 2024' },
  { id: '9', name: 'Prof. Mark Rivera', schoolId: 'FAC-0034', email: 'mark.rivera@psu.edu.ph', role: 'Faculty', status: 'Active', created: 'Jul 15, 2024' },
  { id: '10', name: 'Grace Villanueva', schoolId: '2023-00891', email: 'grace.villanueva@psu.edu.ph', role: 'Student', status: 'Active', created: 'Aug 28, 2024' },
];

const ROLE_COLORS: Record<string, string> = {
  Student: 'bg-blue-100 text-blue-700',
  Faculty: 'bg-violet-100 text-violet-700',
  NonTeachingStaff: 'bg-indigo-100 text-indigo-700',
  OfficeStaff: 'bg-amber-100 text-amber-700',
  OfficeHead: 'bg-orange-100 text-orange-700',
  Admin: 'bg-red-100 text-red-700',
};

const ROLES = ['All Roles', 'Student', 'Faculty', 'NonTeachingStaff', 'OfficeStaff', 'OfficeHead', 'Admin'];
const STATUSES = ['All', 'Active', 'Inactive'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [status, setStatus] = useState('All');

  const filtered = useMemo(() => {
    return USERS.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.schoolId.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = role === 'All Roles' || u.role === role;
      const matchStatus = status === 'All' || u.status === status;
      return matchSearch && matchRole && matchStatus;
    });
  }, [search, role, status]);

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>Users</h1>
          <p className='font-sans mt-1 text-sm text-muted-foreground'>
            {USERS.length} registered accounts
          </p>
        </div>
        <Button size='sm' className='gap-1.5'>
          <Plus className='h-4 w-4' />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name, ID, or email…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
          <div className='flex shrink-0 gap-2'>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className='font-sans w-[180px]'>
                <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
                <SelectValue placeholder='Role' />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className='font-sans'>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='font-sans w-[140px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className='font-sans'>{s}</SelectItem>
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
                {['Name', 'School ID', 'Email', 'Role', 'Status', 'Created', ''].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      h === 'Name' && 'pl-6',
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
                  <TableCell colSpan={7} className='py-16 text-center text-sm text-muted-foreground'>
                    No users match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                          {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className='font-sans text-sm font-medium text-foreground'>{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono text-xs text-muted-foreground'>{user.schoolId}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className={cn('rounded-full text-xs', ROLE_COLORS[user.role])}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', user.status === 'Active' ? 'text-emerald-600' : 'text-muted-foreground')}>
                        {user.status === 'Active'
                          ? <UserCheck className='h-3.5 w-3.5' />
                          : <UserX className='h-3.5 w-3.5' />}
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>{user.created}</span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Edit user</DropdownMenuItem>
                          <DropdownMenuItem>Reset password</DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive focus:text-destructive'>
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
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
