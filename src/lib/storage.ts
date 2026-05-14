import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserData, saveUserData } from "./user-data.functions";
import { useAuth } from "./auth";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/**
 * Hook: load a JSON blob for the signed-in user from the database, and
 * persist updates back with a short debounce. Falls back to `seed` until
 * the first load resolves (or for unauthenticated users).
 */
export function useUserData<T>(key: string, seed: T) {
  const { user } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<T>(seed);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const loadedRef = useRef(false);
  const skipNextSaveRef = useRef(true);

  const load = useServerFn(getUserData);
  const save = useServerFn(saveUserData);

  // Load on mount / user change.
  useEffect(() => {
    let cancelled = false;
    loadedRef.current = false;
    skipNextSaveRef.current = true;
    if (!userId) {
      setData(seed);
      setLoading(false);
      return;
    }
    setLoading(true);
    load({ data: { key } })
      .then((res: unknown) => {
        if (cancelled) return;
        const d = (res as { data?: unknown } | null)?.data;
        setData((d as T) ?? seed);
        loadedRef.current = true;
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(seed);
        loadedRef.current = true;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key]);

  // Debounced save when data changes after load.
  useEffect(() => {
    if (!userId || !loadedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      save({ data: { key, data } }).catch(() => {
        /* swallow; UI keeps local state */
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, userId, key]);

  return { data, setData, loading } as const;
}
