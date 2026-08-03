// PROTOTYPE — wipe me. Tree diagram variant C: "pannable zoom canvas" — minimal dot
// + label nodes, but the frame itself supports drag-to-pan and wheel/button zoom via
// a CSS transform. This is the variant that answers the fog question the tree-layout
// research and the map both flag: whether large trees need zoom/pan, and how.
import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { layoutTree, truncate } from "./layout-tree";
import { usePreviewFlat } from "./use-preview-flat";
import type { OffloaderTree } from "./use-offloader-tree";

export const name = "Pannable zoom canvas";

const TIER_WIDTH = 130;
const NODE_HEIGHT = 22;
const SPACING = 8;
const DEFAULT_TRANSFORM = { x: 40, y: 40, scale: 1 };
const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;

export function TreeVariantC({ tree }: { tree: OffloaderTree }) {
  const flat = usePreviewFlat(tree);
  const layout = layoutTree(flat, {
    tierWidth: TIER_WIDTH,
    nodeHeight: NODE_HEIGHT,
    spacing: SPACING,
  });
  const [transform, setTransform] = useState(DEFAULT_TRANSFORM);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: transform.x,
      origY: transform.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const { startX, startY, origX, origY } = dragRef.current;
    setTransform((t) => ({
      ...t,
      x: origX + (e.clientX - startX),
      y: origY + (e.clientY - startY),
    }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function zoomBy(delta: number) {
    setTransform((t) => ({
      ...t,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale + delta)),
    }));
  }
  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.1 : 0.1);
  }

  return (
    <div className="proto-synthwave flex min-h-[70vh] flex-col rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="proto-sw-neon-text text-2xl font-bold tracking-tight">Tree</h2>
        <span className="text-xs text-tertiary">
          {layout.nodes.length} nodes · {Math.round(transform.scale * 100)}%
        </span>
      </div>
      <div
        className="relative flex-1 touch-none overflow-hidden rounded-xl border border-border/40 bg-card/40"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <svg width="100%" height="100%" className="cursor-grab active:cursor-grabbing">
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
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
                    r={isActive ? 5 : 3}
                    fill="var(--sw-glow-strong)"
                    opacity={node.done ? 0.4 : 1}
                  />
                  <text
                    x={8}
                    y={3}
                    fontSize={9}
                    fill="currentColor"
                    className={cn(
                      "select-none",
                      node.done ? "text-tertiary line-through" : "text-foreground",
                    )}
                  >
                    {truncate(node.content, 20)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-lg border border-fuchsia-400/40 bg-black/80 p-1">
          <button
            onClick={() => zoomBy(0.2)}
            className="grid h-6 w-6 place-items-center rounded text-fuchsia-200 hover:bg-white/10"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => zoomBy(-0.2)}
            className="grid h-6 w-6 place-items-center rounded text-fuchsia-200 hover:bg-white/10"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTransform(DEFAULT_TRANSFORM)}
            className="grid h-6 w-6 place-items-center rounded text-fuchsia-200 hover:bg-white/10"
            aria-label="Reset view"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
