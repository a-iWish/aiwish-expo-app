/** Distinct line color per retailer for charts (matches price comparison accents). */
export function retailerLineColor(retailer: string): string {
  if (retailer === 'Walmart') return '#0071CE';
  if (retailer === 'Best Buy') return '#0046BE';
  if (retailer === 'Target') return '#CC0000';
  if (retailer === 'Amazon' || retailer.startsWith('Amazon')) return '#FF9900';
  return '#06B6D4';
}
