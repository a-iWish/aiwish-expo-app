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
  ShareWishlistResponse,
  SharedWishlistResponse,
  MarkBoughtResponse,
  FollowingResponse,
  FriendsWishesResponse,
  SharedListSummary,
  SharedListsResponse,
  SharedListDetail,
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
    deadline: raw?.deadline ?? null,
    days_until_deadline: raw?.days_until_deadline ?? raw?.daysUntilDeadline ?? null,
    deadline_urgency: raw?.deadline_urgency ?? raw?.deadlineUrgency ?? null,
    deadline_adjusted: raw?.deadline_adjusted ?? raw?.deadlineAdjusted ?? null,
  };
}

function request<T>(path: string): Promise<T> {
  // Product endpoints are public; auth is optional so we skip token attachment.
  return apiFetch<T>(path, { method: 'GET', auth: false });
}

export interface ProductFilters {
  verdict?: string | null;
  minConfidence?: number | null;
  category?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string | null;
}

export function fetchProducts(filters?: ProductFilters): Promise<ProductListResponse> {
  let url = '/api/products';
  const params: string[] = [];

  if (filters?.verdict) params.push(`verdict=${encodeURIComponent(filters.verdict)}`);
  if (filters?.minConfidence != null) params.push(`min_confidence=${filters.minConfidence}`);
  if (filters?.category) params.push(`category=${encodeURIComponent(filters.category)}`);
  if (filters?.minPrice != null) params.push(`min_price=${filters.minPrice}`);
  if (filters?.maxPrice != null) params.push(`max_price=${filters.maxPrice}`);
  if (filters?.sortBy) params.push(`sort_by=${encodeURIComponent(filters.sortBy)}`);

  if (params.length > 0) url += `?${params.join('&')}`;

  return request<ProductListResponse>(url);
}

export function fetchProduct(id: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/api/products/${id}`);
}

/**
 * Dedicated "Deals Right Now" feed: BUY verdict + high confidence + near 90-day
 * low, computed server-side from Keepa stats. More accurate than the client-side
 * BUY/confidence filter, which only sees whatever page of products is loaded.
 */
export function fetchDeals(): Promise<ProductListResponse> {
  return request<ProductListResponse>('/api/products/deals');
}

/**
 * Search the catalog by free-text name and/or a pasted product URL (an Amazon
 * ASIN is extracted server-side and matched against the existing catalog).
 */
export function searchProducts(opts: {
  q?: string | null;
  url?: string | null;
}): Promise<ProductListResponse> {
  const params: string[] = [];
  if (opts.q) params.push(`q=${encodeURIComponent(opts.q)}`);
  if (opts.url) params.push(`url=${encodeURIComponent(opts.url)}`);
  if (params.length === 0) return Promise.resolve({ products: [], count: 0 });
  return request<ProductListResponse>(`/api/products/search?${params.join('&')}`);
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
  deadline?: string | null,
): Promise<PredictionResponse | null> {
  let url = `/api/products/${id}/prediction`;
  if (deadline) url += `?deadline=${encodeURIComponent(deadline)}`;
  return request<any>(url).then((raw) => {
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
  deadline?: string | null,
): Promise<WishlistItem> {
  return apiFetch<WishlistItem>('/api/wishlist', {
    method: 'POST',
    auth: true,
    body: {
      product_id: productId,
      saved_price: savedPrice ?? null,
      deadline: deadline ?? null,
    },
  });
}

export function removeFromWishlist(productId: string): Promise<void> {
  return apiFetch<void>(`/api/wishlist/${productId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// --- Social: friend connections + Friends' Wishes (all require auth) --- //

export function followUser(email: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/social/follow', {
    method: 'POST',
    auth: true,
    body: { email },
  });
}

export function unfollowUser(followingId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/social/follow/${followingId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function fetchFollowing(): Promise<FollowingResponse> {
  return apiFetch<FollowingResponse>('/api/social/following', {
    method: 'GET',
    auth: true,
  });
}

export function fetchFriendsWishes(): Promise<FriendsWishesResponse> {
  return apiFetch<FriendsWishesResponse>('/api/social/friends-wishes', {
    method: 'GET',
    auth: true,
  });
}

// --- Push notifications: register/unregister an Expo push token (auth) --- //

export function registerPushToken(
  token: string,
  platform?: string | null,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/notifications/register', {
    method: 'POST',
    auth: true,
    body: { token, platform: platform ?? null },
  });
}

export function unregisterPushToken(token: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/notifications/register', {
    method: 'DELETE',
    auth: true,
    body: { token },
  });
}

export function shareWishlist(): Promise<ShareWishlistResponse> {
  return apiFetch<ShareWishlistResponse>('/api/wishlist/share', {
    method: 'POST',
    auth: true,
  });
}

export function getSharedWishlist(
  token: string,
  giftMode = false,
): Promise<SharedWishlistResponse> {
  let url = `/api/wishlist/shared/${encodeURIComponent(token)}`;
  if (giftMode) url += '?gift_mode=true';
  return apiFetch<SharedWishlistResponse>(url, { method: 'GET', auth: false });
}

export function updateWishlistItem(
  productId: string,
  updates: { is_public?: boolean; occasion?: string; deadline?: string | null },
): Promise<WishlistItem> {
  return apiFetch<WishlistItem>(`/api/wishlist/${productId}`, {
    method: 'PATCH',
    auth: true,
    body: updates,
  });
}

export function markBought(
  token: string,
  productId: string,
): Promise<MarkBoughtResponse> {
  return apiFetch<MarkBoughtResponse>(
    `/api/wishlist/shared/${encodeURIComponent(token)}/mark-bought/${productId}`,
    { method: 'POST', auth: true },
  );
}

// --- Collaborative lists: co-owned wishlists joined via invite code (auth) --- //

export function createSharedList(
  name: string,
  occasion?: string | null,
): Promise<SharedListSummary> {
  return apiFetch<SharedListSummary>('/api/lists', {
    method: 'POST',
    auth: true,
    body: { name, occasion: occasion ?? null },
  });
}

export function joinSharedList(inviteCode: string): Promise<SharedListSummary> {
  return apiFetch<SharedListSummary>('/api/lists/join', {
    method: 'POST',
    auth: true,
    body: { invite_code: inviteCode },
  });
}

export function fetchSharedLists(): Promise<SharedListsResponse> {
  return apiFetch<SharedListsResponse>('/api/lists', { method: 'GET', auth: true });
}

export function fetchSharedListDetail(listId: string): Promise<SharedListDetail> {
  return apiFetch<SharedListDetail>(`/api/lists/${listId}`, {
    method: 'GET',
    auth: true,
  });
}

export function addSharedListItem(
  listId: string,
  productId: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/lists/${listId}/items`, {
    method: 'POST',
    auth: true,
    body: { product_id: productId },
  });
}

export function removeSharedListItem(
  listId: string,
  productId: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/lists/${listId}/items/${productId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function claimSharedListItem(
  listId: string,
  productId: string,
  claim: boolean,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/lists/${listId}/items/${productId}/claim?claim=${claim ? 'true' : 'false'}`,
    { method: 'POST', auth: true },
  );
}

export function leaveSharedList(listId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/lists/${listId}/leave`, {
    method: 'DELETE',
    auth: true,
  });
}
