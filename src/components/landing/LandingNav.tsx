import Link from 'next/link';
import { Logo } from './Logo';
import { ArrowRightIcon } from '@/components/icons';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'How it works' },
  { href: '#modules', label: 'Modules' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNav() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border bg-surface/90 px-4 py-2.5 shadow-md backdrop-blur-md">
        <Link href="/" className="pl-1">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-blue transition-all hover:bg-primary-hover hover:-translate-y-0.5"
          >
            Open dashboard
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
