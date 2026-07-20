'use client';

import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from '@/components/icons';
import { useReveal } from '@/lib/animations';

export function LandingCta() {
  const ref = useReveal<HTMLDivElement>(0.15);
  return (
    <section id="cta" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div
          ref={ref}
          className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-12 text-center opacity-0 shadow-2xl sm:px-10 sm:py-16"
          style={{
            background:
              'linear-gradient(135deg, #1e3a8a 0%, #5b21b6 50%, #831843 100%)',
          }}
        >
          {/* Animated shifting gradient layer */}
          <div
            aria-hidden
            className="animate-gradient-shift pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                'linear-gradient(120deg, rgba(96,165,250,0.35), transparent 40%, rgba(236,72,153,0.30) 70%, transparent)',
            }}
          />
          {/* Slow-spinning conic mesh behind the text */}
          <div
            aria-hidden
            className="spin-slow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                'conic-gradient(from 180deg at 50% 50%, #3b82f6 0deg, #ec4899 120deg, #7c3aed 240deg, #3b82f6 360deg)',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Get started
            </div>
            <h2
              className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-varela-round)' }}
            >
              The team is already inside.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
              Sign in with your Aaghaz email and pick up where you left off. New
              here? Ask an admin to add you.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#1e3a8a] shadow-md transition-all hover:-translate-y-0.5"
              >
                Open dashboard
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="mailto:admin@aaghaz.ai"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Request access
              </a>
            </div>

            <ul className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70">
              {['No credit card', 'Cancel anytime', 'Internal-only build'].map(
                (s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <CheckIcon className="h-3 w-3 text-emerald-300" />
                    {s}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
