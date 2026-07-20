import { LoginForm } from './login-form';
import { Logo } from '@/components/landing/Logo';
import { ArrowRightIcon, ShieldIcon } from '@/components/icons';

export const metadata = {
  title: 'Sign in · CreatorSuit',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      {/* Soft background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f9a8d4 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center justify-center">
        <div className="w-full rounded-3xl border border-border bg-surface p-7 shadow-lg sm:p-9">
          <div className="mb-7 flex flex-col items-center text-center">
            <Logo size={48} withWordmark={false} />
            <h1
              className="mt-5 text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-varela-round)' }}
            >
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your CreatorSuit workspace
            </p>
          </div>

          <LoginForm searchParamsPromise={searchParams} />

          <div className="mt-7 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-[11px] text-muted-foreground">
            <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Internal build · access is restricted to <strong>@aaghaz.ai</strong> team emails.
            </span>
          </div>
        </div>

        <a
          href="/"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          Back to homepage
          <ArrowRightIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      </div>
    </main>
  );
}
