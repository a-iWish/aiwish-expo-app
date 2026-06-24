import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IDS_KEY = 'AIWISH_WATCHLIST';
const META_KEY = 'AIWISH_WATCHLIST_META';

export interface WatchlistMeta {
  savedAt: string;
  savedPrice: number | null;
  /** User's "need it by" date (ISO yyyy-mm-dd). Drives deadline-aware predictions. */
  deadline?: string | null;
}

export type WatchlistMetaMap = Record<string, WatchlistMeta>;

export function useWatchlist() {
  const [ids, setIds] = useState<string[]>([]);
  const [meta, setMeta] = useState<WatchlistMetaMap>({});

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(IDS_KEY),
      AsyncStorage.getItem(META_KEY),
    ]).then(([rawIds, rawMeta]) => {
      if (rawIds) {
        try {
          setIds(JSON.parse(rawIds));
        } catch {
          // corrupted
        }
      }
      if (rawMeta) {
        try {
          setMeta(JSON.parse(rawMeta));
        } catch {
          // corrupted
        }
      }
    });
  }, []);

  const persistIds = useCallback((next: string[]) => {
    setIds(next);
    AsyncStorage.setItem(IDS_KEY, JSON.stringify(next));
  }, []);

  const persistMeta = useCallback((next: WatchlistMetaMap) => {
    setMeta(next);
    AsyncStorage.setItem(META_KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(
    (id: string, savedPrice?: number | null, deadline?: string | null) => {
      setIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        AsyncStorage.setItem(IDS_KEY, JSON.stringify(next));
        return next;
      });
      setMeta((prev) => {
        const next = {
          ...prev,
          [id]: {
            savedAt: prev[id]?.savedAt ?? new Date().toISOString(),
            savedPrice: savedPrice ?? prev[id]?.savedPrice ?? null,
            deadline: deadline ?? prev[id]?.deadline ?? null,
          },
        };
        AsyncStorage.setItem(META_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  /** Set/clear the "need it by" date for an already-saved (or newly saved) item. */
  const setDeadline = useCallback((id: string, deadline: string | null) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      AsyncStorage.setItem(IDS_KEY, JSON.stringify(next));
      return next;
    });
    setMeta((prev) => {
      const next = {
        ...prev,
        [id]: {
          savedAt: prev[id]?.savedAt ?? new Date().toISOString(),
          savedPrice: prev[id]?.savedPrice ?? null,
          deadline,
        },
      };
      AsyncStorage.setItem(META_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id);
      AsyncStorage.setItem(IDS_KEY, JSON.stringify(next));
      return next;
    });
    setMeta((prev) => {
      const next = { ...prev };
      delete next[id];
      AsyncStorage.setItem(META_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatched = useCallback((id: string) => ids.includes(id), [ids]);

  const getMeta = useCallback((id: string) => meta[id], [meta]);

  const toggle = useCallback((id: string, savedPrice?: number | null) => {
    setIds((prev) => {
      const has = prev.includes(id);
      const nextIds = has ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(IDS_KEY, JSON.stringify(nextIds));

      setMeta((prevMeta) => {
        const nextMeta = { ...prevMeta };
        if (has) {
          delete nextMeta[id];
        } else {
          nextMeta[id] = {
            savedAt: new Date().toISOString(),
            savedPrice: savedPrice ?? null,
            deadline: prevMeta[id]?.deadline ?? null,
          };
        }
        AsyncStorage.setItem(META_KEY, JSON.stringify(nextMeta));
        return nextMeta;
      });

      return nextIds;
    });
  }, []);

  return {
    ids,
    meta,
    add,
    remove,
    toggle,
    setDeadline,
    isWatched,
    getMeta,
    persist: persistIds,
    persistMeta,
  };
}
