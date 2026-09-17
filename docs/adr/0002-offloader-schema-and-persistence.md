---
status: accepted
---

# Offloader: flat self-referencing schema with dedicated single-row server fns

Offloader ([map: "Offloader"](https://github.com/Mark-DSouza/the-life-ledger/issues/29)) is an
unbounded, append-heavy tree of free-text items, not a bounded weekly blob —
so it deliberately does not use the `useUserData`/`saveUserData` whole-blob
resave pattern documented in CLAUDE.md for every other section. This ADR
records the schema and server-fn contract decided on
[Design Offloader database schema](https://github.com/Mark-DSouza/the-life-ledger/issues/30).

## Table

A single flat table, self-referencing for threading — no separate "root
thread" table, since a root thread is just an item with `parent_id IS NULL`.

```sql
CREATE TABLE public.offloader_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.offloader_items(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  position numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_offloader_items_user ON public.offloader_items(user_id);
CREATE INDEX idx_offloader_items_parent ON public.offloader_items(parent_id);
CREATE INDEX idx_offloader_items_user_parent_position
  ON public.offloader_items(user_id, parent_id, position);
ALTER TABLE public.offloader_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.offloader_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.offloader_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.offloader_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.offloader_items FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_offloader_items_touch BEFORE UPDATE ON public.offloader_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
```

`touch_updated_at` and the "own select/insert/update/delete" RLS shape are
reused as-is from every other table in this schema — no deviation there.

### Decisions and why

**`ON DELETE CASCADE` on `parent_id`.** Matches every existing child-table FK
in this schema (e.g. `fitness_lifts.day_id ... ON DELETE CASCADE`). The app
layer still blocks deleting a parent with an un-done child (see below), so
this only fires once that gate has already passed, or on a bulk
account/user-data wipe — it's a safety net against orphaned rows, not a way
to bypass the gate.

**`position numeric`, not `int`.** A drag (reorder or reparent) must update
only the moved row, per the ticket's stated goal of dedicated single-row
persistence — it must not renumber every sibling like the existing
`saveFitness`/`saveMeals`/etc. delete+reinsert pattern does. A fractional
position lets a move set `position = (prevSibling.position + nextSibling.position) / 2`
in a single `UPDATE`. Postgres `numeric` is arbitrary-precision decimal, so
repeated bisection doesn't lose precision the way IEEE-754 floats would, but
the digit count does grow with each bisection between the same two
neighbors — the server fn should renormalize a sibling group (reindex to
`0, 1, 2, ...`) whenever a gap's decimal expansion exceeds a threshold (e.g.
20 digits), which is rare enough not to defeat the single-row-update goal in
the common case.

**No DB trigger for the done/delete gate.** "Delete and done are blocked on
a parent until all its children are done/removed" is enforced only in the
server fn layer, matching this repo's existing convention (Zod schemas and
server-fn logic are where every other validation rule lives — the only
existing trigger, `touch_updated_at`, isn't business logic). The check is a
single non-recursive query against direct children:

```sql
SELECT EXISTS (
  SELECT 1 FROM public.offloader_items WHERE parent_id = :id AND done = false
);
```

**Why a direct-children-only check is sufficient.** Marking an item done is
gated by this exact same rule, so an item can only ever reach `done = true`
once its own children are themselves done or removed. By induction, a done
child can never have an un-done descendant — so checking only direct
children at each call site is enough; the invariant holds transitively
through the whole subtree without a recursive query anywhere.

**No stored `depth` column.** Depth is derived client-side from the
`parent_id` chain when the flat item list is loaded — storing it would be
redundant and would go stale on every reparent. This also means a reparent
(drag) never has to touch any row besides the moved one: children keep
pointing at their own immediate parent by id, so dragging a parent
automatically carries its subtree without the server touching a single
descendant row — the DB schema gets subtree-carry for free from the
self-referencing FK, matching the client-side flatten/rebuild approach in
[the drag-and-drop research](https://github.com/Mark-DSouza/the-life-ledger/blob/research/offloader-drag-and-drop/docs/research/offloader-drag-and-drop.md).

## Server fn contract

New file `src/lib/offloader.functions.ts`, separate from
`user-data.functions.ts` — dedicated single-row fns, not the
`getUserData`/`saveUserData` key-dispatch pattern.

```ts
listOffloaderItems(): Promise<OffloaderItem[]>
// GET. Returns every item for the authed user, flat, ordered by
// (parent_id, position). Client builds the tree from parentId + derives depth.

createOffloaderItem(input: { parentId: string | null; content: string }): Promise<OffloaderItem>
// Appends to the end of the target sibling group:
// position = (SELECT COALESCE(MAX(position), 0) + 1 FROM offloader_items
//             WHERE user_id = :uid AND parent_id IS NOT DISTINCT FROM :parentId)

updateOffloaderItemContent(input: { id: string; content: string }): Promise<void>
// Zod: content = z.string().trim().min(1).max(2000)

toggleOffloaderItemDone(input: { id: string; done: boolean }): Promise<void>
// If done: true, first runs the direct-children gate query above;
// rejects with a validation error if any direct child has done = false.

deleteOffloaderItem(input: { id: string }): Promise<void>
// Runs the same direct-children gate query regardless of the target's own
// done state; rejects if any direct child has done = false.

reorderOffloaderItem(input: {
  id: string;
  beforeSiblingId: string | null;
  afterSiblingId: string | null;
}): Promise<void>
// Same parent_id. Server looks up beforeSiblingId/afterSiblingId's positions
// itself (never trusts a raw position value from the client) and sets
// position to their midpoint (bounds use position -1 / +1 when a
// neighbor is null, i.e. moving to an end).

reparentOffloaderItem(input: {
  id: string;
  newParentId: string | null;
  beforeSiblingId: string | null;
  afterSiblingId: string | null;
}): Promise<void>
// Rejects if newParentId === id, or if newParentId is a descendant of id
// (walks newParentId's parent_id chain server-side, e.g. via a
// WITH RECURSIVE CTE, checking id is never encountered) — a defense-in-depth
// backstop behind the client-side drag validation from the dnd-kit research.
// Otherwise: single UPDATE setting parent_id and the midpoint position
// computed the same way as reorderOffloaderItem.
```

`reorderOffloaderItem` and `reparentOffloaderItem` are kept as two named fns
(per the ticket) even though a reorder is really "reparent to the same
parent, different neighbors" — this mirrors how the drag interaction itself
is framed in the map's Destination.

## Not covered here

- The actual migration file and TypeScript module land with whichever
  ticket first needs working persistence (expected: the capture/list
  prototype) — this ADR is the design record, not the landed code.
- CLAUDE.md's database schema table gets a new `Offloader` row once the
  migration actually lands, per this effort's map Notes.
