/**
 * Fixed full-page ambient background — soft floating color orbs, a faint
 * grid, and a noise overlay. Tuned for the light theme (low opacity, no
 * hard edges). Pure CSS, no client JS, plays well with prefers-reduced-motion
 * via globals.css.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Faint grid pattern, top-faded */}
      <div className="grid-pattern absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)]" />

      {/* Floating blue orb, top-center */}
      <div
        className="float-slow absolute -top-40 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 65%)' }}
      />

      {/* Floating pink orb, mid-left */}
      <div
        className="float-medium absolute top-[28%] -left-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #f9a8d4 0%, transparent 65%)' }}
      />

      {/* Floating purple orb, mid-right */}
      <div
        className="float-slow absolute top-[55%] -right-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 65%)' }}
      />

      {/* Pulsing accent orb, bottom */}
      <div
        className="pulse-glow absolute bottom-0 left-1/3 h-[360px] w-[560px] rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 65%)' }}
      />

      {/* Subtle noise to add film grain (cheap SVG data-URI). */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
    </div>
  );
}
