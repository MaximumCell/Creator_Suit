import Link from 'next/link';
import { Logo } from './Logo';

const cols = [
  {
    title: 'Product',
    links: [
      { href: '#features', label: 'Features' },
      { href: '#workflow', label: 'How it works' },
      { href: '#modules', label: 'Modules' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Team',
    links: [
      { href: '/attendance', label: 'Attendance' },
      { href: '/content', label: 'Content pipeline' },
      { href: '/youtube', label: 'YouTube analytics' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: 'mailto:admin@aaghaz.ai', label: 'Contact admin' },
      { href: '/login', label: 'Sign in' },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="px-4 pb-10 pt-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-border bg-surface px-6 py-10 shadow-sm sm:px-10">
          <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                The productivity OS engineered for the Aaghaz AI team.
                Internal build — v2.0.
              </p>
            </div>
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.title}
                </div>
                <ul className="mt-3 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <div>© {new Date().getFullYear()} CreatorSuit · Aaghaz AI internal</div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
