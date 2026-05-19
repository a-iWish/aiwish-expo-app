import { VerdictKey } from './verdictStyle';

export function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Hide titles that repeat the verdict headline (e.g. BUY + "Buy Now"). */
export function insightHeadline(
  title: string | undefined,
  verdictKey: VerdictKey,
): string | null {
  if (!title?.trim()) return null;
  const normalized = title.trim().toLowerCase();
  const verdict = (verdictKey ?? '').toLowerCase();
  if (normalized === verdict) return null;
  if (
    verdict === 'buy' &&
    (normalized === 'buy now' ||
      normalized === 'good price now' ||
      normalized.startsWith('buy now'))
  ) {
    return null;
  }
  if (verdict === 'wait' && normalized.includes('wait')) return null;
  if (verdict === 'hold' && normalized.includes('watch')) return null;
  return capitalizeFirst(title);
}

export function humanizeSummary(
  body: string | undefined,
  reasons: string[],
): string {
  if (reasons.length > 0) {
    return capitalizeFirst(reasons[0]);
  }
  if (!body?.trim()) {
    return 'We are still collecting enough price history for a full recommendation.';
  }
  let text = body.trim();
  text = text.replace(/^ensemble\s+/i, 'The model ');
  return capitalizeFirst(text);
}
