import { useQuery } from '@tanstack/react-query';
import { Product } from '../types/product';
import { fetchProducts } from '../services/api';

export const PRODUCTS_QUERY_KEY = ['products'] as const;

export function useProducts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const result = await fetchProducts();
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
