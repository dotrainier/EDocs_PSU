'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  UserCircle2,
  Menu,
  LogOut,
  GraduationCap,
  ChevronDown,
  Bell,
  HelpCircle,
  FileStack,
  Hourglass,
  Clock,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Check,
  CheckCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  fullName: string;
  schoolId: string | null;
  role: string;
  studentType: string | null;
  initials: string;
}

// Display-only: an Alumni account is still role 'Student' for auth purposes,
// but the sidebar should read "Alumni" instead of "Student" for them.
function displayRole(user: User): string {
  if (user.role === 'Student' && user.studentType === 'alumni') return 'Alumni';
  return user.role;
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const OVERVIEW_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/requests/new', label: 'Request Document', icon: FilePlus2 },
];

const MY_REQUESTS_CHILDREN = [
  { href: '/requests', label: 'All Requests', icon: FileStack, status: null, date: null },
  { href: '/requests?status=Pending', label: 'On Queue', icon: Hourglass, status: 'Pending', date: null },
  { href: '/requests?status=In+Process', label: 'In Progress', icon: Clock, status: 'In Process', date: null },
  { href: '/requests?status=Action+Required', label: 'Action Required', icon: AlertCircle, status: 'Action Required', date: null },
  { href: '/requests?status=Ready+for+Release', label: 'Ready for Release', icon: PackageCheck, status: 'Ready for Release', date: null },
  { href: '/requests?status=Released', label: 'Released', icon: CheckCircle2, status: 'Released', date: null },
  { href: '/requests?status=Cancelled', label: 'Cancelled', icon: XCircle, status: 'Cancelled', date: null },
  { href: '/requests/today', label: "Today's History", icon: CalendarDays, status: null, date: null },
];

const OTHER_ITEMS = [
  { href: '/profile', label: 'Profile', icon: UserCircle2 },
  { href: '/help', label: 'Help & FAQs', icon: HelpCircle },
];

// Rail items: one icon per logical group
const RAIL_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/requests/new', label: 'Request Document', icon: FilePlus2 },
  { href: '/requests', label: 'My Requests', icon: FolderOpen },
  { href: '/profile', label: 'Profile', icon: UserCircle2 },
  { href: '/help', label: 'Help & FAQs', icon: HelpCircle },
];

// ─── Page title ───────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/requests/new': 'Request Document',
  '/requests': 'My Requests',
  '/profile': 'Profile',
  '/help': 'Help & FAQs',
};

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname === '/requests/today') return "Today's History";
  if (pathname.startsWith('/requests/')) return 'Track Request';
  return 'e-Docs';
}

// ─── Notification helpers ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  pending:    { label: 'Pending',    dot: 'bg-amber-500' },
  processing: { label: 'Processing', dot: 'bg-blue-500' },
  completed:  { label: 'Completed',  dot: 'bg-emerald-500' },
  rejected:   { label: 'Rejected',   dot: 'bg-red-500' },
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Nav link (expanded) ──────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  indent,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: number;
  indent?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-150',
        indent ? 'py-2 text-[13px]' : 'py-2.5',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-transform duration-150',
          indent ? 'h-3.5 w-3.5' : 'h-4 w-4',
          !active && 'group-hover:scale-110',
        )}
      />
      <span className='flex-1 truncate'>{label}</span>
      {badge != null && badge > 0 && (
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            active
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {active && !indent && !badge && <span className='h-1.5 w-1.5 rounded-full bg-primary-foreground/50' />}
    </Link>
  );
}

// ─── Nav icon (collapsed rail) ────────────────────────────────────────────────

function RailItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          onClick={onClick}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150',
            active
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className='h-4 w-4' />
          <span className='sr-only'>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side='right' sideOffset={8} className='text-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Header bell dropdown ─────────────────────────────────────────────────────

function NotifItem({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) {
  const status = notif.status ?? 'pending';
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-3 transition-colors',
        notif.is_read ? 'hover:bg-muted/50' : 'bg-primary/4 hover:bg-primary/7',
      )}
    >
      {!notif.is_read && (
        <span className='absolute left-0 top-3 bottom-3 w-0.75 rounded-r-full bg-primary' />
      )}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          notif.is_read ? 'bg-muted' : 'bg-primary/10',
        )}
      >
        <Bell
          className={cn('h-3.5 w-3.5', notif.is_read ? 'text-muted-foreground' : 'text-primary')}
          strokeWidth={2}
        />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <p className={cn('text-xs leading-snug', notif.is_read ? 'font-normal text-foreground/80' : 'font-semibold text-foreground')}>
            {notif.title}
          </p>
          <span className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'>
            <Clock className='h-2.5 w-2.5' />
            {formatTime(notif.created_at)}
          </span>
        </div>
        <p className='mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground'>
          {notif.message}
        </p>
        <div className='mt-1.5 flex items-center justify-between'>
          <div className='flex items-center gap-1'>
            <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
            <span className='text-[10px] font-medium text-muted-foreground'>{cfg.label}</span>
          </div>
          {!notif.is_read && (
            <button
              onClick={() => onMarkRead(notif.id)}
              className='flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-primary opacity-0 transition-opacity hover:bg-primary/10 group-hover:opacity-100'
            >
              <Check className='h-2.5 w-2.5' />
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderBell({
  unreadCount,
  notifications,
  markAsRead,
}: {
  unreadCount: number;
  notifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
}) {
  const markAllRead = useCallback(async () => {
    await Promise.all(notifications.filter((n) => !n.is_read).map((n) => markAsRead(n.id)));
  }, [notifications, markAsRead]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent',
            'transition-all duration-200 hover:border-border hover:bg-primary/8 dark:hover:bg-primary/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell
            className={cn(
              'h-4.5 w-4.5 transition-colors duration-200',
              unreadCount > 0 ? 'fill-primary/10 text-primary' : 'text-muted-foreground',
            )}
            strokeWidth={2}
          />
          {unreadCount > 0 && (
            <span className='absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' sideOffset={8} className='w-80 p-0'>
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <span className='text-sm font-semibold text-foreground'>Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className='flex items-center gap-1 text-xs font-medium text-primary hover:underline'
            >
              <CheckCheck className='h-3.5 w-3.5' />
              Mark all read
            </button>
          )}
        </div>
        <div className='max-h-105 overflow-y-auto'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted'>
                <Bell className='h-5 w-5 text-muted-foreground/60' strokeWidth={1.5} />
              </div>
              <p className='text-xs font-semibold text-foreground'>No notifications</p>
              <p className='mt-0.5 text-[11px] text-muted-foreground'>
                Updates to your requests will appear here.
              </p>
            </div>
          ) : (
            <div className='divide-y'>
              {notifications.map((notif) => (
                <NotifItem key={notif.id} notif={notif} onMarkRead={markAsRead} />
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Expanded sidebar content ─────────────────────────────────────────────────

function ExpandedSidebar({
  user,
  onNavClick,
}: {
  user: User;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const onRequestsRoute =
    pathname === '/requests' || (pathname.startsWith('/requests/') && pathname !== '/requests/new');

  const [userToggledOpen, setUserToggledOpen] = useState(false);
  const requestsOpen = onRequestsRoute || userToggledOpen;

  async function handleSignout() {
    await api.post('/auth/signout');
    router.push('/signin');
    router.refresh();
  }

  function isSubItemActive(item: (typeof MY_REQUESTS_CHILDREN)[number]): boolean {
    // Items with their own dedicated route (no query params)
    if (!item.href.includes('?') && item.href !== '/requests') {
      return pathname === item.href;
    }
    // Search-param-based items — must be on /requests
    if (pathname !== '/requests') return false;
    const currentStatus = searchParams.get('status');
    const currentDate = searchParams.get('date');
    if (item.status === null && item.date === null) return currentStatus === null && currentDate === null;
    if (item.status !== null) return item.status === currentStatus && currentDate === null;
    return item.date === currentDate && currentStatus === null;
  }

  return (
    <div className='flex h-full min-w-0 flex-col'>
      {/* Logo */}
      <div className='flex items-center gap-3 px-5 py-5'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30'>
          <GraduationCap className='h-5 w-5 text-primary-foreground' />
        </div>
        <div className='flex flex-col'>
          <span className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
            PSU Main Campus
          </span>
          <span className='font-heading text-lg font-bold leading-tight tracking-tight text-foreground'>
            e-Docs
          </span>
        </div>
      </div>

      <Separator className='mx-4 mb-1 w-auto' />

      <nav className='scrollbar-sidebar flex-1 min-h-0 space-y-4 overflow-y-auto px-3 py-3'>
        {/* Overview */}
        <div>
          <p className='mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60'>
            Overview
          </p>
          <div className='space-y-0.5'>
            {OVERVIEW_ITEMS.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname === href}
                onClick={onNavClick}
              />
            ))}
          </div>
        </div>

        <Separator className='mx-1 w-auto' />

        {/* My Requests — collapsible */}
        <div>
          <p className='mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60'>
            Document Requests
          </p>
          <button
            onClick={() => setUserToggledOpen((o) => !o)}
            className={cn(
              'group mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              onRequestsRoute
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <FolderOpen
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-150',
                !onRequestsRoute && 'group-hover:scale-110',
              )}
            />
            <span className='flex-1 text-left'>My Requests</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
                requestsOpen && 'rotate-180',
              )}
            />
          </button>

          {requestsOpen && (
            <div className='relative ml-3 mt-0.5 space-y-0.5 pl-4'>
              <div className='absolute bottom-2 left-2.75 top-1 w-px bg-border' />
              {MY_REQUESTS_CHILDREN.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isSubItemActive(item)}
                  indent
                  onClick={onNavClick}
                />
              ))}
            </div>
          )}
        </div>

        <Separator className='mx-1 w-auto' />

        {/* Other */}
        <div>
          <p className='mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60'>
            Other
          </p>
          <div className='space-y-0.5'>
            {OTHER_ITEMS.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname === href}
                onClick={onNavClick}
              />
            ))}
          </div>
        </div>
      </nav>

      <Separator className='mx-4 mb-3 w-auto' />

      {/* User card + sign out */}
      <div className='px-3 pb-5'>
        <div className='mb-2 flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
            {user.initials}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold text-foreground'>{user.fullName}</p>
            <Badge variant='secondary' className='mt-0.5 h-4 rounded-sm px-1.5 text-[10px] font-medium'>
              {displayRole(user)}
            </Badge>
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleSignout}
          className='w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
        >
          <LogOut className='h-4 w-4' />
          Log Out
        </Button>
      </div>
    </div>
  );
}

// ─── Collapsed rail ───────────────────────────────────────────────────────────

function CollapsedRail({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  const isRailActive = (href: string) => {
    if (href === '/requests') return pathname === '/requests' || (pathname.startsWith('/requests/') && pathname !== '/requests/new');
    return pathname === href;
  };

  async function handleSignout() {
    await api.post('/auth/signout');
    router.push('/signin');
    router.refresh();
  }

  return (
    <TooltipProvider delayDuration={80}>
      <div className='flex h-full flex-col items-center gap-1 py-4'>
        {/* Logo */}
        <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30'>
          <GraduationCap className='h-5 w-5 text-primary-foreground' />
        </div>

        <Separator className='mb-2 w-9' />

        {RAIL_ITEMS.map(({ href, label, icon }) => (
          <RailItem key={href} href={href} label={label} icon={icon} active={isRailActive(href)} />
        ))}

        <div className='flex-1' />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
              {user.initials}
            </div>
          </TooltipTrigger>
          <TooltipContent side='right' sideOffset={8} className='text-xs'>
            <p className='font-semibold'>{user.fullName}</p>
            <p className='text-muted-foreground'>{displayRole(user)}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSignout}
              className='mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
            >
              <LogOut className='h-4 w-4' />
              <span className='sr-only'>Log Out</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side='right' sideOffset={8} className='text-xs'>
            Log Out
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────

function MobileNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='lg:hidden'>
          <Menu className='h-5 w-5' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-64 p-0'>
        <ExpandedSidebar user={user} onNavClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function PortalLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);
  const { notifications, unreadCount, markAsRead } = useNotifications(user.id);

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('edocs_portal_sidebar');
    startTransition(() => {
      setMounted(true);
      if (saved === 'collapsed') setCollapsed(true);
    });
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('edocs_portal_sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  const isCollapsed = mounted && collapsed;

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'relative hidden shrink-0 border-r border-border bg-card lg:flex lg:flex-col',
          'transition-[width] duration-300 ease-in-out',
          isCollapsed ? 'w-17' : 'w-64',
        )}
      >
        {isCollapsed ? (
          <CollapsedRail user={user} />
        ) : (
          <ExpandedSidebar user={user} />
        )}

        {/* Toggle button */}
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'absolute -right-3 top-18 z-20 flex h-6 w-6 items-center justify-center',
            'rounded-full border border-border bg-card shadow-sm',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className='h-3 w-3' />
          ) : (
            <PanelLeftClose className='h-3 w-3' />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-5'>
          <MobileNav user={user} />

          <div className='flex items-center gap-2 lg:hidden'>
            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary'>
              <GraduationCap className='h-4 w-4 text-primary-foreground' />
            </div>
            <span className='font-heading text-base font-bold tracking-tight text-foreground'>
              e-Docs
            </span>
          </div>

          <h1 className='font-heading hidden flex-1 text-base font-semibold text-foreground lg:block'>
            {pageTitle}
          </h1>

          <div className='flex-1 lg:hidden' />

          <HeaderBell unreadCount={unreadCount} notifications={notifications} markAsRead={markAsRead} />

          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
            {user.initials}
          </div>
        </header>

        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
