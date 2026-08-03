// PROTOTYPE — wipe me. Shared drag/state engine for all three UI variants.
import { useMemo, useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  flattenTree,
  getDescendantIds,
  getProjection,
  hasUndoneChildren,
  makeId,
  positionBetween,
  seedItems,
  type FlatItem,
  type OffloaderItem,
} from "./engine";

export function useOffloaderTree() {
  const [items, setItems] = useState<OffloaderItem[]>(seedItems);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const flat = useMemo(() => flattenTree(items), [items]);

  const hiddenByCollapse = useMemo(() => {
    const hidden = new Set<string>();
    for (const id of collapsed) for (const d of getDescendantIds(items, id)) hidden.add(d);
    return hidden;
  }, [items, collapsed]);

  /** What's rendered when nothing is being dragged. */
  const visible = useMemo(
    () => flat.filter((i) => !hiddenByCollapse.has(i.id)),
    [flat, hiddenByCollapse],
  );

  /**
   * What's rendered/droppable *while* a drag is in flight: additionally strips the
   * active item's own descendants. This is the mechanism (not a validation check)
   * that makes dropping an item onto its own descendant structurally impossible —
   * a descendant can never appear as a drop target because it isn't in this list.
   */
  const activeDescendantIds = useMemo(
    () => (activeId ? getDescendantIds(items, activeId) : new Set<string>()),
    [items, activeId],
  );
  const dragVisible = useMemo(
    () => visible.filter((i) => !activeDescendantIds.has(i.id)),
    [visible, activeDescendantIds],
  );

  const carriedCount = activeId ? activeDescendantIds.size : 0;

  const projection = useMemo(() => {
    if (!activeId || !overId) return null;
    return getProjection(dragVisible, activeId, overId, offsetX);
  }, [dragVisible, activeId, overId, offsetX]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setOverId(String(event.active.id));
    setOffsetX(0);
  }

  function handleDragMove(event: DragMoveEvent) {
    setOffsetX(event.delta.x);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null);
  }

  /** Low-level move, exposed so a variant can drive its own (differently-scoped) drag UI on top of the same data. */
  function moveItem(
    id: string,
    parentId: string | null,
    beforeSiblingId: string | null,
    afterSiblingId: string | null,
  ) {
    setItems((prev) => {
      const before = prev.find((i) => i.id === beforeSiblingId);
      const after = prev.find((i) => i.id === afterSiblingId);
      const position = positionBetween(before, after);
      return prev.map((i) => (i.id === id ? { ...i, parentId, position } : i));
    });
  }

  function finishDrag() {
    if (projection && activeId) {
      moveItem(
        activeId,
        projection.parentId,
        projection.beforeSiblingId,
        projection.afterSiblingId,
      );
    }
    setActiveId(null);
    setOverId(null);
    setOffsetX(0);
  }

  function handleDragEnd(_event: DragEndEvent) {
    finishDrag();
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
    setOffsetX(0);
  }

  function addItem(parentId: string | null, content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    setItems((prev) => {
      const siblings = prev.filter((i) => i.parentId === parentId);
      const maxPos = siblings.reduce((max, i) => Math.max(max, i.position), -1);
      return [
        ...prev,
        { id: makeId(), parentId, content: trimmed, done: false, position: maxPos + 1 },
      ];
    });
  }

  function updateContent(id: string, content: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, content } : i)));
  }

  function canMutate(id: string) {
    return !hasUndoneChildren(items, id);
  }

  function hasChildren(id: string) {
    return items.some((i) => i.parentId === id);
  }

  function toggleDone(id: string) {
    if (!canMutate(id)) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function deleteItem(id: string) {
    if (!canMutate(id)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeItem: FlatItem | undefined = activeId
    ? flat.find((i) => i.id === activeId)
    : undefined;

  return {
    items,
    flat,
    visible,
    dragVisible,
    collapsed,
    activeId,
    activeItem,
    overId,
    projection,
    carriedCount,
    sensors,
    dnd: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
    addItem,
    moveItem,
    updateContent,
    canMutate,
    hasChildren,
    toggleDone,
    deleteItem,
    toggleCollapse,
  };
}

export type OffloaderTree = ReturnType<typeof useOffloaderTree>;
