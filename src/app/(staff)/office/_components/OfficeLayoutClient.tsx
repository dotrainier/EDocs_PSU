'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  CheckSquare,
  Menu,
  LogOut,
  GraduationCap,
  ChevronDown,
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn, formatRole } from '@/lib/utils';
import { api } from '@/lib/axios';
import { NotificationBell } from '@/components/shared/NotificationBell';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  fullName: string;
  schoolId: string;
  role: string;
  initials: string;
  officeCode: string;
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const OVERVIEW_ITEMS = [
  { href: '/office/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const QUEUE_ITEMS = [
  { href: '/office/queue', label: 'Pending Queue', icon: ListTodo },
  { href: '/office/cleared', label: 'Action History', icon: CheckSquare },
];

const PAGE_TITLES: Record<string, string> = {
  '/office/dashboard': 'Dashboard',
  '/office/queue': 'Pending Queue',
  '/office/cleared': 'Action History',
};

function resolvePageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Office';
}

// ─── Nav link (expanded) ──────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  indent,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
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
      {active && !indent && <span className='h-1.5 w-1.5 rounded-full bg-primary-foreground/50' />}
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

// ─── Expanded sidebar content ─────────────────────────────────────────────────

function ExpandedSidebar({ user, onNavClick }: { user: User; onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const onQueueRoute = QUEUE_ITEMS.some((i) => pathname === i.href);
  const [userToggledQueue, setUserToggledQueue] = useState(false);
  const queueOpen = onQueueRoute || userToggledQueue;

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
            <span className='rounded bg-primary/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-primary'>
              Staff
            </span>
          </div>
        </div>
      </div>

      <Separator className='mx-4 mb-1 w-auto' />

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
                onClick={onNavClick}
              />
            ))}
          </div>
        </div>

        <Separator className='mx-1 w-auto' />

        {/* Request Queue — collapsible */}
        <div>
          <p className='mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60'>
            Request Queue
          </p>
          <button
            onClick={() => setUserToggledQueue((o) => !o)}
            className={cn(
              'group mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              onQueueRoute
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <FolderKanban
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-150',
                !onQueueRoute && 'group-hover:scale-110',
              )}
            />
            <span className='flex-1 text-left'>Manage Queue</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
                queueOpen && 'rotate-180',
              )}
            />
          </button>

          {queueOpen && (
            <div className='relative ml-3 mt-0.5 space-y-0.5 pl-4'>
              <div className='absolute bottom-2 left-2.75 top-1 w-px bg-border' />
              {QUEUE_ITEMS.map(({ href, label, icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={pathname === href}
                  indent
                  onClick={onNavClick}
                />
              ))}
            </div>
          )}
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
            <div className='mt-0.5 flex items-center gap-1'>
              <Badge variant='secondary' className='h-4 rounded-sm px-1.5 text-[10px] font-medium'>
                {formatRole(user.role)}
              </Badge>
              {user.officeCode && (
                <Badge className='h-4 rounded-sm px-1.5 text-[10px] font-medium'>
                  {user.officeCode}
                </Badge>
              )}
            </div>
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

// ─── Collapsed rail content ───────────────────────────────────────────────────

function CollapsedRail({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignout() {
    await api.post('/auth/signout');
    router.push('/signin');
    router.refresh();
  }

  const allItems = [...OVERVIEW_ITEMS, ...QUEUE_ITEMS];

  return (
    <TooltipProvider delayDuration={80}>
      <div className='flex h-full flex-col items-center gap-1 py-4'>
        {/* Logo icon */}
        <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30'>
          <GraduationCap className='h-5 w-5 text-primary-foreground' />
        </div>

        <Separator className='mb-2 w-9' />

        {allItems.map(({ href, label, icon }) => (
          <RailItem key={href} href={href} label={label} icon={icon} active={pathname === href} />
        ))}

        <div className='flex-1' />

        {/* User avatar tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
              {user.initials}
            </div>
          </TooltipTrigger>
          <TooltipContent side='right' sideOffset={8} className='text-xs'>
            <p className='font-semibold'>{user.fullName}</p>
            <p className='text-muted-foreground'>{formatRole(user.role)}</p>
          </TooltipContent>
        </Tooltip>

        {/* Sign out */}
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

// ─── Mobile nav sheet ─────────────────────────────────────────────────────────

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

export default function OfficeLayoutClient({
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

  useEffect(() => {
    const saved = localStorage.getItem('edocs_staff_sidebar');
    startTransition(() => {
      setMounted(true);
      if (saved === 'collapsed') setCollapsed(true);
    });
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('edocs_staff_sidebar', next ? 'collapsed' : 'expanded');
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

          {/* Mobile logo */}
          <div className='flex items-center gap-2 lg:hidden'>
            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary'>
              <GraduationCap className='h-4 w-4 text-primary-foreground' />
            </div>
            <span className='font-heading text-base font-bold tracking-tight text-foreground'>
              e-Docs
            </span>
          </div>

          {/* Desktop page title */}
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
