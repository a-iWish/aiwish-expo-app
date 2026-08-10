/**
 * Date-only (YYYY-MM-DD) helpers that use LOCAL calendar components.
 *
 * Never use `Date#toISOString()` for a date-only value: it converts to UTC and
 * shifts the day for any non-UTC timezone (e.g. UTC+2 rolls midnight back to the
 * previous day). Likewise, `new Date("YYYY-MM-DD")` parses as UTC midnight, not
 * local. These keep the picked calendar day stable on the round-trip.
 */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
