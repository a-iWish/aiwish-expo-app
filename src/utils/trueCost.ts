/**
 * True-cost estimate: sticker price + estimated sales tax + estimated shipping.
 *
 * The price collector does not capture per-offer tax or shipping, so these are
 * transparent ESTIMATES (always surfaced to the user as such), not quotes:
 *   - Tax: a flat default rate (US average ~7.5%); callers can override.
 *   - Shipping: free if the delivery text mentions free shipping or the price
 *     clears the common free-shipping threshold; otherwise a flat fallback.
 */

/** US average combined state+local sales tax, used when no region is known. */
export const DEFAULT_TAX_RATE = 0.075;

/** Most major retailers ship free above this order value. */
const FREE_SHIPPING_THRESHOLD = 35;

/** Flat fallback when shipping isn't free and we have no better signal. */
const FLAT_SHIPPING = 5.99;

export interface TrueCost {
  price: number;
  tax: number;
  shipping: number;
  total: number;
  /** True when shipping was assumed free (threshold or delivery text). */
  shippingFree: boolean;
}

function deliveryMentionsFree(deliveryText?: string | null): boolean {
  if (!deliveryText) return false;
  return /free/i.test(deliveryText);
}

export function estimateShipping(price: number, deliveryText?: string | null): number {
  if (deliveryMentionsFree(deliveryText)) return 0;
  if (price >= FREE_SHIPPING_THRESHOLD) return 0;
  return FLAT_SHIPPING;
}

export interface TrueCostOptions {
  taxRate?: number;
  deliveryText?: string | null;
}

export function estimateTrueCost(price: number, options: TrueCostOptions = {}): TrueCost {
  const taxRate = options.taxRate ?? DEFAULT_TAX_RATE;
  const tax = price * taxRate;
  const shipping = estimateShipping(price, options.deliveryText);
  return {
    price,
    tax,
    shipping,
    total: price + tax + shipping,
    shippingFree: shipping === 0,
  };
}
