/**
 * Brand mark for CreatorSuit. The mark is a soft, rounded "S" inside a
 * blue→purple gradient square — used in the nav, footer, and dashboard sidebar.
 */
export function Logo({
  size = 36,
  withWordmark = true,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative grid place-items-center rounded-xl shadow-blue"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.55}
          height={size * 0.55}
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 7h7a3 3 0 0 1 0 6h-3a3 3 0 0 0 0 6h7" />
        </svg>
      </span>
      {withWordmark ? (
        <span
          className="text-[15px] font-bold tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-varela-round)' }}
        >
          CreatorSuit
        </span>
      ) : null}
    </span>
  );
}
