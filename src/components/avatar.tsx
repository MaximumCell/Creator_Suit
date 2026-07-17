'use client';

import { useState } from 'react';
import {
  DEFAULT_AVATAR_STYLE,
  dicebearUrl,
  getInitials,
  userSeed,
  type DiceBearStyle,
} from '@/lib/avatar';

interface AvatarProps {
  fullName: string;
  email?: string | null;
  id?: string | null;
  /** Optional override URL — if set, this image is used directly. */
  url?: string | null;
  size?: number;
  className?: string;
  style?: DiceBearStyle;
}

/**
 * Round user avatar. Tries (in order):
 *  1. `url` (user-uploaded / override)
 *  2. DiceBear generated image seeded by email/id
 *  3. Initials on a colored background
 *
 * The DiceBear <img> is given an onError handler so a failed network request
 * gracefully falls back to initials instead of showing a broken icon.
 */
export function Avatar({
  fullName,
  email,
  id,
  url,
  size = 36,
  className = '',
  style = DEFAULT_AVATAR_STYLE,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(fullName);
  const seed = userSeed({ email, fullName, id });
  const fallbackUrl = url || dicebearUrl(seed, style);

  // Deterministic but pleasant background color from the seed hash.
  const bg = pickColor(seed);

  const dim = { width: size, height: size };

  if (failed || !fallbackUrl) {
    return (
      <div
        style={{ ...dim, background: bg }}
        className={`inline-flex items-center justify-center rounded-full text-white font-semibold select-none ${className}`}
        aria-label={fullName}
      >
        <span style={{ fontSize: size * 0.4 }}>{initials}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fallbackUrl}
      alt={fullName}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`inline-block rounded-full bg-subtle object-cover ${className}`}
      style={dim}
    />
  );
}

/** Pick a stable, pleasant background color from a string. */
function pickColor(seed: string): string {
  const palette = [
    '#475569', // slate-600
    '#0f766e', // teal-700
    '#7c3aed', // violet-600
    '#be185d', // pink-700
    '#b45309', // amber-700
    '#1d4ed8', // blue-700
    '#15803d', // green-700
    '#a21caf', // fuchsia-700
    '#0369a1', // sky-700
    '#9a3412', // orange-800
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length]!;
}
