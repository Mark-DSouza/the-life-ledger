import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listOffloaderItems,
  createOffloaderItem,
  updateOffloaderItemContent,
  toggleOffloaderItemDone,
  deleteOffloaderItem,
  type OffloaderItem,
} from "./offloader.functions";
import { useAuth } from "./auth";

/** Applies a local transform immediately, then fires the mutation; rolls
 * the transform back if the mutation fails. Shared by every mutation here
 * that doesn't need the server's response (unlike addRootItem, which
 * replaces its optimistic placeholder with the created row on success). */
async function applyOptimistic(
  setItems: Dispatch<SetStateAction<OffloaderItem[]>>,
  transform: (prev: OffloaderItem[]) => OffloaderItem[],
  mutate: () => Promise<void>,
) {
  let prevItems: OffloaderItem[] = [];
  setItems((prev) => {
    prevItems = prev;
    return transform(prev);
  });
  try {
    await mutate();
  } catch {
    setItems(prevItems);
  }
}

/**
 * Offloader is an unbounded, append-heavy flat list, not a bounded weekly
 * blob — so unlike every other section it does not use useUserData's
 * debounced whole-blob resave. Each mutation updates local state
 * optimistically and immediately fires its matching single-row server fn.
 */
export function useOffloaderItems() {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<OffloaderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!!userId);

  const list = useServerFn(listOffloaderItems);
  const create = useServerFn(createOffloaderItem);
  const updateContent = useServerFn(updateOffloaderItemContent);
  const toggleDone = useServerFn(toggleOffloaderItemDone);
  const removeItem = useServerFn(deleteOffloaderItem);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    list()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function addRootItem(content: string) {
    const trimmed = content.trim();
    if (!trimmed || !userId) return;
    const optimisticId = crypto.randomUUID();
    const now = new Date().toISOString();
    setItems((prev) => [
      ...prev,
      {
        id: optimisticId,
        parentId: null,
        content: trimmed,
        done: false,
        position: prev.length,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    try {
      const created = await create({ data: { parentId: null, content: trimmed } });
      setItems((prev) => prev.map((it) => (it.id === optimisticId ? created : it)));
    } catch {
      setItems((prev) => prev.filter((it) => it.id !== optimisticId));
    }
  }

  async function editContent(id: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    await applyOptimistic(
      setItems,
      (prev) => prev.map((it) => (it.id === id ? { ...it, content: trimmed } : it)),
      () => updateContent({ data: { id, content: trimmed } }),
    );
  }

  async function setDone(id: string, done: boolean) {
    await applyOptimistic(
      setItems,
      (prev) => prev.map((it) => (it.id === id ? { ...it, done } : it)),
      () => toggleDone({ data: { id, done } }),
    );
  }

  async function deleteItem(id: string) {
    await applyOptimistic(
      setItems,
      (prev) => prev.filter((it) => it.id !== id),
      () => removeItem({ data: { id } }),
    );
  }

  return { items, loading, addRootItem, editContent, setDone, deleteItem } as const;
}
