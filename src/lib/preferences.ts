import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPreferences, savePreferences } from "./preferences.functions";
import type { WeightUnit } from "./preferences-data";
import { useAuth } from "./auth";

/**
 * Hook: the user's global Weight Unit preference. Loads once per user and
 * persists changes immediately (optimistically keeping the local value).
 */
export function useWeightUnit() {
  const { user } = useAuth();
  const userId = user?.id;
  const [unit, setUnit] = useState<WeightUnit>("kg");

  const load = useServerFn(getPreferences);
  const save = useServerFn(savePreferences);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setUnit("kg");
      return;
    }
    load()
      .then((prefs) => {
        if (!cancelled) setUnit(prefs.weightUnit);
      })
      .catch(() => {
        /* keep default; UI stays usable */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const update = (next: WeightUnit) => {
    setUnit(next);
    if (userId) {
      save({ data: { weightUnit: next } }).catch(() => {
        /* swallow; UI keeps local state */
      });
    }
  };

  return { unit, setUnit: update } as const;
}
