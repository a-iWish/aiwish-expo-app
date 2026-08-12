export interface AppNotification {
  id: string;
  product_id: string | null;
  type: string; // 'buy_signal' | 'price_drop' | 'test'
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}
