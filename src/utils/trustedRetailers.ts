/** Only major chains used for trusted pricing and price comparison. */
const TRUSTED_EXACT = new Set([
  'Walmart',
  'Best Buy',
  'Target',
  'Amazon',
  'Amazon.com',
]);

export function isTrustedRetailer(name: string): boolean {
  return TRUSTED_EXACT.has(name);
}
