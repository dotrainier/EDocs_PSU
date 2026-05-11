'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  CheckSquare,
  Menu,
  LogOut,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/axios';
import { NotificationBell } from '@/components/shared/NotificationBell';

interface User {
  fullName: string;
  schoolId: string;
  role: string;
  initials: string;
}

const NAV_ITEMS = [
  { href: '/office/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/office/queue', label: 'Queue', icon: ListTodo },
  { href: '/office/cleared', label: 'Cleared', icon: CheckSquare },
];

function SidebarContent({ user, onNavClick }: { user: User; onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignout() {
    await api.post('/auth/signout');
    router.push('/signin');
    router.refresh();
  }

  return (
    <div className='flex h-full min-w-0 flex-col'>
      {/* Logo */}
      <div className='flex items-center gap-3 px-6 py-6'>
        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30'>
          <GraduationCap className='h-5 w-5 text-primary-foreground' />
        </div>
        <div className='flex flex-col'>
          <span className='font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
            PSU Main Campus
          </span>
          <span className='font-heading text-lg font-bold leading-tight tracking-tight text-foreground'>
            e-Docs
          </span>
        </div>
      </div>

      <Separator className='mx-4 mb-2 w-auto' />

      {/* Navigation */}
      <nav className='flex-1 space-y-0.5 px-3 py-2'>
        <p className='font-sans mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70'>
          Navigation
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                'font-sans group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-150',
                  !active && 'group-hover:scale-110',
                )}
              />
              <span className='flex-1'>{label}</span>
              {active && <ChevronRight className='h-3.5 w-3.5 opacity-60' />}
            </Link>
          );
        })}
      </nav>

      <Separator className='mx-4 mb-3 w-auto' />

      {/* Staff info + logout */}
      <div className='px-3 pb-5'>
        <div className='mb-2 flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow'>
            {user.initials}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold text-foreground'>{user.fullName}</p>
            <Badge
              variant='secondary'
              className='mt-0.5 h-4 rounded-sm px-1.5 text-[10px] font-medium'
            >
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
        <SidebarContent user={user} onNavClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export default function OfficeLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Desktop sidebar */}
      <aside className='hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col'>
        <SidebarContent user={user} />
      </aside>

      {/* Main content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm'>
          <MobileNav user={user} />
          <div className='flex items-center gap-2 lg:hidden'>
            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary'>
              <GraduationCap className='h-4 w-4 text-primary-foreground' />
            </div>
            <span className='font-heading text-base font-bold tracking-tight text-foreground'>
              e-Docs
            </span>
          </div>
          <div className='flex-1' />
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
