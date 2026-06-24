import { useCallback, useEffect, useState } from 'react';
import {
  ProductDetail,
  MonthlyPricePoint,
  PredictionResponse,
  RetailerPriceRow,
  RetailerPriceSeries,
  PriceObservationPoint,
} from '../types/product';
import {
  fetchProduct,
  fetchPriceHistory,
  fetchPriceSeries,
  fetchKeepaSeries,
  fetchPrediction,
  fetchRetailers,
} from '../services/api';
import { keepaResponseToAmazonMonthly } from '../utils/keepaSeriesAggregate';
import { isTrustedRetailer } from '../utils/trustedRetailers';
import {
  aggregateToMonthlyPoints,
  buildRetailerSeriesForChart,
  groupPointsByRetailer,
  latestObservationPrice,
  mergeAmazonPoints,
} from '../utils/priceSeriesAggregate';

function lastMonthAvg(chartData: MonthlyPricePoint[]): number | null {
  if (!chartData.length) return null;
  return chartData[chartData.length - 1].avg_price;
}

/** Amazon pricing in comparison comes from Keepa, not Google Shopping history. */
function isAmazonRetailerName(name: string): boolean {
  return name === 'Amazon' || name === 'Amazon.com' || name.startsWith('Amazon ');
}

/** Carousel order: Walmart, Amazon, Best Buy, Target. */
function bigFourRank(row: RetailerPriceRow): number {
  if (row.retailer === 'Walmart') return 0;
  if (row.source === 'amazon') return 1;
  if (row.retailer === 'Best Buy') return 2;
  if (row.retailer === 'Target') return 3;
  return 4;
}

function sortComparisonRows(rows: RetailerPriceRow[]): RetailerPriceRow[] {
  return [...rows].sort((a, b) => {
    const ra = bigFourRank(a);
    const rb = bigFourRank(b);
    if (ra !== rb) return ra - rb;
    if (a.price == null && b.price == null) return a.retailer.localeCompare(b.retailer);
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });
}

async function fetchMonthlyFallback(
  productId: string,
  retailer: string,
): Promise<MonthlyPricePoint[]> {
  try {
    const h = await fetchPriceHistory(productId, 12, retailer);
    return h.chart_data ?? [];
  } catch {
    return [];
  }
}

/** Legacy monthly API when raw series has no rows for Amazon keys. */
async function fetchAmazonHistorySeriesLegacy(productId: string): Promise<RetailerPriceSeries | null> {
  for (const name of ['Amazon', 'Amazon.com'] as const) {
    const data = await fetchMonthlyFallback(productId, name);
    if (data.length > 0) {
      return { retailer: 'Amazon', data };
    }
  }
  return null;
}

export function useProductDetail(productId: string, deadline?: string | null) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [priceHistory, setPriceHistory] = useState<MonthlyPricePoint[]>([]);
  const [allRetailerSeries, setAllRetailerSeries] = useState<RetailerPriceSeries[]>([]);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [retailers, setRetailers] = useState<string[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState<string | null>(null);
  const [comparisonRows, setComparisonRows] = useState<RetailerPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [detail, pred, ret] = await Promise.all([
          fetchProduct(productId),
          fetchPrediction(productId, deadline).catch(() => null),
          fetchRetailers(productId).catch(() => ({ retailers: [] as string[] })),
        ]);

        if (cancelled) return;

        const deduped = [...new Set(ret?.retailers ?? [])];
        const trustedRetailers = deduped.filter(isTrustedRetailer);
        const retailersForHistory = trustedRetailers.filter((r) => !isAmazonRetailerName(r));

        const defaultRetailer = retailersForHistory[0] ?? null;

        const [seriesRes, keepaRes] = await Promise.all([
          fetchPriceSeries(productId, 12, undefined, 10000).catch(() => ({
            points: [] as PriceObservationPoint[],
          })),
          fetchKeepaSeries(productId).catch(() => null),
        ]);
        const allPoints: PriceObservationPoint[] = seriesRes.points ?? [];

        if (cancelled) return;

        const byRetailer = groupPointsByRetailer(allPoints);

        const builtTrusted = buildRetailerSeriesForChart(byRetailer, retailersForHistory);
        const seriesList: RetailerPriceSeries[] = await Promise.all(
          builtTrusted.map(async (series) => {
            if (series.data.length === 0) {
              const data = await fetchMonthlyFallback(productId, series.retailer);
              return { retailer: series.retailer, data };
            }
            return series;
          }),
        );

        const keepaMonthly = keepaRes ? keepaResponseToAmazonMonthly(keepaRes) : [];
        const amazonFromRaw = aggregateToMonthlyPoints(mergeAmazonPoints(byRetailer));
        let amazonHistorySeries: RetailerPriceSeries | null = null;
        if (keepaMonthly.length > 0) {
          amazonHistorySeries = { retailer: 'Amazon', data: keepaMonthly };
        } else if (amazonFromRaw.length > 0) {
          amazonHistorySeries = { retailer: 'Amazon', data: amazonFromRaw };
        } else {
          amazonHistorySeries = await fetchAmazonHistorySeriesLegacy(productId);
        }

        const combinedSeries = amazonHistorySeries
          ? [...seriesList, amazonHistorySeries]
          : seriesList;

        const retailersForChart =
          amazonHistorySeries && amazonHistorySeries.data.length > 0
            ? [...retailersForHistory, 'Amazon']
            : retailersForHistory;

        const defaultHistory = defaultRetailer
          ? combinedSeries.find((s) => s.retailer === defaultRetailer)?.data ?? []
          : [];

        const amazonPrice = detail.stats?.amazon_price ?? detail.stats?.new_price ?? null;

        const historyRows: RetailerPriceRow[] = retailersForHistory.map((r) => {
          const chunk = seriesList.find((s) => s.retailer === r)?.data ?? [];
          const latest = latestObservationPrice(byRetailer.get(r));
          const monthly = lastMonthAvg(chunk);
          const price = latest ?? monthly;
          let historyBasis: RetailerPriceRow['historyBasis'];
          if (price != null) {
            historyBasis = latest != null ? 'latest_observation' : 'monthly_avg';
          }
          return {
            retailer: r,
            price,
            source: 'history' as const,
            historyBasis,
          };
        });

        const rows: RetailerPriceRow[] = [...historyRows];
        if (amazonPrice != null) {
          rows.push({
            retailer: 'Amazon',
            price: amazonPrice,
            source: 'amazon',
          });
        }

        if (cancelled) return;
        setProduct(detail);
        setAllRetailerSeries(combinedSeries);
        setPriceHistory(defaultHistory);
        setPrediction(pred);
        setRetailers(retailersForChart);
        setSelectedRetailer(defaultRetailer);
        setComparisonRows(sortComparisonRows(rows));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [productId, deadline]);

  const selectRetailer = useCallback(
    (retailer: string | null) => {
      setSelectedRetailer(retailer);
      if (retailer != null) {
        const found = allRetailerSeries.find((s) => s.retailer === retailer);
        setPriceHistory(found?.data ?? []);
      }
    },
    [allRetailerSeries],
  );

  return {
    product,
    priceHistory,
    allRetailerSeries,
    prediction,
    retailers,
    selectedRetailer,
    selectRetailer,
    comparisonRows,
    loading,
    error,
  };
}
