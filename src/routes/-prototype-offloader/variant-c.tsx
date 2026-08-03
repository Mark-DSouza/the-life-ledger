// PROTOTYPE — wipe me. Variant C: drill-down focus view. The top level shows only
// root-thread tiles (like a menu); clicking one zooms into its full nested subtree
// with a breadcrumb trail back out. Structurally different from A/B: only one
// thread's worth of hierarchy is ever on screen, navigation replaces "see everything
// at once". Drag is scoped to whatever's currently in view — a deliberate
// simplification worth reacting to (see the resolution comment on issue #33).
import { useMemo, useState } from "react";
import { DndContext, DragOverlay, closestCenter, type UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { InlineEdit } from "@/components/inline-edit";
import { cn } from "@/lib/utils";
import {
  getDescendantIds,
  getProjection,
  INDENTATION_WIDTH,
  type FlatItem,
  type OffloaderItem,
} from "./engine";
import { useOffloaderTree } from "./use-offloader-tree";

export const name = "Breadcrumb drill-down";

function flattenSubtree(items: OffloaderItem[], rootId: string | null): FlatItem[] {
  const byParent = new Map<string | null, OffloaderItem[]>();
  for (const item of items) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item);
    byParent.set(item.parentId, list);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.position - b.position);

  if (rootId === null) {
    // Top level: tiles only, one row per root thread, no deeper recursion.
    return (byParent.get(null) ?? []).map((item) => ({ ...item, depth: 0 }));
  }
  const out: FlatItem[] = [];
  function visit(parentId: string, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      out.push({ ...item, depth });
      visit(item.id, depth + 1);
    }
  }
  visit(rootId, 0);
  return out;
}

function ancestorPath(items: OffloaderItem[], id: string): OffloaderItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const path: OffloaderItem[] = [];
  let current = byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function VariantC() {
  const tree = useOffloaderTree();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [captureValue, setCaptureValue] = useState("");
  const [localActiveId, setLocalActiveId] = useState<string | null>(null);
  const [localOverId, setLocalOverId] = useState<string | null>(null);
  const [localOffsetX, setLocalOffsetX] = useState(0);

  const scoped = useMemo(() => flattenSubtree(tree.items, focusId), [tree.items, focusId]);
  const activeDescendantIds = useMemo(
    () => (localActiveId ? getDescendantIds(tree.items, localActiveId) : new Set<string>()),
    [tree.items, localActiveId],
  );
  const dragScoped = useMemo(
    () => scoped.filter((i) => !activeDescendantIds.has(i.id)),
    [scoped, activeDescendantIds],
  );
  const projection = useMemo(() => {
    if (!localActiveId || !localOverId) return null;
    return getProjection(dragScoped, localActiveId, localOverId, localOffsetX);
  }, [dragScoped, localActiveId, localOverId, localOffsetX]);

  const breadcrumbs = focusId ? ancestorPath(tree.items, focusId) : [];
  const activeItem = localActiveId ? scoped.find((i) => i.id === localActiveId) : undefined;

  return (
    <div className="proto-synthwave min-h-[70vh] rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="proto-sw-neon-text text-2xl font-bold tracking-tight">Offloader</h1>
        <span className="text-xs text-tertiary">{focusId ? "sub-thread view" : "all threads"}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => setFocusId(null)}
          className={cn("hover:text-primary-light", !focusId && "proto-sw-neon-text")}
        >
          All threads
        </button>
        {breadcrumbs.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-tertiary" />
            <button
              onClick={() => setFocusId(b.id)}
              className={cn(
                "max-w-[220px] truncate hover:text-primary-light",
                b.id === focusId && "proto-sw-neon-text",
              )}
            >
              {b.content}
            </button>
          </span>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          tree.addItem(focusId, captureValue);
          setCaptureValue("");
        }}
        className="proto-sw-capture mb-6 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
      >
        <Plus className="h-4 w-4 shrink-0 text-primary-light" />
        <input
          value={captureValue}
          onChange={(e) => setCaptureValue(e.target.value)}
          placeholder={focusId ? "Add a sub-task here…" : "Start a new thread…"}
          className="w-full bg-transparent text-sm outline-none placeholder:text-tertiary"
        />
      </form>

      <DndContext
        id="offloader-proto-c"
        sensors={tree.sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => {
          setLocalActiveId(String(e.active.id));
          setLocalOverId(String(e.active.id));
          setLocalOffsetX(0);
        }}
        onDragMove={(e) => setLocalOffsetX(e.delta.x)}
        onDragOver={(e) => setLocalOverId(e.over ? String(e.over.id) : null)}
        onDragEnd={() => {
          if (projection && localActiveId) {
            tree.moveItem(
              localActiveId,
              projection.parentId,
              projection.beforeSiblingId,
              projection.afterSiblingId,
            );
          }
          setLocalActiveId(null);
          setLocalOverId(null);
          setLocalOffsetX(0);
        }}
        onDragCancel={() => {
          setLocalActiveId(null);
          setLocalOverId(null);
          setLocalOffsetX(0);
        }}
      >
        <SortableContext
          items={dragScoped.map((i) => i.id) as UniqueIdentifier[]}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {dragScoped.map((item) => (
              <FocusRow
                key={item.id}
                item={item}
                depth={item.id === localActiveId ? (projection?.depth ?? item.depth) : item.depth}
                isTopLevel={focusId === null}
                tree={tree}
                onZoom={() => setFocusId(item.id)}
              />
            ))}
            {dragScoped.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-tertiary">
                Nothing here yet — capture something above.
              </p>
            ) : null}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div className="proto-sw-dragging flex items-center gap-2 rounded-lg bg-card-nested px-3 py-2 text-sm">
              <GripVertical className="h-4 w-4 text-tertiary" />
              <span className="truncate">{activeItem.content}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function FocusRow({
  item,
  depth,
  isTopLevel,
  tree,
  onZoom,
}: {
  item: FlatItem;
  depth: number;
  isTopLevel: boolean;
  tree: ReturnType<typeof useOffloaderTree>;
  onZoom: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const blocked = !tree.canMutate(item.id);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: depth * INDENTATION_WIDTH,
      }}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5",
        isDragging && "opacity-40",
        isTopLevel && "proto-sw-glow-ring bg-card",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-tertiary hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder or reparent within this view"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => tree.toggleDone(item.id)}
        disabled={blocked}
        title={blocked ? "Blocked: has un-done sub-tasks" : "Mark done"}
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded border",
          item.done ? "border-emerald-400 bg-emerald-500/30 text-emerald-300" : "border-border",
          blocked && "cursor-not-allowed opacity-40",
        )}
      >
        {item.done ? "✓" : ""}
      </button>

      <div className={cn("flex-1 text-sm", item.done && "text-tertiary line-through")}>
        <InlineEdit value={item.content} onChange={(v) => tree.updateContent(item.id, v)} />
      </div>

      <div className="hidden items-center gap-1 group-hover:flex">
        {tree.hasChildren(item.id) ? (
          <button
            onClick={onZoom}
            className="rounded p-1 text-tertiary hover:bg-card-nested hover:text-primary-light"
            aria-label="Zoom into this thread"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          onClick={() => tree.deleteItem(item.id)}
          disabled={blocked}
          title={blocked ? "Blocked: has un-done sub-tasks" : "Delete"}
          className={cn(
            "rounded p-1 text-tertiary hover:bg-destructive/20 hover:text-destructive",
            blocked && "cursor-not-allowed opacity-40",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
