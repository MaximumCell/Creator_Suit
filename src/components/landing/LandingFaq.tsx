'use client';

/**
 * FAQ — accordion-style Q&A. Native <details> for zero-JS. Header
 * reveals on scroll, items have a subtle hover lift.
 */
import { useReveal } from '@/lib/animations';

const faqs = [
  {
    q: 'Who can use CreatorSuit?',
    a: 'Anyone on the Aaghaz AI team with a verified @aaghaz.ai email. Admins can add new members from the team view.',
  },
  {
    q: 'Is my YouTube data private?',
    a: "Tokens are encrypted at rest and only used to read your channel's analytics. We never post, comment, or modify anything on your behalf.",
  },
  {
    q: 'What happens if I forget to clock out?',
    a: "We auto-close any stale open session at 23:59 of that day, so you'll get a clean slate the next morning and a banner explaining what happened.",
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Attendance logs are exportable to CSV from the personal log. YouTube and content data live in Supabase and can be queried directly.',
  },
  {
    q: 'Is this open source?',
    a: 'No — it is an internal build for the Aaghaz AI team only. Source lives in a private repo.',
  },
] as const;

export function LandingFaq() {
  const headerRef = useReveal<HTMLDivElement>(0.2);
  return (
    <section id="faq" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div ref={headerRef} className="text-center opacity-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            FAQ
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Common questions.
          </h2>
        </div>

        <div className="mt-10 space-y-2.5">
          {faqs.map((f, i) => (
            <div
              key={f.q}
              className="opacity-0 fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <details
                className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  <span>{f.q}</span>
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition-transform group-open:rotate-45"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
