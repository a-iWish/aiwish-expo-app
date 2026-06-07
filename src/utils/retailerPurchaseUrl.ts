/**
 * Builds a retailer purchase URL when possible; otherwise Google search fallback.
 */
export function buildRetailerPurchaseUrl(productName: string, retailer: string): string {
  const q = encodeURIComponent(productName.trim());
  const r = retailer.trim().toLowerCase();

  if (r.includes('amazon')) {
    return `https://www.amazon.com/s?k=${q}`;
  }
  if (r.includes('walmart')) {
    return `https://www.walmart.com/search?q=${q}`;
  }
  if (r.includes('target')) {
    return `https://www.target.com/s?searchTerm=${q}`;
  }
  if (r.includes('best buy') || r.includes('bestbuy')) {
    return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${productName} ${retailer}`)}`;
}
