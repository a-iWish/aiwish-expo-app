import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'AIWISH_RECENTLY_VIEWED';
const MAX_ITEMS = 20;

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentIds(parsed);
          }
        } catch {
          // Corrupted data — ignore
        }
      }
    });
  }, []);

  const persist = useCallback((ids: string[]) => {
    setRecentIds(ids);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const addRecent = useCallback(
    (productId: string) => {
      setRecentIds((prev) => {
        const filtered = prev.filter((id) => id !== productId);
        const next = [productId, ...filtered].slice(0, MAX_ITEMS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const clearRecent = useCallback(() => {
    persist([]);
  }, [persist]);

  return { recentIds, addRecent, clearRecent };
}
