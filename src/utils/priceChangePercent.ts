/**
 * Percent change from a reference (e.g. MSRP) to the current price:
 * (current - reference) / reference × 100.
 * Negative when current is below reference (savings vs list). Matches PriceDisplay (green when negative).
 */
export function percentChangeVsReference(
  current: number | null | undefined,
  reference: number | null | undefined,
): number | null {
  if (current == null || reference == null || reference <= 0) return null;
  return ((current - reference) / reference) * 100;
}
