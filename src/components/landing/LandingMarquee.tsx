/**
 * Marquee strip — infinite horizontal scroll of product words. Sits between
 * the hero and the features section to give the page rhythm (and to mirror
 * the "Logos" marquee from the Zenith reference). Fades at the edges via
 * a mask-image so the loop is invisible.
 */
const words = [
  'ATTENDANCE',
  'YOUTUBE STATS',
  'CONTENT PIPELINE',
  'KANBAN',
  'AUTO-CLOSE',
  'OAUTH',
  'GROWTH DELTAS',
  'REVENUE',
  'CHANNEL TRACKING',
  'SPARKLINES',
  'DRAG & DROP',
  'PER-CHANNEL',
];

export function LandingMarquee() {
  return (
    <section
      aria-hidden
      className="border-y border-border/60 bg-surface/40 py-8 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          What's inside the workspace
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="animate-marquee flex w-max gap-12">
            {[...words, ...words].map((w, i) => (
              <span
                key={i}
                className="font-mono text-base font-semibold text-muted-foreground/80 sm:text-lg"
                style={{ fontFamily: 'var(--font-varela-round)' }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
