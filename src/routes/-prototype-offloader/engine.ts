// PROTOTYPE — wipe me. Throwaway drag/tree engine for the Offloader capture-flow
// prototype (issue #33). In-memory only; mirrors the flat self-referencing shape
// from ADR 0002 (offloader_items: id, parentId, content, done, position) and the
// dnd-kit flatten/depth-projection approach from the drag-and-drop research.

export type OffloaderItem = {
  id: string;
  parentId: string | null;
  content: string;
  done: boolean;
  position: number;
};

export type FlatItem = OffloaderItem & { depth: number };

let nextId = 1;
export function makeId() {
  return `proto-${nextId++}`;
}

/** Depth-first, position-ordered flattening — the single source the list, drag math, and (eventually) tree diagram all read from. */
export function flattenTree(items: OffloaderItem[]): FlatItem[] {
  const byParent = new Map<string | null, OffloaderItem[]>();
  for (const item of items) {
    const key = item.parentId;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.position - b.position);

  const out: FlatItem[] = [];
  function visit(parentId: string | null, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      out.push({ ...item, depth });
      visit(item.id, depth + 1);
    }
  }
  visit(null, 0);
  return out;
}

/** Every id in id's subtree (not including id itself). */
export function getDescendantIds(items: OffloaderItem[], id: string): Set<string> {
  const ids = new Set<string>();
  let frontier = [id];
  while (frontier.length) {
    const next: string[] = [];
    for (const item of items) {
      if (item.parentId !== null && frontier.includes(item.parentId)) {
        ids.add(item.id);
        next.push(item.id);
      }
    }
    frontier = next;
  }
  return ids;
}

/** True if the direct-children gate (ADR 0002) blocks done/delete on `id`. */
export function hasUndoneChildren(items: OffloaderItem[], id: string): boolean {
  return items.some((i) => i.parentId === id && !i.done);
}

const INDENT_WIDTH = 28;

export function getProjection(
  visible: FlatItem[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
) {
  const overIndex = visible.findIndex((i) => i.id === overId);
  const activeIndex = visible.findIndex((i) => i.id === activeId);
  if (overIndex === -1 || activeIndex === -1) return null;

  const newItems = arrayMove(visible, activeIndex, overIndex);
  const previousItem = newItems[overIndex - 1];
  const nextItem = newItems[overIndex + 1];
  const active = visible[activeIndex];

  const dragDepth = Math.round(dragOffsetX / INDENT_WIDTH);
  const projectedDepth = active.depth + dragDepth;
  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;
  const depth = Math.min(Math.max(projectedDepth, minDepth), maxDepth);

  function getParentId(): string | null {
    if (depth === 0 || !previousItem) return null;
    if (previousItem.depth === depth) return previousItem.parentId;
    if (previousItem.depth < depth) return previousItem.id;
    const newParent = newItems
      .slice(0, overIndex)
      .reverse()
      .find((i) => i.depth === depth)?.parentId;
    return newParent ?? null;
  }

  const parentId = getParentId();
  const siblings = newItems.filter((i) => i.parentId === parentId && i.id !== activeId);
  const indexAmongSiblings = siblings.findIndex((i) => i.id === (nextItem?.id ?? "___end___"));
  const beforeSibling =
    indexAmongSiblings === -1 ? siblings[siblings.length - 1] : siblings[indexAmongSiblings - 1];
  const afterSibling = indexAmongSiblings === -1 ? undefined : siblings[indexAmongSiblings];

  return {
    depth,
    parentId,
    beforeSiblingId: beforeSibling?.id ?? null,
    afterSiblingId: afterSibling?.id ?? null,
  };
}

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/** Midpoint position, matching reorderOffloaderItem/reparentOffloaderItem's server-side math. */
export function positionBetween(before?: OffloaderItem, after?: OffloaderItem): number {
  const beforePos = before?.position ?? (after ? after.position - 2 : 0);
  const afterPos = after?.position ?? (before ? before.position + 2 : beforePos + 2);
  return (beforePos + afterPos) / 2;
}

export const INDENTATION_WIDTH = INDENT_WIDTH;

export function seedItems(): OffloaderItem[] {
  const root = (content: string, position: number): OffloaderItem => ({
    id: makeId(),
    parentId: null,
    content,
    done: false,
    position,
  });
  const child = (
    parentId: string,
    content: string,
    position: number,
    done = false,
  ): OffloaderItem => ({
    id: makeId(),
    parentId,
    content,
    done,
    position,
  });

  const kitchen = root("Redo the kitchen backsplash", 0);
  const tile = child(kitchen.id, "Pick tile pattern", 0, true);
  const grout = child(kitchen.id, "Buy grout + spacers", 1);
  const measure = child(tile.id, "Measure wall dimensions", 0, true);
  const sample = child(tile.id, "Order sample tiles", 1);

  const launch = root("Ship the Offloader feature", 1);
  const schema = child(launch.id, "Lock the DB schema", 0, true);
  const dnd = child(launch.id, "Pick a drag-and-drop library", 1, true);
  const prototype = child(launch.id, "Prototype capture + list + drag", 2);
  const synthwave = child(prototype.id, "Nail the synthwave glow treatment", 0);
  const collapse = child(prototype.id, "Decide collapse/expand UX", 1);

  const reading = root("Read 'The Mom Test'", 2);

  return [
    kitchen,
    tile,
    grout,
    measure,
    sample,
    launch,
    schema,
    dnd,
    prototype,
    synthwave,
    collapse,
    reading,
  ];
}
