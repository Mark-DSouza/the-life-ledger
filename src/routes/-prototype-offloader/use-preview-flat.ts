// PROTOTYPE — wipe me. Live drag-preview flattening for the tree diagram: while a
// drag is in flight, swap the active item's parentId to the drag projection's
// parentId before flattening, so the tree's branch lines redraw live *during* the
// drag, not just after drop — the same source of truth the list already flattens
// with (engine.ts), not a parallel data model.
import { useMemo } from "react";
import { flattenTree, getDescendantIds, type FlatItem } from "./engine";
import type { OffloaderTree } from "./use-offloader-tree";

export function usePreviewFlat(tree: OffloaderTree): FlatItem[] {
  return useMemo(() => {
    let items = tree.items;
    if (tree.activeId && tree.projection) {
      const projection = tree.projection;
      items = items.map((i) =>
        i.id === tree.activeId ? { ...i, parentId: projection.parentId } : i,
      );
    }
    const flat = flattenTree(items);
    const hidden = new Set<string>();
    for (const id of tree.collapsed) {
      for (const d of getDescendantIds(items, id)) hidden.add(d);
    }
    return flat.filter((i) => !hidden.has(i.id));
  }, [tree.items, tree.activeId, tree.projection, tree.collapsed]);
}
