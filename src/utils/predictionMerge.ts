import { PredictionResponse, PredictionSummary } from '../types/product';

/**
 * Prefer prediction embedded on the product; otherwise map the dedicated /prediction response.
 */
export function mergePredictionSummary(
  embedded: PredictionSummary | null | undefined,
  fromApi: PredictionResponse | null | undefined,
): PredictionSummary | null {
  if (embedded) return embedded;
  if (!fromApi) return null;
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
