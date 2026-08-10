import { PredictionResponse, PredictionSummary } from '../types/product';

/**
 * Prefer the freshly-fetched `/prediction` response: it reflects the current
 * deadline (deadline-adjusted when one is set) and is at least as fresh as the
 * snapshot embedded on the product. Fall back to the embedded prediction only
 * while the dedicated response is absent (e.g. still loading / not available).
 */
export function mergePredictionSummary(
  embedded: PredictionSummary | null | undefined,
  fromApi: PredictionResponse | null | undefined,
): PredictionSummary | null {
  if (fromApi) {
    return {
      model_name: fromApi.model_name,
      recommendation: fromApi.recommendation,
      confidence: fromApi.confidence,
      trend: fromApi.trend,
      title: fromApi.title,
      body: fromApi.body,
      savings_amount: fromApi.savings_amount ?? null,
      expected_drop_pct: fromApi.expected_drop_pct ?? null,
      estimated_best_price: fromApi.estimated_best_price ?? null,
      estimated_wait_days: fromApi.estimated_wait_days ?? null,
      reasons: fromApi.reasons ?? [],
    };
  }
  return embedded ?? null;
}
