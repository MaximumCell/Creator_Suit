/**
 * Avatar generation. We default to DiceBear's free HTTP API — no key, no
 * signup, no rate-limit pain for our use case. Same seed always yields the
 * same avatar, so users get a stable face across sessions.
 *
 * If `avatar_url` is set on the user record (future: a user-uploaded photo),
 * we use that instead.
 */

export type DiceBearStyle =
  | 'lorelei' // illustrated, gender-neutral, friendly — our default
  | 'notionists' // clean line art, Notion-style
  | 'thumbs' // colorful illustrated thumbs
  | 'avataaars' // cartoon style
  | 'shapes' // geometric, very minimal
  | 'personas' // abstract silhouette
  | 'initials' // monogram, very plain
  | 'fun-emoji' // emoji face
  | 'bottts' // robot
  | 'big-smile' // smiling face
  | 'micah' // illustrated portraits
  | 'miniavs' // pixel art
  | 'open-peeps' // illustrated
  | 'pixel-art' // 8-bit
  | 'adventurer' // RPG portrait
  | 'big-ears' // illustrated
  | 'croodles' // drawn
  | 'identicon' // geometric pattern
  | 'rings' // concentric circles
  | 'shiba' // dog
  | 'cats' // cat
  | 'hijab' // illustrated with hijab options
  | 'marcus' // illustrated male
  | 'alex' // illustrated neutral
  | 'stefan' // illustrated male
  | 'vincent' // illustrated male
  | 'beam' // geometric
  | 'bottts-neutral' // robot neutral
  | 'lorelei-neutral' // lorelei without accessories
  | 'dylan' // illustrated
  | 'mahadeva' // illustrated
  | 'evil-genius' // cartoon villain
  | 'ice-cream' // ice cream cone
  | 'ferdinand' // cow
  | 'panda' // panda
  | 'bear' // bear
  | 'koala' // koala
  | 'fox' // fox
  | 'owl' // owl
  | 'tiger' // tiger
  | 'pig' // pig
  | 'wolf' // wolf
  | 'frog' // frog
  | 'zombie' // zombie
  | 'monster' // monster
  | 'ghost' // ghost
  | 'crab' // crab
  | 'jelly' // jellyfish
  | 'snake' // snake
  | 'turtle' // turtle
  | 'chameleon' // chameleon
  | 'fish' // fish
  | 'duck' // duck
  | 'robohash' // robot
  | 'vitae' // portrait
  | 'gummy' // candy
  | 'bauhaus' // geometric
  | 'pattern'; // repeating pattern

export const DEFAULT_AVATAR_STYLE: DiceBearStyle = 'lorelei';

const API_VERSION = '9.x';
const BASE_URL = `https://api.dicebear.com/${API_VERSION}`;

/**
 * Returns a deterministic DiceBear SVG URL for the given seed.
 * The seed is whatever uniquely identifies the user (email, id, name).
 */
export function dicebearUrl(seed: string, style: DiceBearStyle = DEFAULT_AVATAR_STYLE): string {
  const s = (seed || 'anonymous').trim() || 'anonymous';
  // DiceBear seeds are case-insensitive but render the same; URL-encode
  // special chars in case email contains `+` or `@` etc.
  const params = new URLSearchParams({ seed: s });
  return `${BASE_URL}/${style}/svg?${params.toString()}`;
}

/** Pulls a stable seed for a user record. */
export function userSeed(opts: {
  email?: string | null;
  fullName?: string | null;
  id?: string | null;
}): string {
  return (opts.email || opts.id || opts.fullName || 'anonymous').trim();
}

/** Two-letter initials for a name. Used as the fallback when the image fails. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
