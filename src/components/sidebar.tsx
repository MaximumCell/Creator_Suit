'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/login/actions';
import {
  ChartIcon,
  ClockIcon,
  CloseIcon,
  FilmIcon,
  KanbanIcon,
  LogoutIcon,
  MenuIcon,
  SparkleIcon,
} from './icons';
import { Avatar } from './avatar';
import { Logo } from '@/components/landing/Logo';
import type { User } from '@/types/database';

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  /** Color tint used for the active state. */
  tint: string;
  tintSoft: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/attendance',
    label: 'Attendance',
    icon: ClockIcon,
    tint: 'text-primary',
    tintSoft: 'bg-primary-soft',
  },
  {
    href: '/youtube',
    label: 'YouTube',
    icon: FilmIcon,
    tint: 'text-accent',
    tintSoft: 'bg-accent-soft',
  },
  {
    href: '/content',
    label: 'Content pipeline',
    icon: KanbanIcon,
    tint: 'text-secondary',
    tintSoft: 'bg-secondary-soft',
  },
];

export function Sidebar({
  user,
  email,
}: {
  user: User;
  email?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md">
        <button
          onClick={() => setOpen(true)}
          className="-ml-2 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="text-sm font-semibold">CreatorSuit</span>
        </button>
        <Avatar
          fullName={user.full_name}
          email={email}
          id={user.id}
          url={user.avatar_url}
          size={28}
          aria-hidden
        />
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-foreground/30 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out md:sticky md:top-0 md:self-start md:h-screen md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand + mobile close */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            href="/attendance"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <Logo size={32} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="-mr-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-2 md:hidden"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (pathname?.startsWith(item.href + '/') ?? false);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  active
                    ? `${item.tintSoft} ${item.tint}`
                    : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile + sign-out, pinned to the bottom */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar
              fullName={user.full_name}
              email={email}
              id={user.id}
              url={user.avatar_url}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {user.full_name || '—'}
              </div>
              <div className="text-xs capitalize text-muted-foreground">
                {user.role}
              </div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <LogoutIcon className="h-[18px] w-[18px]" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
