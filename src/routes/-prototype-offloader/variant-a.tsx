// PROTOTYPE — wipe me. Variant A: flat reddit-thread list, one continuous
// indented column, capture bar always at the top, reply-to-add-child inline.
import { useState } from "react";
import { DndContext, DragOverlay, closestCenter, type UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { InlineEdit } from "@/components/inline-edit";
import { cn } from "@/lib/utils";
import { INDENTATION_WIDTH, type FlatItem } from "./engine";
import { useOffloaderTree } from "./use-offloader-tree";

export const name = "Reddit-thread flat list";

export function VariantA() {
  const tree = useOffloaderTree();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [captureValue, setCaptureValue] = useState("");
  const [replyValue, setReplyValue] = useState("");

  // dragVisible already excludes the active item's own descendants (see the hook);
  // the active row itself renders in place, just re-indented to its projected depth.
  const renderRows = tree.dragVisible;

  return (
    <div className="proto-synthwave min-h-[70vh] rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="proto-sw-neon-text text-2xl font-bold tracking-tight">Offloader</h1>
        <span className="text-xs text-tertiary">{tree.flat.length} items</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          tree.addItem(null, captureValue);
          setCaptureValue("");
        }}
        className="proto-sw-capture mb-6 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-shadow"
      >
        <Plus className="h-4 w-4 shrink-0 text-primary-light" />
        <input
          value={captureValue}
          onChange={(e) => setCaptureValue(e.target.value)}
          placeholder="Offload something new…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-tertiary"
        />
      </form>

      <DndContext
        id="offloader-proto-a"
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
          <div className="space-y-1">
            {renderRows.map((item) => (
              <Row
                key={item.id}
                item={item}
                depth={
                  item.id === tree.activeId ? (tree.projection?.depth ?? item.depth) : item.depth
                }
                tree={tree}
                isReplying={replyingTo === item.id}
                onStartReply={() => {
                  setReplyingTo(item.id);
                  setReplyValue("");
                }}
                replyValue={replyValue}
                onReplyChange={setReplyValue}
                onSubmitReply={() => {
                  tree.addItem(item.id, replyValue);
                  setReplyingTo(null);
                }}
                onCancelReply={() => setReplyingTo(null)}
              />
            ))}
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

function Row({
  item,
  depth,
  tree,
  isReplying,
  onStartReply,
  replyValue,
  onReplyChange,
  onSubmitReply,
  onCancelReply,
}: {
  item: FlatItem;
  depth: number;
  tree: ReturnType<typeof useOffloaderTree>;
  isReplying: boolean;
  onStartReply: () => void;
  replyValue: string;
  onReplyChange: (v: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const collapsedHere = tree.collapsed.has(item.id);
  const blocked = !tree.canMutate(item.id);
  const isActive = tree.activeId === item.id;

  return (
    <div>
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
          isActive && "proto-sw-glow-ring bg-card-nested/60",
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-tertiary hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder or reparent"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {tree.hasChildren(item.id) ? (
          <button
            onClick={() => tree.toggleCollapse(item.id)}
            className="text-tertiary hover:text-foreground"
            aria-label={collapsedHere ? "Expand" : "Collapse"}
          >
            {collapsedHere ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

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
          <button
            onClick={onStartReply}
            className="rounded p-1 text-tertiary hover:bg-card-nested hover:text-primary-light"
            aria-label="Reply / add sub-task"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
          </button>
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

      {isReplying ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitReply();
          }}
          style={{ paddingLeft: (depth + 1) * INDENTATION_WIDTH }}
          className="proto-sw-capture mb-1 mt-1 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
        >
          <CornerDownRight className="h-3.5 w-3.5 text-primary-light" />
          <input
            autoFocus
            value={replyValue}
            onChange={(e) => onReplyChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onCancelReply()}
            onBlur={() => !replyValue && onCancelReply()}
            placeholder="Add a sub-task…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-tertiary"
          />
        </form>
      ) : null}
    </div>
  );
}
