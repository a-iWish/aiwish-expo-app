import {
  ProductListResponse,
  ProductDetail,
  PriceHistoryResponse,
  PriceSeriesResponse,
  KeepaSeriesResponse,
  PredictionResponse,
  RetailersResponse,
  WishlistItem,
  WishlistResponse,
} from '../types/product';
import { apiFetch } from './httpClient';

function normalizeRecommendation(rec: unknown): string {
  const v = String(rec ?? '').trim().toLowerCase();
  if (v === 'buy' || v === 'wait' || v === 'hold') return v;
  return v || 'wait';
}

function normalizePredictionResponse(raw: any): PredictionResponse {
  const reasons =
    raw?.reasons ??
    raw?.recommendation_reasons ??
    raw?.recommendationReasons ??
    [];

  return {
    product_id: String(raw?.product_id ?? raw?.productId ?? ''),
    model_name: String(raw?.model_name ?? raw?.model_version ?? raw?.modelVersion ?? raw?.model ?? 'Unknown'),
    generated_at: String(raw?.generated_at ?? raw?.predicted_at ?? raw?.predictedAt ?? new Date().toISOString()),
    horizon_days: Number(raw?.horizon_days ?? raw?.horizonDays ?? raw?.horizon ?? 14),
    current_price: raw?.current_price ?? raw?.currentPrice ?? null,
    forecast: Array.isArray(raw?.forecast) ? raw.forecast : [],
    trend: String(raw?.trend ?? 'stable'),
    confidence: Number(raw?.confidence ?? 0),
    recommendation: normalizeRecommendation(raw?.recommendation ?? raw?.predicted_class ?? raw?.predictedClass),
    title: String(raw?.title ?? raw?.recommendation_title ?? raw?.recommendationTitle ?? ''),
    body: String(raw?.body ?? raw?.recommendation_body ?? raw?.recommendationBody ?? raw?.reason ?? ''),
    savings_amount: raw?.savings_amount ?? raw?.savingsAmount ?? null,
    expected_drop_pct:
      raw?.expected_drop_pct ??
      raw?.expectedDropPct ??
      raw?.predicted_price_change_pct ??
      raw?.predictedPriceChangePct ??
      null,
    estimated_best_price: raw?.estimated_best_price ?? raw?.estimatedBestPrice ?? null,
    estimated_wait_days: raw?.estimated_wait_days ?? raw?.estimatedWaitDays ?? null,
    reasons: Array.isArray(reasons) ? reasons.map((r: any) => String(r)) : [],
  };
}

function request<T>(path: string): Promise<T> {
  // Product endpoints are public; auth is optional so we skip token attachment.
  return apiFetch<T>(path, { method: 'GET', auth: false });
}

export function fetchProducts(): Promise<ProductListResponse> {
  return request<ProductListResponse>('/api/products');
}

export function fetchProduct(id: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/api/products/${id}`);
}

export function fetchPriceHistory(
  id: string,
  months = 6,
  retailer?: string | null,
): Promise<PriceHistoryResponse> {
  let url = `/api/products/${id}/prices?months=${months}`;
  if (retailer) url += `&retailer=${encodeURIComponent(retailer)}`;
  return request<PriceHistoryResponse>(url);
}

const DEFAULT_SERIES_LIMIT = 10000;

export function fetchPriceSeries(
  id: string,
  months = 12,
  retailer?: string | null,
  limit = DEFAULT_SERIES_LIMIT,
): Promise<PriceSeriesResponse> {
  let url = `/api/products/${id}/prices/series?months=${months}&limit=${limit}`;
  if (retailer) url += `&retailer=${encodeURIComponent(retailer)}`;
  return request<PriceSeriesResponse>(url);
}

const DEFAULT_KEEPA_MONTHS = 24;
const DEFAULT_KEEPA_TRACKS = 'NEW,AMAZON';
const DEFAULT_KEEPA_LIMIT_PER_TRACK = 10000;

export interface FetchKeepaSeriesOptions {
  months?: number;
  /** Comma-separated track names (e.g. NEW,AMAZON) or all per server. */
  tracks?: string;
  limit_per_track?: number;
}

export function fetchKeepaSeries(
  id: string,
  options: FetchKeepaSeriesOptions = {},
): Promise<KeepaSeriesResponse> {
  const months = options.months ?? DEFAULT_KEEPA_MONTHS;
  const tracks = options.tracks ?? DEFAULT_KEEPA_TRACKS;
  const limit_per_track = options.limit_per_track ?? DEFAULT_KEEPA_LIMIT_PER_TRACK;
  let url = `/api/products/${id}/keepa/series?months=${months}&limit_per_track=${limit_per_track}`;
  url += `&tracks=${encodeURIComponent(tracks)}`;
  return request<KeepaSeriesResponse>(url);
}

export function fetchRetailers(id: string): Promise<RetailersResponse> {
  return request<RetailersResponse>(`/api/products/${id}/retailers`);
}

export function fetchPrediction(
  id: string,
): Promise<PredictionResponse | null> {
  return request<any>(`/api/products/${id}/prediction`).then((raw) => {
    if (!raw) return null;
    return normalizePredictionResponse(raw);
  });
}

// --- Wishlist (per-user, requires auth; apiFetch attaches the Bearer token) --- //

export function fetchWishlist(): Promise<WishlistResponse> {
  return apiFetch<WishlistResponse>('/api/wishlist', { method: 'GET', auth: true });
}

export function addToWishlist(
  productId: string,
  savedPrice?: number | null,
): Promise<WishlistItem> {
  return apiFetch<WishlistItem>('/api/wishlist', {
    method: 'POST',
    auth: true,
    body: { product_id: productId, saved_price: savedPrice ?? null },
  });
}

export function removeFromWishlist(productId: string): Promise<void> {
  return apiFetch<void>(`/api/wishlist/${productId}`, {
    method: 'DELETE',
    auth: true,
  });
}
