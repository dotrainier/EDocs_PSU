'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
  MoreHorizontal,
  Loader2,
  Clock,
  ShieldCheck,
  ShieldX,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/lib/axios';
import { UserDetailSheet, type VerificationStatus } from '../_components/UserDetailSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  full_name: string;
  school_id: string | null;
  email: string;
  role_name: string;
  status: string;
  student_type: string | null;
  verification_status: string;
  created_at: string;
};

const ROLE_COLORS: Record<string, string> = {
  Student: 'bg-blue-100 text-blue-700',
  Faculty: 'bg-violet-100 text-violet-700',
  NonTeachingStaff: 'bg-indigo-100 text-indigo-700',
  OfficeStaff: 'bg-amber-100 text-amber-700',
  OfficeHead: 'bg-orange-100 text-orange-700',
  Admin: 'bg-red-100 text-red-700',
};

const ROLES = [
  'All Roles',
  'Student',
  'Faculty',
  'NonTeachingStaff',
  'OfficeStaff',
  'OfficeHead',
  'Admin',
];
const STATUSES = ['All', 'active', 'inactive'];
const VERIFICATIONS = ['All', 'pending', 'approved', 'rejected'];

const VERIFICATION_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  pending: { icon: Clock, className: 'text-amber-600' },
  approved: { icon: ShieldCheck, className: 'text-emerald-600' },
  rejected: { icon: ShieldX, className: 'text-destructive' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [status, setStatus] = useState('All');
  const [verification, setVerification] = useState('All');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get<{ users: UserRow[] }>('/admin/users')
      .then((res) => {
        if (active) setUsers(res.users);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to load users.';
        setLoadError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (u.school_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = role === 'All Roles' || u.role_name === role;
      const matchStatus = status === 'All' || u.status === status;
      const matchVerification = verification === 'All' || u.verification_status === verification;
      return matchSearch && matchRole && matchStatus && matchVerification;
    });
  }, [users, search, role, status, verification]);

  function openDetails(userId: string) {
    setDetailUserId(userId);
    setDetailOpen(true);
  }

  async function updateVerification(userId: string, newStatus: VerificationStatus) {
    setActionError('');
    setActionLoadingId(userId);
    try {
      await api.patch(`/admin/users/${userId}`, { verification_status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, verification_status: newStatus } : u)),
      );
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to update verification status.';
      setActionError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>Users</h1>
          <p className='font-sans mt-1 text-sm text-muted-foreground'>
            {users.length} registered accounts
          </p>
        </div>
      </div>

      {loadError && (
        <Alert variant='destructive'>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant='destructive'>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

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
          <div className='flex shrink-0 flex-wrap gap-2'>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className='font-sans w-42.5'>
                <SlidersHorizontal className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
                <SelectValue placeholder='Role' />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className='font-sans'>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='font-sans w-32.5'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className='font-sans capitalize'>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={verification} onValueChange={setVerification}>
              <SelectTrigger className='font-sans w-37.5'>
                <SelectValue placeholder='Verification' />
              </SelectTrigger>
              <SelectContent>
                {VERIFICATIONS.map((v) => (
                  <SelectItem key={v} value={v} className='font-sans capitalize'>
                    {v === 'All' ? 'All Verification' : v}
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
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                {['Name', 'School ID', 'Email', 'Role', 'Status', 'Verification', 'Registered', ''].map(
                  (h) => (
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
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className='py-16 text-center text-sm text-muted-foreground'>
                    <Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />
                    Loading users…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='py-16 text-center text-sm text-muted-foreground'>
                    No users match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const verificationStyle =
                    VERIFICATION_STYLES[user.verification_status] ?? VERIFICATION_STYLES.pending;
                  const VerificationIcon = verificationStyle.icon;
                  return (
                    <TableRow key={user.id} className='border-border'>
                      <TableCell className='pl-6'>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                            {user.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <span className='font-sans text-sm font-medium text-foreground'>
                            {user.full_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {user.school_id ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='font-sans text-sm text-muted-foreground'>{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='secondary'
                          className={cn('rounded-full text-xs', ROLE_COLORS[user.role_name])}
                        >
                          {user.role_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-medium capitalize',
                            user.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground',
                          )}
                        >
                          {user.status === 'active' ? (
                            <UserCheck className='h-3.5 w-3.5' />
                          ) : (
                            <UserX className='h-3.5 w-3.5' />
                          )}
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-medium capitalize',
                            verificationStyle.className,
                          )}
                        >
                          {actionLoadingId === user.id ? (
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                          ) : (
                            <VerificationIcon className='h-3.5 w-3.5' />
                          )}
                          {user.verification_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='font-sans text-sm text-muted-foreground'>
                          {formatDate(user.created_at)}
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
                            <DropdownMenuItem onClick={() => openDetails(user.id)}>
                              View details
                            </DropdownMenuItem>
                            {user.verification_status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  disabled={actionLoadingId === user.id}
                                  onClick={() => updateVerification(user.id, 'approved')}
                                >
                                  <Check className='text-emerald-600' />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={actionLoadingId === user.id}
                                  className='text-destructive focus:text-destructive'
                                  onClick={() => updateVerification(user.id, 'rejected')}
                                >
                                  <X />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserDetailSheet
        userId={detailUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={(userId, newStatus) =>
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, verification_status: newStatus } : u)),
          )
        }
      />
    </div>
  );
}
