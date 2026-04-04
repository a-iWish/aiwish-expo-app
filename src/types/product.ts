export interface Product {
  product_id: string;
  title: string;
  source: string;
  extracted_price: number;
  extracted_old_price: number | null;
  rating: number;
  reviews: number;
  delivery: string;
  thumbnail: string;
  position: number;
  category: string;
  price_change_percentage: number | null;
  recommendation: 'BUY' | 'WAIT' | 'ANALYZING';
  recommendation_confidence: number;
  recommendation_reason: string;
  price_history: PricePoint[];
  predicted_drop_percentage: number | null;
  predicted_days_to_drop: number | null;
}

export interface PricePoint {
  timestamp: string;
  price: number;
}
