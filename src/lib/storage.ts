// Per-user localStorage helper. Feature data persists locally, scoped by user id.
export function loadData<T>(userId: string | undefined | null, key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const id = userId ?? "guest";
  try {
    const raw = window.localStorage.getItem(`lifeos:${id}:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveData<T>(userId: string | undefined | null, key: string, value: T) {
  if (typeof window === "undefined") return;
  const id = userId ?? "guest";
  try {
    window.localStorage.setItem(`lifeos:${id}:${key}`, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
