import { useQuery } from '@tanstack/react-query';
import { Product } from '../types/product';
import { fetchProducts, fetchDeals, searchProducts, ProductFilters } from '../services/api';

export const PRODUCTS_QUERY_KEY = ['products'] as const;
export const DEALS_QUERY_KEY = ['deals'] as const;

export function useProducts(filters?: ProductFilters) {
  const queryKey = filters
    ? ['products', filters] as const
    : PRODUCTS_QUERY_KEY;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await fetchProducts(filters);
      return result.products as Product[];
    },
  });

  return {
    products: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load products') : null,
    refetch,
  };
}

/**
 * Server-computed "Best Deals Right Now" feed. Kept separate from useProducts so
 * the carousel reflects the dedicated /deals ranking rather than the currently
 * loaded/filtered product page.
 */
export function useDeals() {
  const { data } = useQuery({
    queryKey: DEALS_QUERY_KEY,
    queryFn: async () => {
      const result = await fetchDeals();
      return result.products as Product[];
    },
  });

  return { deals: data ?? [] };
}

/**
 * Catalog search by name and/or pasted product URL. Disabled until a non-empty
 * term is supplied so we don't fire a request on every keystroke of an empty box.
 */
export function useProductSearch(term: string) {
  const trimmed = term.trim();
  const looksLikeUrl = /^https?:\/\//i.test(trimmed);

  const { data, isLoading } = useQuery({
    queryKey: ['product-search', trimmed] as const,
    enabled: trimmed.length >= 2,
    queryFn: async () => {
      const result = await searchProducts(
        looksLikeUrl ? { url: trimmed } : { q: trimmed },
      );
      return result.products as Product[];
    },
  });

  return { results: data ?? [], searching: isLoading, active: trimmed.length >= 2 };
}
