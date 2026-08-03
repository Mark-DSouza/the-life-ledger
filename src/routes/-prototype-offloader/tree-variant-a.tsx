// PROTOTYPE — wipe me. Tree diagram variant A: "distrowatch classic" — thin dot
// nodes + smooth bezier branch lines, tiers flowing left-to-right, fixed-size SVG
// in a scrollable frame (no zoom/pan — that's what variant C explores instead).
// Layout via layoutTree (hand-rolled, see docs/research/offloader-tree-layout.md);
// live-synced to the list via usePreviewFlat, which also reflects the in-flight
// drag projection, not just the state after drop.
import { cn } from "@/lib/utils";
import { layoutTree, truncate } from "./layout-tree";
import { usePreviewFlat } from "./use-preview-flat";
import type { OffloaderTree } from "./use-offloader-tree";

export const name = "Distrowatch classic";

const TIER_WIDTH = 150;
const NODE_HEIGHT = 26;
const SPACING = 10;
const PADDING = 24;

export function TreeVariantA({ tree }: { tree: OffloaderTree }) {
  const flat = usePreviewFlat(tree);
  const layout = layoutTree(flat, {
    tierWidth: TIER_WIDTH,
    nodeHeight: NODE_HEIGHT,
    spacing: SPACING,
  });

  return (
    <div className="proto-synthwave flex min-h-[70vh] flex-col rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="proto-sw-neon-text text-2xl font-bold tracking-tight">Tree</h2>
        <span className="text-xs text-tertiary">{layout.nodes.length} nodes</span>
      </div>
      <div className="flex-1 overflow-auto rounded-xl border border-border/40 bg-card/40">
        <svg width={layout.width + PADDING * 2} height={layout.height + PADDING * 2}>
          <g transform={`translate(${PADDING}, ${PADDING})`}>
            {layout.edges.map((edge) => {
              const midX = (edge.x1 + edge.x2) / 2;
              return (
                <path
                  key={edge.id}
                  d={`M ${edge.x1} ${edge.y1} C ${midX} ${edge.y1}, ${midX} ${edge.y2}, ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke="var(--sw-glow)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                />
              );
            })}
            {layout.nodes.map((node) => {
              const isActive = node.id === tree.activeId;
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r={isActive ? 6 : 4}
                    fill="var(--sw-glow-strong)"
                    opacity={node.done ? 0.4 : 1}
                  />
                  <text
                    x={10}
                    y={4}
                    fontSize={11}
                    fill="currentColor"
                    className={cn(
                      "select-none",
                      node.done ? "text-tertiary line-through" : "text-foreground",
                    )}
                  >
                    {truncate(node.content, 26)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
