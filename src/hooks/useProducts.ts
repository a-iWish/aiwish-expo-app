import { useCallback, useEffect, useState } from 'react';
import { Product } from '../types/product';
import { fetchProducts, fetchProduct, fetchPrediction } from '../services/api';
import { lowestCurrentOffer } from '../utils/lowestCurrentOffer';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();

      const details = await Promise.allSettled(
        data.products.map((p) => fetchProduct(p.id)),
      );

      const predictions = await Promise.allSettled(
        data.products.map((p) => fetchPrediction(p.id).catch(() => null)),
      );

      const enriched: Product[] = data.products.map((p, i) => {
        const result = details[i];
        const detail = result.status === 'fulfilled' ? result.value : null;
        const stats = detail?.stats;
        const offer = lowestCurrentOffer(p, stats ?? null);
        const trusted_price = offer?.price ?? null;
        const trusted_source = offer?.retailer ?? null;

        const predResult = predictions[i];
        const pred =
          predResult?.status === 'fulfilled'
            ? predResult.value
            : null;

        return {
          ...p,
          trusted_price,
          trusted_source,
          msrp: stats?.list_price ?? null,
          rating: stats?.rating ?? p.rating,
          reviews_count: stats?.review_count ?? p.reviews_count,
          recommendation: p.recommendation ?? pred?.recommendation ?? null,
          confidence: p.confidence ?? pred?.confidence ?? null,
          trend: p.trend ?? pred?.trend ?? null,
        };
      });

      setProducts(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { products, loading, error, refetch: load };
}
