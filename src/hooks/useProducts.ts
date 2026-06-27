import { useQuery } from '@tanstack/react-query';
import { Product } from '../types/product';
import { fetchProducts, ProductFilters } from '../services/api';

export const PRODUCTS_QUERY_KEY = ['products'] as const;

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
