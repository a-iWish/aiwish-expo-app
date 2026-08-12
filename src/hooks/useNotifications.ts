import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationsRead } from '../services/api';
import { presentLocalNotification } from '../services/notifications';
import { useAuth } from '../context/AuthContext';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

// Poll while the app is open; new server-side notifications surface as local
// device banners within this interval (used for the live demo trigger too).
const POLL_MS = 20_000;

// Module-level so multiple mounted hook instances (bell + screen) share one
// baseline and a new notification is only presented as a banner once.
// Starts null: the first fetch after login seeds it silently instead of
// banner-blasting the whole history.
let seenIds: Set<string> | null = null;

/**
 * Server-backed notification feed. The daily alert job (and the demo trigger
 * route) write rows; this hook polls them, exposes the list + unread count,
 * and presents newly arrived unread ones as local device notifications.
 */
export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, refetch } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    enabled: isAuthenticated,
    refetchInterval: POLL_MS,
  });

  useEffect(() => {
    const items = data?.notifications;
    if (!items) return;
    if (seenIds === null) {
      seenIds = new Set(items.map((n) => n.id));
      return;
    }
    for (const n of items) {
      if (n.read_at === null && !seenIds.has(n.id)) {
        seenIds.add(n.id);
        presentLocalNotification(n.title, n.body, { product_id: n.product_id });
      } else {
        seenIds.add(n.id);
      }
    }
  }, [data]);

  const markReadMutation = useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(ids),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  return {
    notifications: isAuthenticated ? data?.notifications ?? [] : [],
    unreadCount: isAuthenticated ? data?.unread_count ?? 0 : 0,
    /** Mark specific notifications read, or all when called without ids. */
    markRead: (ids?: string[]) => markReadMutation.mutate(ids),
    refetch,
  };
}
