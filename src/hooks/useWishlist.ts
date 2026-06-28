import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { WishlistResponse } from '../types/product';
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const WISHLIST_QUERY_KEY = ['wishlist'] as const;

export interface WishlistMeta {
  savedAt: string;
  savedPrice: number | null;
  deadline: string | null;
}

export type WishlistMetaMap = Record<string, WishlistMeta>;

/**
 * Per-user wishlist, persisted server-side. Reads come from a React Query
 * cache (only when authenticated); add/remove are optimistic mutations.
 *
 * The return shape matches the old local hook so screens need no changes.
 * Saving requires auth — callers should gate the action via `isAuthenticated`
 * (see ProductDetailScreen) and prompt login before calling add/toggle.
 */
export function useWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
  });

  // Logged-out users always see an empty wishlist, even if a stale cache exists.
  const items = isAuthenticated ? data?.items ?? [] : [];
  const ids = items.map((it) => it.product_id);
  const meta: WishlistMetaMap = items.reduce<WishlistMetaMap>((acc, it) => {
    acc[it.product_id] = {
      savedAt: it.created_at,
      savedPrice: it.saved_price ?? null,
      deadline: it.deadline ?? null,
    };
    return acc;
  }, {});

  const optimistic = useCallback(
    (mutate: (prev: WishlistResponse) => WishlistResponse) => async () => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const prev =
        queryClient.getQueryData<WishlistResponse>(WISHLIST_QUERY_KEY) ?? {
          items: [],
          count: 0,
        };
      queryClient.setQueryData<WishlistResponse>(WISHLIST_QUERY_KEY, mutate(prev));
      return { prev };
    },
    [queryClient],
  );

  const rollback = useCallback(
    (_e: unknown, _v: unknown, ctx: { prev: WishlistResponse } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(WISHLIST_QUERY_KEY, ctx.prev);
    },
    [queryClient],
  );

  const settle = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: ({
      id,
      savedPrice,
      deadline,
    }: {
      id: string;
      savedPrice?: number | null;
      deadline?: string | null;
    }) => addToWishlist(id, savedPrice, deadline),
    onMutate: ({ id, savedPrice, deadline }) =>
      optimistic((prev) => {
        if (prev.items.some((it) => it.product_id === id)) return prev;
        const item = {
          product_id: id,
          saved_price: savedPrice ?? null,
          deadline: deadline ?? null,
          created_at: new Date().toISOString(),
        };
        return { items: [item, ...prev.items], count: prev.count + 1 };
      })(),
    onError: rollback,
    onSettled: settle,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromWishlist(id),
    onMutate: (id) =>
      optimistic((prev) => {
        const next = prev.items.filter((it) => it.product_id !== id);
        return { items: next, count: next.length };
      })(),
    onError: rollback,
    onSettled: settle,
  });

  const add = useCallback(
    (id: string, savedPrice?: number | null, deadline?: string | null) =>
      addMutation.mutate({ id, savedPrice, deadline }),
    [addMutation],
  );

  const remove = useCallback(
    (id: string) => removeMutation.mutate(id),
    [removeMutation],
  );

  const isWatched = useCallback((id: string) => ids.includes(id), [ids]);

  const getMeta = useCallback((id: string) => meta[id], [meta]);

  const toggle = useCallback(
    (id: string, savedPrice?: number | null, deadline?: string | null) => {
      if (ids.includes(id)) {
        remove(id);
      } else {
        add(id, savedPrice, deadline);
      }
    },
    [ids, add, remove],
  );

  // Persist a deadline change for an already-saved item (ISO yyyy-mm-dd, or null to clear).
  const updateDeadline = useCallback(
    (id: string, deadline: string | null) =>
      updateWishlistItem(id, { deadline }).then(settle, settle),
    [settle],
  );

  return {
    ids,
    items,
    meta,
    add,
    remove,
    toggle,
    isWatched,
    getMeta,
    updateDeadline,
  };
}
