'use client';

import Link from 'next/link';
import { ArrowRightIcon, PlayIcon, SparkleIcon } from '@/components/icons';
import { DashboardMock } from './DashboardMock';
import { useMouseTilt, useReveal } from '@/lib/animations';

export function LandingHero() {
  const tiltRef = useMouseTilt<HTMLDivElement>(4);
  const badgeRef = useReveal<HTMLDivElement>(0.2);
  const headingRef = useReveal<HTMLHeadingElement>(0.2);
  const subRef = useReveal<HTMLParagraphElement>(0.2);
  const ctaRef = useReveal<HTMLDivElement>(0.2);
  const trustRef = useReveal<HTMLDivElement>(0.2);
  const mockRef = useReveal<HTMLDivElement>(0.1);

  return (
    <section className="relative px-4 pt-28 pb-20 sm:pt-36 sm:pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Hero card — one large white card with everything inside, matching
            the screenshot aesthetic. */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-12 shadow-lg sm:px-10 sm:py-16">
          {/* Soft accent blobs in the background */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full opacity-30 blur-3xl float-slow"
            style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full opacity-30 blur-3xl float-medium"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <SparkleIcon className="h-3 w-3 text-accent" />
              For the Aaghaz AI team
            </div>

            <h1
              ref={headingRef}
              className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight opacity-0 sm:text-5xl md:text-6xl"
              style={{ animationDelay: '0.1s' }}
            >
              The productivity OS{' '}
              <span className="text-gradient-blue">built for creators.</span>
            </h1>

            <p
              ref={subRef}
              className="mx-auto mt-5 max-w-xl text-base text-muted-foreground opacity-0 sm:text-lg"
              style={{ animationDelay: '0.2s' }}
            >
              Attendance, YouTube analytics, and a full content pipeline — unified
              in one workspace, engineered for the Aaghaz AI team.
            </p>

            <div
              ref={ctaRef}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 opacity-0"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-blue transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Open dashboard
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-surface-2"
              >
                <PlayIcon className="h-4 w-4 text-primary" />
                Watch overview
              </a>
            </div>

            <div
              ref={trustRef}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground opacity-0"
              style={{ animationDelay: '0.4s' }}
            >
              {['SSO ready', 'Role-based access', 'Realtime sync', 'No credit card'].map(
                (s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {s}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* The dashboard preview sits inside the same hero card */}
          <div
            ref={mockRef}
            className="relative mx-auto mt-12 max-w-5xl opacity-0"
            style={{ animationDelay: '0.5s' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl opacity-50 blur-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(236,72,153,0.20))',
              }}
            />
            <DashboardMock tiltRef={tiltRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
