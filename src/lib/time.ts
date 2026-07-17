/** Format minutes as "Hh Mm" (e.g. 125 -> "2h 5m", 45 -> "45m"). */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Human-friendly elapsed time from a past timestamp until now. */
export function formatElapsed(fromIso: string, now = Date.now()): string {
  const start = new Date(fromIso).getTime();
  if (Number.isNaN(start)) return '—';
  const diffMs = Math.max(0, now - start);
  const totalMinutes = Math.floor(diffMs / 60_000);
  return formatDuration(totalMinutes);
}

/** Format an ISO timestamp in the user's local timezone. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format an ISO timestamp as a local date (e.g. "Fri, 17 Jul 2026"). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** YYYY-MM-DD in local time, suitable for <input type="date" /> defaults. */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Sum duration_minutes across logs, ignoring open (null) rows. */
export function sumMinutes(logs: { duration_minutes: number | null }[]): number {
  return logs.reduce(
    (acc, l) => acc + (l.duration_minutes ?? 0),
    0,
  );
}
