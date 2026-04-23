export interface Product {
  id: string;
  name: string;
  category: string;
  image_url?: string | null;
  retailer?: string | null;
  current_price?: number | null;
  original_price?: number | null;
  currency: string;
  discount_pct?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
  recommendation?: string | null;
  confidence?: number | null;
  trend?: string | null;
  trusted_price?: number | null;
  trusted_source?: string | null;
  msrp?: number | null;
}

export interface KeepaStats {
  brand?: string | null;
  rating?: number | null;
  review_count?: number | null;
  tracking_since?: string | null;
  new_price?: number | null;
  amazon_price?: number | null;
  new_fba_price?: number | null;
  used_price?: number | null;
  list_price?: number | null;
  avg_price_90d?: number | null;
  avg_price_30d?: number | null;
  min_price_90d?: number | null;
  max_price_90d?: number | null;
  deal_pct?: number | null;
  list_discount_pct?: number | null;
  is_lowest_ever: boolean;
  is_lowest_90d: boolean;
  sales_rank?: number | null;
  monthly_sold?: number | null;
  total_offers?: number | null;
  new_offers?: number | null;
  used_offers?: number | null;
  rank_drops_30d?: number | null;
  rank_drops_90d?: number | null;
}

export interface PredictionSummary {
  model_name: string;
  recommendation: string;
  confidence: number;
  trend: string;
  title: string;
  body: string;
  savings_amount?: number | null;
  expected_drop_pct?: number | null;
  estimated_best_price?: number | null;
  estimated_wait_days?: number | null;
  reasons: string[];
}

export interface ProductDetail extends Product {
  delivery?: string | null;
  search_position?: number | null;
  data_points_count: number;
  stats?: KeepaStats | null;
  prediction?: PredictionSummary | null;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
}

export interface MonthlyPricePoint {
  month: string;
  min_price: number;
  avg_price: number;
  max_price: number;
}

/** One trusted retailer’s monthly series (for multi-line “All retailers” chart). */
export interface RetailerPriceSeries {
  retailer: string;
  data: MonthlyPricePoint[];
}

export interface PriceHistoryResponse {
  product_id: string;
  period_months: number;
  chart_data: MonthlyPricePoint[];
}

/** Raw price observation from GET /prices/series */
export interface PriceObservationPoint {
  observed_at: string;
  price: number;
  retailer: string | null;
  currency: string | null;
}

export interface PriceSeriesResponse {
  product_id: string;
  period_months: number;
  points: PriceObservationPoint[];
}

/** One Keepa price sample from GET /keepa/series (t ISO-ish, v in dollars). */
export interface KeepaSeriesPoint {
  t: string;
  v: number;
}

/** GET /api/products/{id}/keepa/series */
export interface KeepaSeriesResponse {
  product_id: string;
  asin: string | null;
  period_months: number;
  tracks: Record<string, KeepaSeriesPoint[]>;
}

export interface RetailersResponse {
  product_id: string;
  retailers: string[];
}

/** Per-retailer quote for Price Comparison (trusted retailers + Amazon). */
export interface RetailerPriceRow {
  retailer: string;
  price: number | null;
  source: 'history' | 'amazon';
  /** How `price` was chosen for Google Shopping rows (`source === 'history'`). */
  historyBasis?: 'latest_observation' | 'monthly_avg';
}

export interface ForecastPoint {
  date: string;
  price: number;
  lower: number;
  upper: number;
}

export interface PredictionResponse {
  product_id: string;
  model_name: string;
  generated_at: string;
  horizon_days: number;
  current_price?: number | null;
  forecast: ForecastPoint[];
  trend: string;
  confidence: number;
  recommendation: string;
  title: string;
  body: string;
  savings_amount?: number | null;
  expected_drop_pct?: number | null;
  estimated_best_price?: number | null;
  estimated_wait_days?: number | null;
  reasons: string[];
}
