'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, Check, X, UserCheck, UserRoundX, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';
import { UserDetailSheet, type VerificationStatus } from '../_components/UserDetailSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingUser = {
  id: string;
  full_name: string;
  school_id: string | null;
  email: string;
  student_type: string | null;
  year_level: string | null;
  year_graduated: number | null;
  course_name: string | null;
  course_major: string | null;
  course_code: string | null;
  course_other_note: string | null;
  created_at: string;
};

function shortCourse(user: Pick<PendingUser, 'course_code' | 'course_other_note'>) {
  if (user.course_code) return user.course_code;
  if (user.course_other_note) return user.course_other_note;
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminVerificationPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get<{ users: PendingUser[] }>('/admin/users?verification_status=pending')
      .then((res) => {
        if (active) setPendingUsers(res.users);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to load pending registrations.';
        setLoadError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      pendingUsers.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (u.school_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [pendingUsers, search],
  );

  function removeFromQueue(userId: string) {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function openDetails(userId: string) {
    setDetailUserId(userId);
    setDetailOpen(true);
  }

  async function decide(userId: string, newStatus: VerificationStatus) {
    setActionError('');
    setActionLoadingId(userId);
    try {
      await api.patch(`/admin/users/${userId}`, { verification_status: newStatus });
      removeFromQueue(userId);
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
    <div className='space-y-5 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Pending Registrations
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          {loading
            ? 'Loading…'
            : `${pendingUsers.length} ${pendingUsers.length === 1 ? 'registration is' : 'registrations are'} waiting for your review`}
        </p>
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

      {!loading && pendingUsers.length > 0 && (
        <div className='relative max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by name, ID, or email…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='font-sans pl-9'
          />
        </div>
      )}

      {loading ? (
        <div className='flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span className='font-sans text-sm'>Loading pending registrations…</span>
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100'>
              <ClipboardCheck className='h-7 w-7 text-emerald-600' />
            </div>
            <div>
              <p className='font-heading text-base font-semibold text-foreground'>All caught up</p>
              <p className='font-sans mt-1 text-sm text-muted-foreground'>
                There are no registrations waiting for review right now.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className='py-16 text-center text-sm text-muted-foreground'>
            No pending registrations match your search.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='divide-y divide-border p-0'>
            {filtered.map((user) => {
              const isActive = user.student_type === 'active';
              const busy = actionLoadingId === user.id;
              const course = shortCourse(user);
              return (
                <div
                  key={user.id}
                  className='flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between'
                >
                  {/* Identity */}
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                      {user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <span className='truncate font-sans text-sm font-semibold text-foreground'>
                          {user.full_name}
                        </span>
                        <Badge
                          variant='secondary'
                          className={cn(
                            'gap-1 rounded-full text-[10px] font-medium',
                            isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700',
                          )}
                        >
                          {isActive ? (
                            <UserCheck className='h-2.5 w-2.5' />
                          ) : (
                            <UserRoundX className='h-2.5 w-2.5' />
                          )}
                          {isActive ? 'Active' : 'Alumni'}
                        </Badge>
                      </div>
                      <div className='mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground'>
                        {user.school_id && (
                          <span className='font-mono'>{user.school_id}</span>
                        )}
                        {user.school_id && course && <span>·</span>}
                        {course && <span className='truncate'>{course}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openDetails(user.id)}
                      className='font-sans text-muted-foreground hover:text-foreground'
                    >
                      Details
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={busy}
                      onClick={() => decide(user.id, 'rejected')}
                      className='gap-1.5 border-destructive/30 font-sans text-destructive hover:bg-destructive/10 hover:text-destructive'
                    >
                      <X className='h-3.5 w-3.5' />
                      Reject
                    </Button>
                    <Button
                      size='sm'
                      disabled={busy}
                      onClick={() => decide(user.id, 'approved')}
                      className='gap-1.5 bg-emerald-600 font-sans hover:bg-emerald-700'
                    >
                      {busy ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <Check className='h-3.5 w-3.5' />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <UserDetailSheet
        userId={detailUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={(userId) => removeFromQueue(userId)}
      />
    </div>
  );
}
