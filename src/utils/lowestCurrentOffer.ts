import { KeepaStats, Product } from '../types/product';
import { isTrustedRetailer } from './trustedRetailers';

export interface LowestCurrentOffer {
  price: number;
  retailer: string;
}

/**
 * Cheapest "buy now" style price among Keepa Amazon quotes and the list product’s
 * current_price when it’s from a trusted retailer (Walmart, Target, Best Buy, Amazon).
 */
export function lowestCurrentOffer(
  listProduct: Pick<Product, 'current_price' | 'retailer'>,
  stats: KeepaStats | null | undefined,
): LowestCurrentOffer | null {
  const candidates: LowestCurrentOffer[] = [];

  if (stats?.amazon_price != null) {
    candidates.push({ price: stats.amazon_price, retailer: 'Amazon' });
  }
  if (stats?.new_price != null) {
    candidates.push({ price: stats.new_price, retailer: 'Amazon' });
  }
  if (stats?.new_fba_price != null) {
    candidates.push({ price: stats.new_fba_price, retailer: 'Amazon' });
  }

  const r = listProduct.retailer;
  if (listProduct.current_price != null && r && isTrustedRetailer(r)) {
    candidates.push({ price: listProduct.current_price, retailer: r });
  }

  if (candidates.length === 0) return null;

  let best = candidates[0]!;
  for (let i = 1; i < candidates.length; i++) {
    const next = candidates[i]!;
    if (next.price < best.price) best = next;
  }
  return best;
}
