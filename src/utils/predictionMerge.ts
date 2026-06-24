import { PredictionResponse, PredictionSummary } from '../types/product';

function apiToSummary(fromApi: PredictionResponse): PredictionSummary {
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
    deadline: fromApi.deadline ?? null,
    days_until_deadline: fromApi.days_until_deadline ?? null,
    deadline_urgency: fromApi.deadline_urgency ?? null,
    deadline_adjusted: fromApi.deadline_adjusted ?? false,
  };
}

/**
 * Prefer the prediction embedded on the product; otherwise map the dedicated
 * /prediction response.
 *
 * Exception: when the API response carries a `deadline`, it is the
 * deadline-aware answer (only the /prediction endpoint runs the deadline
 * policy), so it takes precedence over the non-deadline-aware embedded one.
 */
export function mergePredictionSummary(
  embedded: PredictionSummary | null | undefined,
  fromApi: PredictionResponse | null | undefined,
): PredictionSummary | null {
  if (fromApi?.deadline) return apiToSummary(fromApi);
  if (embedded) return embedded;
  if (!fromApi) return null;
  return apiToSummary(fromApi);
}
