'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Check, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'New',
    color: 'text-primary before:bg-primary',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600 dark:text-emerald-400 before:bg-emerald-500',
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-600 dark:text-blue-400 before:bg-blue-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600 dark:text-red-400 before:bg-red-500',
  },
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.id && setUserId(data.id))
      .catch(() => {});
  }, []);

  const { notifications, unreadCount, markAsRead } = useNotifications(userId);

  if (!userId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative flex items-center justify-center',
            'w-9 h-9 rounded-xl',
            'bg-transparent hover:bg-primary/8 dark:hover:bg-primary/15',
            'border border-transparent hover:border-border',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'group',
          )}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell
            className={cn(
              'w-[18px] h-[18px] transition-all duration-200',
              unreadCount > 0
                ? 'text-primary fill-primary/10'
                : 'text-muted-foreground group-hover:text-foreground',
            )}
            strokeWidth={2}
          />

          {/* Badge */}
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1',
                'min-w-[18px] h-[18px] px-1',
                'bg-primary text-primary-foreground',
                'text-[10px] font-bold leading-none',
                'rounded-full flex items-center justify-center',
                'shadow-sm ring-2 ring-background',
                'animate-in zoom-in-75 duration-200',
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className={cn(
          'w-[360px] p-0 overflow-hidden',
          'border border-border/60',
          'shadow-xl shadow-black/8 dark:shadow-black/30',
          'rounded-2xl',
          'bg-popover',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200',
        )}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 pt-4 pb-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold text-foreground tracking-tight'>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'min-w-[20px] h-5 px-1.5 rounded-full',
                  'bg-primary/10 text-primary',
                  'text-[11px] font-semibold',
                )}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <span className='text-[11px] text-muted-foreground'>Click to mark as read</span>
          )}
        </div>

        {/* Thin divider */}
        <div className='h-px bg-border/50 mx-4' />

        {/* Content */}
        {notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 py-12 px-4'>
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center',
                'bg-muted border border-border/50',
              )}
            >
              <Bell className='w-5 h-5 text-muted-foreground' strokeWidth={1.5} />
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium text-foreground'>All caught up</p>
              <p className='text-xs text-muted-foreground mt-0.5'>No notifications yet</p>
            </div>
          </div>
        ) : (
          <div className='max-h-[420px] overflow-y-auto overscroll-contain py-1.5'>
            {notifications.map((notif) => {
              const status = notif.status || 'pending';
              const statusCfg = statusConfig[status];

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'relative mx-1.5 px-3 py-3 rounded-xl',
                    'transition-all duration-150 ease-out',
                    'hover:bg-accent/50 dark:hover:bg-accent/30',
                    'group/item',
                    !notif.is_read && 'bg-primary/[0.04] dark:bg-primary/[0.08]',
                  )}
                >
                  {/* Unread indicator bar */}
                  {!notif.is_read && (
                    <span className='absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary' />
                  )}

                  <div className='flex items-start gap-3'>
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                        !notif.is_read
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : 'bg-muted dark:bg-muted/50',
                      )}
                    >
                      <Bell
                        className={cn(
                          'w-3.5 h-3.5',
                          !notif.is_read ? 'text-primary' : 'text-muted-foreground',
                        )}
                        strokeWidth={2}
                      />
                    </div>

                    {/* Body */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <p
                          className={cn(
                            'text-[13px] leading-snug',
                            notif.is_read
                              ? 'font-normal text-foreground/80'
                              : 'font-semibold text-foreground',
                          )}
                        >
                          {notif.title}
                        </p>

                        {/* Timestamp — hidden on hover if unread, replaced by check button */}
                        <span
                          className={cn(
                            'text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1 mt-0.5 flex-shrink-0',
                            !notif.is_read && 'group-hover/item:hidden',
                          )}
                        >
                          <Clock className='w-3 h-3' />
                          {formatTime(notif.created_at)}
                        </span>

                        {/* Mark as read button — only unread, reveals on hover */}
                        {!notif.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            title='Mark as read'
                            className={cn(
                              'hidden group-hover/item:flex',
                              'items-center gap-1 flex-shrink-0',
                              'text-[11px] font-medium text-primary',
                              'px-1.5 py-0.5 rounded-md mt-0.5',
                              'hover:bg-primary/10 transition-colors duration-100',
                            )}
                          >
                            <Check className='w-3 h-3' />
                            Mark read
                          </button>
                        )}
                      </div>

                      <p className='text-[12px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed'>
                        {notif.message}
                      </p>

                      {/* Status pill */}
                      <div className='mt-2'>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5',
                            'text-[11px] font-medium capitalize',
                            'before:content-[""] before:w-1.5 before:h-1.5 before:rounded-full before:flex-shrink-0',
                            statusCfg?.color ?? 'text-muted-foreground before:bg-muted-foreground',
                          )}
                        >
                          {statusCfg?.label ?? status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <div className='h-px bg-border/50 mx-4' />
            <div className='px-4 py-2.5'>
              <button className='w-full text-[12px] font-medium text-primary hover:text-primary/80 transition-colors duration-150 py-1 rounded-lg hover:bg-primary/5'>
                View all notifications
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
