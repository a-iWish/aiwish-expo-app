/**
 * Best-time-to-buy heuristic: which calendar month historically has the lowest
 * average price for this product. Aggregates monthly history across years by
 * calendar month so seasonal dips (e.g. November/Black Friday) surface.
 */
import { MonthlyPricePoint } from '../types/product';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface BestMonthInsight {
  monthIndex: number;
  monthName: string;
  /** % the best month sits below the overall average (positive = cheaper). */
  belowAvgPct: number;
}

export function bestMonthToBuy(history: MonthlyPricePoint[] | undefined | null): BestMonthInsight | null {
  if (!history || history.length < 6) return null;

  // Sum avg_price per calendar month (0-11), ignoring missing values.
  const sums = new Array<number>(12).fill(0);
  const counts = new Array<number>(12).fill(0);
  let overallSum = 0;
  let overallCount = 0;

  for (const point of history) {
    const avg = point.avg_price;
    if (avg == null || !Number.isFinite(avg)) continue;
    const monthNum = Number(point.month.slice(5, 7)) - 1; // 'YYYY-MM' -> 0-11
    if (monthNum < 0 || monthNum > 11) continue;
    sums[monthNum] += avg;
    counts[monthNum] += 1;
    overallSum += avg;
    overallCount += 1;
  }

  if (overallCount === 0) return null;
  const overallAvg = overallSum / overallCount;
  if (overallAvg <= 0) return null;

  let bestIndex = -1;
  let bestAvg = Infinity;
  for (let i = 0; i < 12; i += 1) {
    if (counts[i] === 0) continue;
    const monthAvg = sums[i] / counts[i];
    if (monthAvg < bestAvg) {
      bestAvg = monthAvg;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) return null;
  const belowAvgPct = ((overallAvg - bestAvg) / overallAvg) * 100;
  // Only surface a meaningful seasonal dip.
  if (belowAvgPct < 2) return null;

  return {
    monthIndex: bestIndex,
    monthName: MONTH_NAMES[bestIndex],
    belowAvgPct,
  };
}
