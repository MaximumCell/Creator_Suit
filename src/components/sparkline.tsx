'use client';

import { useId } from 'react';

/**
 * Tiny inline-SVG sparkline. Renders a single line + soft fill under it.
 * Designed to be dropped into a card with `text-*` colour tokens — the line
 * and fill take the current text colour so it adapts to any theme.
 */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  className = '',
  strokeWidth = 1.5,
}: {
  /** Values, in display order (oldest → newest). */
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const reactId = useId();
  // useId() includes ":" which is invalid in HTML id — sanitise.
  const gradId = `sparkline-fill-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1; // 1px padding top/bottom
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x.toFixed(2)} ${y.toFixed(2)}` : `L${x.toFixed(2)} ${y.toFixed(2)}`))
    .join(' ');

  const fillPath = `${linePath} L${width.toFixed(2)} ${height} L0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Final-value dot for a clean anchor. */}
      <circle
        cx={points[points.length - 1]![0]}
        cy={points[points.length - 1]![1]}
        r={strokeWidth + 0.5}
        fill="currentColor"
      />
    </svg>
  );
}
