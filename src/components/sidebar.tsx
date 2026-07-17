'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/login/actions';
import type { User } from '@/types/database';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/attendance', label: 'Attendance', icon: '🕒' },
  { href: '/youtube', label: 'YouTube Stats', icon: '📺' },
  { href: '/content', label: 'Content Pipeline', icon: '🗂️' },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between border-b bg-card px-4 py-3 sticky top-0 z-20">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-medium flex items-center gap-2"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="inline-block w-5 text-center">☰</span>
          <span>CreatorSuit</span>
        </button>
        <span className="text-xs text-muted">
          {user.full_name} · {user.role}
        </span>
      </header>

      {/* Backdrop on mobile */}
      {open ? (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/30 z-10"
        />
      ) : null}

      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transform transition-transform fixed md:static inset-y-0 left-0 z-20 w-64 bg-card border-r flex flex-col`}
      >
        <div className="p-5 border-b">
          <div className="font-semibold text-lg">CreatorSuit</div>
          <div className="text-xs text-muted">Aaghaz AI · internal</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-foreground'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium uppercase">
              {(user.full_name || user.id).slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {user.full_name || '—'}
              </div>
              <div className="text-xs text-muted capitalize">{user.role}</div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left text-sm text-muted hover:text-foreground py-1"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
