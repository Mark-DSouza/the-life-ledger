// PROTOTYPE — wipe me. Hand-rolled left-to-right tree layout for the Offloader
// tree diagram (issue #34), per the tree-layout research ticket's recommendation:
// x is a pure function of depth, y is a single post-order DFS (leaves take the next
// slot on a running cursor, internal nodes take the midpoint of their children's y).
// No d3-hierarchy/dagre/elkjs — see docs/research/offloader-tree-layout.md for why;
// the tree is strict (no cross-links, no cycles) so library generality is unused.
import type { FlatItem } from "./engine";

export type PositionedNode = FlatItem & { x: number; y: number };
export type TreeEdge = { id: string; x1: number; y1: number; x2: number; y2: number };
export type TreeLayout = {
  nodes: PositionedNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
};

export type LayoutOptions = {
  tierWidth: number;
  nodeHeight: number;
  spacing: number;
};

/** `flat` must already be depth-first, position-ordered (i.e. straight from flattenTree). */
export function layoutTree(flat: FlatItem[], opts: LayoutOptions): TreeLayout {
  const { tierWidth, nodeHeight, spacing } = opts;

  const byParent = new Map<string | null, FlatItem[]>();
  for (const item of flat) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item);
    byParent.set(item.parentId, list);
  }

  const y = new Map<string, number>();
  let cursor = 0;

  function visit(item: FlatItem): number {
    const children = byParent.get(item.id) ?? [];
    let pos: number;
    if (children.length === 0) {
      pos = cursor;
      cursor += nodeHeight + spacing;
    } else {
      const childYs = children.map(visit);
      pos = (childYs[0] + childYs[childYs.length - 1]) / 2;
    }
    y.set(item.id, pos);
    return pos;
  }

  for (const root of byParent.get(null) ?? []) visit(root);

  const nodes: PositionedNode[] = flat.map((item) => ({
    ...item,
    x: item.depth * tierWidth,
    y: y.get(item.id) ?? 0,
  }));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: TreeEdge[] = flat
    .filter((item): item is FlatItem & { parentId: string } => item.parentId !== null)
    .map((item) => {
      const parent = byId.get(item.parentId)!;
      const child = byId.get(item.id)!;
      return { id: item.id, x1: parent.x, y1: parent.y, x2: child.x, y2: child.y };
    });

  const maxX = nodes.reduce((m, n) => Math.max(m, n.x), 0);
  return { nodes, edges, width: maxX + tierWidth, height: Math.max(cursor, nodeHeight) };
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
