import { MonthlyPricePoint, PriceObservationPoint, RetailerPriceSeries } from '../types/product';

function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

export function sortPointsByTime(points: PriceObservationPoint[]): PriceObservationPoint[] {
  return [...points].sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime(),
  );
}

/** Most recent observed price for a retailer (by `observed_at`). */
export function latestObservationPrice(
  points: PriceObservationPoint[] | undefined,
): number | null {
  if (!points?.length) return null;
  const sorted = sortPointsByTime(points);
  return sorted[sorted.length - 1]!.price;
}

/**
 * Groups observations by exact retailer string. Rows with null retailer are skipped
 * (not attributed to any chain).
 */
export function groupPointsByRetailer(
  points: PriceObservationPoint[],
): Map<string, PriceObservationPoint[]> {
  const map = new Map<string, PriceObservationPoint[]>();
  for (const p of points) {
    if (p.retailer == null || p.retailer === '') continue;
    if (!map.has(p.retailer)) map.set(p.retailer, []);
    map.get(p.retailer)!.push(p);
  }
  for (const arr of map.values()) {
    sortPointsByTime(arr);
  }
  return map;
}

export function aggregateToMonthlyPoints(points: PriceObservationPoint[]): MonthlyPricePoint[] {
  if (points.length === 0) return [];
  const sorted = sortPointsByTime(points);
  const byMonth = new Map<string, number[]>();
  for (const p of sorted) {
    const mk = monthKeyFromIso(p.observed_at);
    if (!byMonth.has(mk)) byMonth.set(mk, []);
    byMonth.get(mk)!.push(p.price);
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

/** Combine Amazon + Amazon.com observations for one "Amazon" line. */
export function mergeAmazonPoints(
  byRetailer: Map<string, PriceObservationPoint[]>,
): PriceObservationPoint[] {
  const out: PriceObservationPoint[] = [];
  for (const key of ['Amazon', 'Amazon.com'] as const) {
    const chunk = byRetailer.get(key);
    if (chunk) out.push(...chunk);
  }
  return sortPointsByTime(out);
}

/**
 * Builds one monthly series per requested retailer name using grouped raw points.
 */
export function buildRetailerSeriesForChart(
  byRetailer: Map<string, PriceObservationPoint[]>,
  retailerNames: string[],
): RetailerPriceSeries[] {
  return retailerNames.map((retailer) => ({
    retailer,
    data: aggregateToMonthlyPoints(byRetailer.get(retailer) ?? []),
  }));
}
