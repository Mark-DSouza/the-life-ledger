// PROTOTYPE — wipe me. Variant B: Google-Keep-style card grid, one card per root
// thread, nested sub-tasks indented inside the card. Structurally different from
// Variant A's single continuous column — the information hierarchy is per-thread
// first, not per-item first.
import { useState } from "react";
import { DndContext, DragOverlay, closestCenter, type UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { InlineEdit } from "@/components/inline-edit";
import { cn } from "@/lib/utils";
import { INDENTATION_WIDTH, type FlatItem } from "./engine";
import { useOffloaderTree } from "./use-offloader-tree";

export const name = "Root-thread card grid";

export function VariantB() {
  const tree = useOffloaderTree();
  const [newThread, setNewThread] = useState("");

  const renderRows = tree.dragVisible;
  const groups: FlatItem[][] = [];
  for (const item of renderRows) {
    if (item.depth === 0) groups.push([item]);
    else groups[groups.length - 1]?.push(item);
  }

  return (
    <div className="proto-synthwave min-h-[70vh] rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="proto-sw-neon-text text-2xl font-bold tracking-tight">Offloader</h1>
        <span className="text-xs text-tertiary">{groups.length} threads</span>
      </div>

      <DndContext
        id="offloader-proto-b"
        sensors={tree.sensors}
        collisionDetection={closestCenter}
        onDragStart={tree.dnd.onDragStart}
        onDragMove={tree.dnd.onDragMove}
        onDragOver={tree.dnd.onDragOver}
        onDragEnd={tree.dnd.onDragEnd}
        onDragCancel={tree.dnd.onDragCancel}
      >
        <SortableContext
          items={renderRows.map((i) => i.id) as UniqueIdentifier[]}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group[0].id}
                className="proto-sw-glow-ring rounded-xl border border-border bg-card p-3"
              >
                {group.map((item) => (
                  <CardRow
                    key={item.id}
                    item={item}
                    depth={
                      item.id === tree.activeId
                        ? (tree.projection?.depth ?? item.depth)
                        : item.depth
                    }
                    tree={tree}
                  />
                ))}
              </div>
            ))}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                tree.addItem(null, newThread);
                setNewThread("");
              }}
              className="proto-sw-capture flex min-h-[64px] items-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3"
            >
              <Plus className="h-4 w-4 shrink-0 text-primary-light" />
              <input
                value={newThread}
                onChange={(e) => setNewThread(e.target.value)}
                placeholder="New thread…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-tertiary"
              />
            </form>
          </div>
        </SortableContext>

        <DragOverlay>
          {tree.activeItem ? (
            <div className="proto-sw-dragging flex items-center gap-2 rounded-lg bg-card-nested px-3 py-2 text-sm">
              <GripVertical className="h-4 w-4 text-tertiary" />
              <span className="truncate">{tree.activeItem.content}</span>
              {tree.carriedCount > 0 ? (
                <span className="ml-1 shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary-light">
                  +{tree.carriedCount} carried
                </span>
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function CardRow({
  item,
  depth,
  tree,
}: {
  item: FlatItem;
  depth: number;
  tree: ReturnType<typeof useOffloaderTree>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const collapsedHere = tree.collapsed.has(item.id);
  const blocked = !tree.canMutate(item.id);
  const isActive = tree.activeId === item.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: depth * (INDENTATION_WIDTH * 0.7),
      }}
      className={cn(
        "group flex items-center gap-1.5 rounded-md px-1 py-1",
        isDragging && "opacity-40",
        isActive && "proto-sw-glow-ring bg-card-nested/60",
        depth === 0 && "mb-1 font-semibold",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-tertiary hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder or reparent"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {tree.hasChildren(item.id) ? (
        <button
          onClick={() => tree.toggleCollapse(item.id)}
          className="text-tertiary hover:text-foreground"
          aria-label={collapsedHere ? "Expand" : "Collapse"}
        >
          {collapsedHere ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      ) : (
        <span className="w-3.5" />
      )}

      <button
        onClick={() => tree.toggleDone(item.id)}
        disabled={blocked}
        title={blocked ? "Blocked: has un-done sub-tasks" : "Mark done"}
        className={cn(
          "grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[9px]",
          item.done ? "border-emerald-400 bg-emerald-500/30 text-emerald-300" : "border-border",
          blocked && "cursor-not-allowed opacity-40",
        )}
      >
        {item.done ? "✓" : ""}
      </button>

      <div className={cn("flex-1 text-sm", item.done && "text-tertiary line-through")}>
        <InlineEdit value={item.content} onChange={(v) => tree.updateContent(item.id, v)} />
      </div>

      <button
        onClick={() => tree.addItem(item.id, "New sub-task")}
        className="hidden rounded p-0.5 text-tertiary hover:bg-card-nested hover:text-primary-light group-hover:block"
        aria-label="Add sub-task"
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        onClick={() => tree.deleteItem(item.id)}
        disabled={blocked}
        title={blocked ? "Blocked: has un-done sub-tasks" : "Delete"}
        className={cn(
          "hidden rounded p-0.5 text-tertiary hover:bg-destructive/20 hover:text-destructive group-hover:block",
          blocked && "cursor-not-allowed opacity-40",
        )}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
