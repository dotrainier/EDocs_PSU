'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type UserDetail = {
  id: string;
  full_name: string;
  given_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  name_suffix: string | null;
  school_id: string | null;
  email: string;
  role_name: string;
  status: string;
  student_type: string | null;
  year_level: string | null;
  year_graduated: number | null;
  course_name: string | null;
  course_major: string | null;
  course_other_note: string | null;
  verification_status: string;
  created_at: string;
};

export function formatCourse(
  user: Pick<UserDetail, 'course_name' | 'course_major' | 'course_other_note'>,
) {
  if (user.course_name) {
    return user.course_major
      ? `${user.course_name} major in ${user.course_major}`
      : user.course_name;
  }
  if (user.course_other_note) return `${user.course_other_note} (not yet in catalog)`;
  return '—';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
  onStatusChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (userId: string, status: VerificationStatus) => void;
}) {
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    let active = true;
    setDetailUser(null);
    setError('');
    setLoading(true);

    api
      .get<{ user: UserDetail }>(`/admin/users/${userId}`)
      .then((res) => {
        if (active) setDetailUser(res.user);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to load user details.';
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, userId]);

  async function handleDecision(newStatus: VerificationStatus) {
    if (!detailUser) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${detailUser.id}`, { verification_status: newStatus });
      setDetailUser((prev) => (prev ? { ...prev, verification_status: newStatus } : prev));
      onStatusChange?.(detailUser.id, newStatus);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to update verification status.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{detailUser?.full_name ?? 'User Details'}</SheetTitle>
          <SheetDescription>
            {detailUser
              ? `${detailUser.role_name} · ${detailUser.school_id ?? detailUser.email}`
              : 'Loading registration details…'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-4'>
          {error && (
            <Alert variant='destructive' className='py-3'>
              <AlertDescription className='text-sm'>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className='flex items-center justify-center py-12 text-muted-foreground'>
              <Loader2 className='h-5 w-5 animate-spin' />
            </div>
          ) : (
            detailUser && (
              <div className='space-y-4 text-sm'>
                <DetailRow
                  label='Full Name'
                  value={
                    [
                      detailUser.given_name,
                      detailUser.middle_name,
                      detailUser.last_name,
                      detailUser.name_suffix,
                    ]
                      .filter(Boolean)
                      .join(' ') || detailUser.full_name
                  }
                />
                <DetailRow label='Email' value={detailUser.email} />
                <DetailRow label='School ID' value={detailUser.school_id ?? '—'} />
                <Separator />
                <DetailRow
                  label='Student Type'
                  value={
                    detailUser.student_type === 'active'
                      ? 'Active Student'
                      : detailUser.student_type === 'alumni'
                        ? 'Alumni / Inactive Student'
                        : '—'
                  }
                />
                <DetailRow label='Course' value={formatCourse(detailUser)} />
                {detailUser.student_type === 'active' ? (
                  <DetailRow label='Year Level' value={detailUser.year_level ?? '—'} />
                ) : (
                  <DetailRow
                    label='Year Graduated'
                    value={detailUser.year_graduated ? String(detailUser.year_graduated) : '—'}
                  />
                )}
                <Separator />
                <DetailRow label='Role' value={detailUser.role_name} />
                <DetailRow label='Account Status' value={detailUser.status} className='capitalize' />
                <DetailRow
                  label='Verification Status'
                  value={detailUser.verification_status}
                  className='capitalize'
                />
                <DetailRow label='Registered' value={formatDateTime(detailUser.created_at)} />
              </div>
            )
          )}
        </div>

        {detailUser && detailUser.verification_status === 'pending' && (
          <SheetFooter className='flex-row justify-end gap-2'>
            <Button
              variant='outline'
              className='border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
              disabled={actionLoading}
              onClick={() => handleDecision('rejected')}
            >
              <X className='mr-1.5 h-4 w-4' />
              Reject
            </Button>
            <Button disabled={actionLoading} onClick={() => handleDecision('approved')}>
              {actionLoading ? (
                <Loader2 className='mr-1.5 h-4 w-4 animate-spin' />
              ) : (
                <Check className='mr-1.5 h-4 w-4' />
              )}
              Approve
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <span className={cn('text-right text-sm font-medium text-foreground', className)}>
        {value}
      </span>
    </div>
  );
}
