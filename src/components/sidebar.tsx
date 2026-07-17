'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/login/actions';
import {
  ClockIcon,
  CloseIcon,
  FilmIcon,
  KanbanIcon,
  LogoutIcon,
  MenuIcon,
} from './icons';
import { Avatar } from './avatar';
import type { User } from '@/types/database';

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/attendance', label: 'Attendance', icon: ClockIcon },
  { href: '/youtube', label: 'YouTube Stats', icon: FilmIcon },
  { href: '/content', label: 'Content Pipeline', icon: KanbanIcon },
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
      <header className="md:hidden flex items-center justify-between bg-card border-b px-4 h-14 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 -ml-2 px-2 py-1.5 rounded-md hover:bg-subtle transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
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
        className={`md:hidden fixed inset-0 bg-foreground/30 z-40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        aria-label="Primary navigation"
        className={`fixed md:sticky md:top-0 md:self-start inset-y-0 left-0 z-50 w-60 h-screen md:h-screen bg-card md:border-r flex flex-col transform transition-transform duration-200 ease-out md:transform-none ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand + mobile close */}
        <div className="h-14 px-5 flex items-center justify-between border-b">
          <Link
            href="/attendance"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold tracking-tight">
              CS
            </div>
            <span className="text-sm font-semibold tracking-tight">
              CreatorSuit
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden -mr-2 p-2 rounded-md hover:bg-subtle text-muted-foreground"
            aria-label="Close menu"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
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
                className={`group flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-subtle text-foreground'
                    : 'text-muted-foreground hover:bg-subtle hover:text-foreground'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                <span>{item.label}</span>
                {active ? (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User profile + sign-out, pinned to the bottom of the sidebar */}
        <div className="p-3 border-t bg-card">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar
              fullName={user.full_name}
              email={email}
              id={user.id}
              url={user.avatar_url}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {user.full_name || '—'}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {user.role}
              </div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors"
            >
              <LogoutIcon className="w-[18px] h-[18px]" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
