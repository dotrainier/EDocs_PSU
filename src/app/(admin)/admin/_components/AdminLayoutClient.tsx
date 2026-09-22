'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ClipboardList,
  ScrollText,
  Menu,
  LogOut,
  GraduationCap,
  ChevronDown,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Activity,
  BookOpen,
  ClipboardCheck,
  Gauge,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';
import { NotificationBell } from '@/components/shared/NotificationBell';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  fullName: string;
  schoolId: string | null;
  role: string;
  initials: string;
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const OVERVIEW_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/verification', label: 'Pending Registrations', icon: ClipboardCheck },
];

const CONFIG_ITEMS = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/offices', label: 'Offices', icon: Building2 },
  { href: '/admin/document-types', label: 'Document Types', icon: FileText },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/capacity-settings', label: 'Capacity Settings', icon: Gauge },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
];

const MONITOR_ITEMS = [
  { href: '/admin/requests', label: 'All Requests', icon: ClipboardList },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

const ALL_ITEMS = [...OVERVIEW_ITEMS, ...CONFIG_ITEMS, ...MONITOR_ITEMS];

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/verification': 'Pending Registrations',
  '/admin/users': 'Users',
  '/admin/offices': 'Offices',
  '/admin/document-types': 'Document Types',
  '/admin/courses': 'Courses',
  '/admin/capacity-settings': 'Capacity Settings',
  '/admin/payments': 'Payments',
  '/admin/requests': 'All Requests',
  '/admin/audit-logs': 'Audit Logs',
};

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [base, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(base + '/')) return title;
  }
  return 'Admin';
}

// ─── Nav link (expanded) ──────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  indent,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  indent?: boolean;
  badge?: number;
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
      {!!badge && (
        <span
          className={cn(
            'flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500 text-white',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {active && !indent && !badge && (
        <span className='h-1.5 w-1.5 rounded-full bg-primary-foreground/50' />
      )}
    </Link>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function NavSection({
  label,
  icon: Icon,
  items,
  active,
  open,
  onToggle,
  onNavClick,
  pathname,
  expandOnHover,
}: {
  label: string;
  icon: React.ElementType;
  items: typeof CONFIG_ITEMS;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  pathname: string;
  // Expands on mouse enter / collapses on mouse leave, in addition to the
  // click toggle below — click stays fully functional on its own for
  // touch/keyboard users who can't hover.
  expandOnHover?: boolean;
}) {
  const [hovering, setHovering] = useState(false);
  const effectiveOpen = open || (expandOnHover && hovering);

  return (
    <div
      onMouseEnter={expandOnHover ? () => setHovering(true) : undefined}
      onMouseLeave={expandOnHover ? () => setHovering(false) : undefined}
    >
      <button
        onClick={onToggle}
        className={cn(
          'group mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          active
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-150',
            !active && 'group-hover:scale-110',
          )}
        />
        <span className='flex-1 text-left'>{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
            effectiveOpen && 'rotate-180',
          )}
        />
      </button>
      {effectiveOpen && (
        <div className='relative ml-3 mt-0.5 space-y-0.5 pl-4'>
          <div className='absolute bottom-2 left-2.75 top-1 w-px bg-border' />
          {items.map(({ href, label: itemLabel, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={itemLabel}
              icon={icon}
              active={pathname === href || pathname.startsWith(href + '/')}
              indent
              onClick={onNavClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nav icon (collapsed rail) ────────────────────────────────────────────────

function RailItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          onClick={onClick}
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150',
            active
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className='h-4 w-4' />
          {!!badge && (
            <span className='absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-semibold text-white'>
              {badge > 9 ? '9+' : badge}
            </span>
          )}
          <span className='sr-only'>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side='right' sideOffset={8} className='text-xs'>
        {label}
        {!!badge && ` (${badge})`}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Expanded sidebar ─────────────────────────────────────────────────────────

function ExpandedSidebar({
  user,
  pendingCount,
  onNavClick,
}: {
  user: User;
  pendingCount: number;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const onConfigRoute = CONFIG_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  const onMonitorRoute = MONITOR_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'));

  const [userToggledConfig, setUserToggledConfig] = useState(false);
  const [userToggledMonitor, setUserToggledMonitor] = useState(false);
  const configOpen = onConfigRoute || userToggledConfig;
  const monitorOpen = onMonitorRoute || userToggledMonitor;

  async function handleSignout() {
    await api.post('/auth/signout');
    router.push('/signin');
    router.refresh();
  }

  return (
    <div className='flex h-full min-w-0 flex-col'>
      {/* Logo */}
      <div className='flex items-center gap-3 px-5 py-5'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30'>
          <GraduationCap className='h-5 w-5 text-primary-foreground' />
        </div>
        <div className='flex flex-col'>
          <span className='font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
            PSU Main Campus
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='font-heading text-lg font-bold leading-tight tracking-tight text-foreground'>
              e-Docs
            </span>
            <span className='rounded bg-amber-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
              Admin
            </span>
          </div>
        </div>
      </div>

      <Separator className='mx-4 mb-1 w-auto' />

      {/* Admin badge */}
      <div className='mx-3 mb-1 mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30'>
        <ShieldCheck className='h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
        <span className='font-sans text-xs font-semibold text-amber-700 dark:text-amber-400'>
          Admin Panel
        </span>
      </div>

      {/* Nav */}
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
                badge={href === '/admin/verification' ? pendingCount : undefined}
                onClick={onNavClick}
              />
            ))}
          </div>
        </div>

        <Separator className='mx-1 w-auto' />

        {/* Configuration */}
        <div>
          <p className='mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60'>
            Configuration
          </p>
          <NavSection
            label='System Config'
            icon={Settings2}
            items={CONFIG_ITEMS}
            active={onConfigRoute}
            open={configOpen}
            onToggle={() => setUserToggledConfig((o) => !o)}
            onNavClick={onNavClick}
            pathname={pathname}
            expandOnHover
          />
        </div>

        <Separator className='mx-1 w-auto' />

        {/* Monitoring */}
        <div>
          <p className='mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60'>
            Monitoring
          </p>
          <NavSection
            label='System Monitor'
            icon={Activity}
            items={MONITOR_ITEMS}
            active={onMonitorRoute}
            open={monitorOpen}
            onToggle={() => setUserToggledMonitor((o) => !o)}
            onNavClick={onNavClick}
            pathname={pathname}
          />
        </div>
      </nav>

      <Separator className='mx-4 mb-3 w-auto' />

      {/* User card + logout */}
      <div className='px-3 pb-5'>
        <div className='mb-2 flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
            {user.initials}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold text-foreground'>{user.fullName}</p>
            <Badge variant='secondary' className='mt-0.5 h-4 rounded-sm px-1.5 text-[10px] font-medium'>
              {user.role}
            </Badge>
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleSignout}
          className='font-sans w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
        >
          <LogOut className='h-4 w-4' />
          Log Out
        </Button>
      </div>
    </div>
  );
}

// ─── Collapsed rail ───────────────────────────────────────────────────────────

function CollapsedRail({ user, pendingCount }: { user: User; pendingCount: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignout() {
    await api.post('/auth/signout');
    router.push('/signin');
    router.refresh();
  }

  return (
    <TooltipProvider delayDuration={80}>
      <div className='flex h-full flex-col items-center gap-1 py-4'>
        {/* Logo icon */}
        <div className='mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30'>
          <GraduationCap className='h-5 w-5 text-primary-foreground' />
        </div>

        {/* Admin shield */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30'>
              <ShieldCheck className='h-3.5 w-3.5 text-amber-600 dark:text-amber-400' />
            </div>
          </TooltipTrigger>
          <TooltipContent side='right' sideOffset={8} className='text-xs'>
            Admin Panel
          </TooltipContent>
        </Tooltip>

        <Separator className='my-1 w-9' />

        {ALL_ITEMS.map(({ href, label, icon }) => (
          <RailItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + '/')}
            badge={href === '/admin/verification' ? pendingCount : undefined}
          />
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
            <p className='text-muted-foreground'>{user.role}</p>
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

function MobileNav({ user, pendingCount }: { user: User; pendingCount: number }) {
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
        <ExpandedSidebar user={user} pendingCount={pendingCount} onNavClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('edocs_admin_sidebar');
    startTransition(() => {
      setMounted(true);
      if (saved === 'collapsed') setCollapsed(true);
    });
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get<{ users: unknown[] }>('/admin/users?verification_status=pending')
      .then((res) => {
        if (active) setPendingCount(res.users.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('edocs_admin_sidebar', next ? 'collapsed' : 'expanded');
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
          <CollapsedRail user={user} pendingCount={pendingCount} />
        ) : (
          <ExpandedSidebar user={user} pendingCount={pendingCount} />
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
          <MobileNav user={user} pendingCount={pendingCount} />

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
          <NotificationBell />
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
            {user.initials}
          </div>
        </header>

        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
