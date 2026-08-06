import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/require-auth";
import { InlineEdit } from "@/components/inline-edit";
import { Button } from "@/components/ui/button";
import { useOffloaderItems } from "@/lib/use-offloader-items";
import { cn } from "@/lib/utils";

export function OffloaderPage() {
  const { items, loading, addRootItem, editContent, setDone, deleteItem } = useOffloaderItems();
  const [draft, setDraft] = useState("");

  const submit = () => {
    if (!draft.trim() || loading) return;
    addRootItem(draft);
    setDraft("");
  };

  return (
    <>
      <PageHeader
        title="Offload"
        subtitle="Dump a stray task or thought without derailing into a full section."
      />

      <div className="rounded-xl border border-border bg-gradient-card p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mb-4 flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's on your mind?"
            aria-label="Capture a new item"
            disabled={loading}
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-tertiary focus:border-primary/40 focus:outline-none disabled:opacity-50"
          />
          <Button type="submit" size="sm" disabled={!draft.trim() || loading}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </form>

        {loading ? (
          <div className="py-8 text-center text-sm text-tertiary">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-tertiary">
            Nothing offloaded yet — dump your first stray task above.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-sm"
              >
                <button
                  onClick={() => setDone(item.id, !item.done)}
                  className="text-primary-light"
                  aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4 text-tertiary" />
                  )}
                </button>
                <InlineEdit
                  value={item.content}
                  onChange={(v) => editContent(item.id, v)}
                  className={cn("flex-1", item.done && "text-tertiary line-through")}
                />
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-tertiary hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
