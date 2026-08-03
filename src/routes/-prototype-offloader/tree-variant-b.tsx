// PROTOTYPE — wipe me. Tree diagram variant B: "neon node chips" — nodes render as
// full HTML chips (so labels can wrap/truncate normally, unlike SVG <text>), joined
// by orthogonal (elbow) connector lines in an SVG layer beneath them. Structurally
// different from variant A: HTML chips vs. SVG dot+label, right-angle joints vs.
// bezier curves, more generous spacing since chips need room for text.
import { cn } from "@/lib/utils";
import { layoutTree } from "./layout-tree";
import { usePreviewFlat } from "./use-preview-flat";
import type { OffloaderTree } from "./use-offloader-tree";

export const name = "Neon node chips";

const TIER_WIDTH = 190;
const NODE_HEIGHT = 36;
const SPACING = 14;
const PADDING = 24;

export function TreeVariantB({ tree }: { tree: OffloaderTree }) {
  const flat = usePreviewFlat(tree);
  const layout = layoutTree(flat, {
    tierWidth: TIER_WIDTH,
    nodeHeight: NODE_HEIGHT,
    spacing: SPACING,
  });
  const width = layout.width + PADDING * 2;
  const height = layout.height + PADDING * 2;

  return (
    <div className="proto-synthwave flex min-h-[70vh] flex-col rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="proto-sw-neon-text text-2xl font-bold tracking-tight">Tree</h2>
        <span className="text-xs text-tertiary">{layout.nodes.length} nodes</span>
      </div>
      <div className="relative flex-1 overflow-auto rounded-xl border border-border/40 bg-card/40">
        <div className="relative" style={{ width, height }}>
          <svg width={width} height={height} className="absolute inset-0">
            <g transform={`translate(${PADDING}, ${PADDING})`}>
              {layout.edges.map((edge) => {
                const midX = edge.x1 + (edge.x2 - edge.x1) / 2;
                return (
                  <polyline
                    key={edge.id}
                    points={`${edge.x1},${edge.y1} ${midX},${edge.y1} ${midX},${edge.y2} ${edge.x2},${edge.y2}`}
                    fill="none"
                    stroke="var(--sw-glow)"
                    strokeOpacity={0.6}
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          </svg>
          {layout.nodes.map((node) => {
            const isActive = node.id === tree.activeId;
            return (
              <div
                key={node.id}
                className={cn(
                  "proto-sw-glow-ring absolute max-w-[160px] -translate-y-1/2 truncate rounded-full border border-border bg-card-nested px-3 py-1.5 text-xs",
                  node.done && "text-tertiary line-through opacity-60",
                  isActive && "proto-sw-dragging",
                )}
                style={{ left: PADDING + node.x, top: PADDING + node.y }}
              >
                {node.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
