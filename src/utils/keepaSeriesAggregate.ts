import { KeepaSeriesPoint, KeepaSeriesResponse, MonthlyPricePoint } from '../types/product';

function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * Collects points from selected tracks (or every key in `tracks` if `trackNames` omitted),
 * sorted by time ascending.
 */
export function flattenKeepaTracks(
  tracks: Record<string, KeepaSeriesPoint[]>,
  trackNames?: string[],
): KeepaSeriesPoint[] {
  const names =
    trackNames && trackNames.length > 0
      ? trackNames
      : Object.keys(tracks);
  const out: KeepaSeriesPoint[] = [];
  for (const name of names) {
    const arr = tracks[name];
    if (Array.isArray(arr)) out.push(...arr);
  }
  return [...out].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
}

export function keepaPointsToMonthlyPoints(points: KeepaSeriesPoint[]): MonthlyPricePoint[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  const byMonth = new Map<string, number[]>();
  for (const p of sorted) {
    const mk = monthKeyFromIso(p.t);
    if (!byMonth.has(mk)) byMonth.set(mk, []);
    byMonth.get(mk)!.push(p.v);
  }
  const months = [...byMonth.keys()].sort();
  return months.map((month) => {
    const prices = byMonth.get(month)!;
    const min_price = Math.min(...prices);
    const max_price = Math.max(...prices);
    const avg_price = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { month, min_price, max_price, avg_price };
  });
}

const DEFAULT_AMAZON_TRACKS = ['NEW', 'AMAZON'];

/**
 * Flattens preferred Keepa tracks and aggregates to monthly buckets for the Amazon chart line.
 */
export function keepaResponseToAmazonMonthly(
  resp: KeepaSeriesResponse,
  preferredTrackNames: string[] = DEFAULT_AMAZON_TRACKS,
): MonthlyPricePoint[] {
  const flat = flattenKeepaTracks(resp.tracks ?? {}, preferredTrackNames);
  return keepaPointsToMonthlyPoints(flat);
}
