# Drag-and-Drop Library Research: Offloader

**Researched:** 2026-08-03. All version/date/status claims below were verified live against npm registry API (`registry.npmjs.org`), GitHub API (`gh api`), and official docs/repos — not training-data memory.

## The requirement

Offloader renders tasks as an **unbounded-depth parent/child tree** shown as a reddit-style nested list. Users need Google-Keep-style *free* drag-and-drop within that nested list:

- Reorder a sibling within its current parent, **or**
- Drag it to become a child of a **completely different item at any tier** — including promoting it to top-level, or moving it into an unrelated root thread.
- Dragging a parent must **carry its whole subtree** with it.
- A separate read-only tree-diagram view elsewhere on the page just live-re-renders from state changes; it needs **no drag support**.

The crux is **genuine arbitrary-depth tree reparenting via drag**, not flat-list reordering. Most DnD libraries are flat-list-first and bolt trees on awkwardly (or not at all) — that distinction drives the recommendation below.

## Comparison table

| Library | Maintenance | React 19 compat | Tree/reparent support | Touch | A11y (keyboard alt) | Bundle size (gzip) | License |
|---|---|---|---|---|---|---|---|
| **@dnd-kit/core + @dnd-kit/sortable** ("classic"/legacy) | Active repo, "legacy" branded but still shipped; core 6.3.1 pub 2024-12-05, sortable 10.0.0 pub 2024-12-04 ([npm](https://registry.npmjs.org/@dnd-kit/core), [npm](https://registry.npmjs.org/@dnd-kit/sortable)); repo pushed 2026-07-13, 118 open issues ([GitHub](https://github.com/clauderic/dnd-kit)) | Works; peer dep is unbounded `react: >=16.8.0` ([npm](https://registry.npmjs.org/@dnd-kit/core)); tracking issue [#1511 "Support React 19 & Nextjs 15"](https://github.com/clauderic/dnd-kit/issues/1511) closed 2026-02-16 | **Yes — official example.** `stories/3 - Examples/Tree/SortableTree.tsx` demonstrates arbitrary-depth reparent, subtree carrying, and horizontal-offset depth projection ([source](https://github.com/clauderic/dnd-kit/blob/master/stories/3%20-%20Examples/Tree/SortableTree.tsx)) | Built-in `TouchSensor` alongside Pointer/Mouse/Keyboard ([docs](https://dndkit.com/api-documentation/sensors)) | Built-in `KeyboardSensor` (Space/Enter pick up, arrows move, Escape cancel) + live-region screen-reader announcements ([legacy a11y docs](https://dndkit.com/legacy/guides/accessibility)) | ~21.3 kB (core+sortable combined, esbuild+gzip via [bundlejs.com](https://bundlejs.com/?q=@dnd-kit/sortable@10.0.0,@dnd-kit/core@6.3.1)) | MIT ([npm](https://registry.npmjs.org/@dnd-kit/core)) |
| **react-arborist** | Very active — v3.16.0 pub 2026-07-25, near-weekly releases through July 2026 ([GitHub releases](https://github.com/brimdata/react-arborist/releases)); repo pushed 2026-07-25, 66 open issues, not archived | No explicit "19" in peer deps: `react: >=16.14` (unbounded) ([npm registry](https://registry.npmjs.org/react-arborist)); no open React-19-specific GitHub issue found | **Yes, first-class.** `onMove(dragIds, parentId, index)` API is the library's core primitive — it *is* a tree component ([README](https://github.com/brimdata/react-arborist/blob/main/README.md)) | **Not out of the box.** Hard-depends on `react-dnd@^14.0.3` + `react-dnd-html5-backend@^14.0.3` ([npm registry](https://registry.npmjs.org/react-arborist)) — HTML5 backend has no touch support (see react-dnd row) | Keyboard tree navigation (arrows, focus) exists; README does **not** document a dedicated keyboard drag-reorder path — likely a gap to fill | ~36.9 kB (whole package incl. react-dnd, react-window, redux — via [bundlejs.com](https://bundlejs.com/?q=react-arborist)) | MIT ([npm registry](https://registry.npmjs.org/react-arborist)) |
| **react-dnd** | **Stale.** Last npm publish 16.0.1 on 2022-04-19 / last GitHub release tag v16.0.0 on 2022-04-05 — over 4 years ago ([npm registry](https://registry.npmjs.org/react-dnd), [GitHub releases](https://github.com/react-dnd/react-dnd/releases)); repo pushed 2025-07-06 (>1yr stale), 474 open issues | **Unresolved gaps.** Peer dep `react: >=16.14` (no cap) but open issue [#3655 "Support for React 19"](https://github.com/react-dnd/react-dnd/issues/3655) (opened 2024-12-13, stalled since 2025-01) and [#3675 "[react 19] isDragging value is false when dragging downwards"](https://github.com/react-dnd/react-dnd/issues/3675), both still open | **No built-in support.** No `Sortable`/tree preset; [official examples list](https://react-dnd.github.io/react-dnd/examples) has Dustbin, Sortable, "Nesting" (component nesting, not hierarchical data reparenting) — arbitrary-depth reparent would be fully hand-rolled | Needs a separate `react-dnd-touch-backend` (or `react-dnd-multi-backend` to combine with HTML5) — not built-in | No built-in keyboard sensor or screen-reader live region comparable to dnd-kit; would need custom build | react-dnd alone ~12.5 kB + `react-dnd-html5-backend` ~4.6 kB gzip (~17 kB desktop-only via [bundlejs.com](https://bundlejs.com/?q=react-dnd@16.0.1)) | MIT ([npm registry](https://registry.npmjs.org/react-dnd)) |
| **Native HTML5 Drag and Drop API** | N/A — browser spec, [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) | Fully compatible (no React coupling) | Fully hand-rolled: `dragenter`/`dragover`/`drop` bubble, so nested drop-zone detection needs manual "closest valid target" logic at every mouse move; subtree carry and depth projection are 100% custom code | **No native touch support** — touchstart does not map to dragstart; needs a shim/polyfill or full custom touch handling ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)) | None built-in; entirely custom | 0 kB (no library) | N/A |

## Per-library detail

### 1. @dnd-kit/core / @dnd-kit/sortable (+ ecosystem)

**Important nuance discovered during this research:** dnd-kit today ships **two parallel generations** from the same repo (`clauderic/dnd-kit`):

- The **"classic"/legacy** React-only packages — `@dnd-kit/core@6.3.1` and `@dnd-kit/sortable@10.0.0` — which is what almost every tutorial, Storybook example, and the official Sortable Tree demo are built on. The docs site now labels this "Legacy" (`https://dndkit.com/legacy/...`) but it is still the actively-published, most battle-tested line.
- A **new multi-framework rewrite** — `@dnd-kit/react@0.5.0`, `@dnd-kit/dom`, `@dnd-kit/state`, `@dnd-kit/abstract` (published 2026-06-11, [npm registry](https://registry.npmjs.org/@dnd-kit/react)) — that also targets Vue/Svelte/Solid via a shared core, with a different API (`DragDropProvider` instead of `DndContext`). This is what `https://dndkit.com/` shows as "Latest" now. Its peer deps explicitly list `react: ^18.0.0 || ^19.0.0` — but it's pre-1.0 (v0.x) and still has an **open** React-19-strict-mode bug filed 2026-07-31: [#2116 "DragDropProvider manager is destroyed during Strict Mode replay"](https://github.com/clauderic/dnd-kit/issues/2116).

**Maintenance.** `@dnd-kit/core` 6.3.1 published 2024-12-05, `@dnd-kit/sortable` 10.0.0 published 2024-12-04 ([registry.npmjs.org](https://registry.npmjs.org/@dnd-kit/core)). The monorepo itself is very active (last push 2026-07-13, 118 open issues, not archived — [GitHub](https://github.com/clauderic/dnd-kit)), even though the classic packages individually haven't needed a version bump in over a year (a sign of stability, not abandonment — the new-generation work absorbs current commit activity).

**React 19 compatibility.** Classic `@dnd-kit/core`'s peer dependency is unbounded (`react: >=16.8.0`, [registry.npmjs.org](https://registry.npmjs.org/@dnd-kit/core)), so React 19 isn't blocked by version range. The tracking issue [clauderic/dnd-kit#1511 "Support React 19 & Nextjs 15"](https://github.com/clauderic/dnd-kit/issues/1511) (opened 2024-10-25) was **closed 2026-02-16** after 14 comments — consistent with real-world React 19 usage having shaken out. A related PR, [#1590 "React 19 (experimental)"](https://github.com/clauderic/dnd-kit/pull/1590), was merged in Jan 2025. No open blocking issue specific to classic `DndContext`/`useSortable` on React 19 was found in this search.

**Tree/reparent support — the decisive evidence.** The repo ships an **official tree example**: `stories/3 - Examples/Tree/SortableTree.tsx` ([source](https://github.com/clauderic/dnd-kit/blob/master/stories/3%20-%20Examples/Tree/SortableTree.tsx)). Verified via direct read of the source:
- A `getProjection()` function computes the *projected* new parent and depth for the dragged item during the drag, based on vertical position (which item it's hovering) **and horizontal drag offset** (how far right/left it's been dragged) — exactly the "indent to nest, outdent to promote" interaction Offloader needs.
- `getChildCount()` / the flattened-tree representation ensure a dragged parent's descendants are carried with it — this **is** the subtree-carry mechanism.
- On drop, `buildTree(sortedItems)` reconstructs the full nested structure from the flat, re-parented, re-ordered list.
- This is a genuine arbitrary-depth reparent-anywhere demo, not a fixed multi-column Kanban board (the "Nested Multiple Containers" pattern discussed in [dnd-kit issue #735](https://github.com/clauderic/dnd-kit/issues/735) is a different, shallower pattern — worth noting as the "wrong" precedent to avoid copying).

A related community package, `dnd-kit-sortable-tree` ([npm](https://registry.npmjs.org/dnd-kit-sortable-tree)), packages up essentially this same example as a reusable component — but it's stale (v0.1.73, published 2023-07-31, [registry.npmjs.org](https://registry.npmjs.org/dnd-kit-sortable-tree)) and its GitHub repo hasn't been pushed to since 2024-01-25 ([GitHub](https://github.com/Shaddix/dnd-kit-sortable-tree)) — **not** recommended as a dependency; its value is as a second reference implementation to read, not to install.

**Touch/mobile.** Built-in `TouchSensor` (alongside `PointerSensor`, `MouseSensor`, `KeyboardSensor`) — [sensors docs](https://dndkit.com/api-documentation/sensors). No extra package needed.

**Accessibility.** `KeyboardSensor` is enabled by default alongside `PointerSensor`. Space/Enter picks up a focused draggable, arrow keys move it (25px increments by default, customizable via `getNextCoordinates`), Escape cancels, Space/Enter again drops. `DndContext` also renders an off-screen live region with customizable `screenReaderInstructions` and event `announcements` (drag start/over/end/cancel) — [legacy accessibility guide](https://dndkit.com/legacy/guides/accessibility). This is the most complete built-in a11y story of the four options.

**Bundle size.** `@dnd-kit/core` alone: 56.3 kB min / 18.7 kB gzip. Combined with `@dnd-kit/sortable`: 64.1 kB min / **21.3 kB gzip** (measured via [bundlejs.com](https://bundlejs.com/?q=@dnd-kit/sortable@10.0.0,@dnd-kit/core@6.3.1), which is what npmjs.com and bundlephobia.com both rate-limited/blocked during this research — bundlejs.com uses the same esbuild-based measurement approach).

**License.** MIT ([registry.npmjs.org](https://registry.npmjs.org/@dnd-kit/core)).

### 2. react-arborist

**Maintenance.** Extremely active: v3.16.0 published 2026-07-25, with v3.15.1, v3.15.0, v3.14.0, and v3.13.2 all landing in the three weeks prior ([GitHub releases](https://github.com/brimdata/react-arborist/releases)). Repo pushed 2026-07-25, 66 open issues, not archived.

**React 19 compatibility.** `peerDependencies` are unbounded — `react: >= 16.14`, `react-dom: >= 16.14` ([registry.npmjs.org](https://registry.npmjs.org/react-arborist)) — no explicit "React 19" ceiling or floor, and no open GitHub issue naming React 19 turned up in this search, which is a mildly positive (if unconfirmed) signal.

**Tree/reparent support.** This is the library's entire reason to exist: it's a virtualized tree view, and its move API (`onMove({ dragIds, parentId, index })`) operates directly in terms of "which parent, which index" — arbitrary-depth reparenting (including promotion to root) is the default, not a special case ([README](https://github.com/brimdata/react-arborist/blob/main/README.md)).

**Rendering flexibility vs. opinionation — the key trade-off for Offloader.** react-arborist requires you to supply a custom `Node` renderer component (there's no meaningful default), and that renderer gets full control over the row's inner markup via `{ node, style, dragHandle, preview }` props — so Tailwind styling of each item is unconstrained. **However**, react-arborist owns the *outer* structure: it virtualizes rows internally via `react-window` (a hard dependency), which means row heights are declared up front (`rowHeight` prop) and the list is windowed/virtualized rather than a plain DOM list. For a reddit-style nested list where item heights can vary a lot (e.g., expandable content, wrapped text), this is a real constraint to prototype early, not just a styling nicety.

**Touch/mobile — a concrete gap.** react-arborist's own `dependencies` (not peerDependencies, so these are forced) are `react-dnd@^14.0.3` and `react-dnd-html5-backend@^14.0.3` ([registry.npmjs.org](https://registry.npmjs.org/react-arborist)). The HTML5 backend has no touch support (see react-dnd section below), and react-arborist does not appear to swap in a touch backend itself. **This means react-arborist's drag-to-reparent likely will not work on touch/mobile out of the box** — a significant caveat if Offloader needs to work on tablets/phones.

**Accessibility.** Keyboard tree navigation (arrow keys, focus management, selection) is present, but nothing in the README documents a dedicated keyboard-operable drag/reorder path analogous to dnd-kit's `KeyboardSensor` — likely would need custom work on top.

**Bundle size.** 139 kB min / **36.9 kB gzip** for the whole package, which already bundles `react-dnd`, `react-dnd-html5-backend`, `react-window`, and `redux` as forced dependencies ([bundlejs.com](https://bundlejs.com/?q=react-arborist)).

**License.** MIT ([registry.npmjs.org](https://registry.npmjs.org/react-arborist)).

### 3. react-dnd

**Maintenance — stale.** Latest npm version is 16.0.1, published **2022-04-19** ([registry.npmjs.org](https://registry.npmjs.org/react-dnd)); the corresponding GitHub release tag `v16.0.0` was published 2022-04-05 ([GitHub releases](https://github.com/react-dnd/react-dnd/releases)) — no release in over four years as of this research (2026-08-03). Repo last pushed 2025-07-06 (over a year stale relative to today) with 474 open issues, indicating low maintenance throughput.

**React 19 compatibility — unresolved.** `peerDependencies.react` is `>= 16.14` (no upper bound), but there is a still-open tracking issue [react-dnd/react-dnd#3655 "Support for React 19"](https://github.com/react-dnd/react-dnd/issues/3655) (opened 2024-12-13, effectively stalled — last update 2025-01-10, no release since) plus a live functional bug, [#3675 "[react 19] isDragging value is false when dragging downwards"](https://github.com/react-dnd/react-dnd/issues/3675), both still open at research time. This is a real, unfixed React 19 regression, not just a version-range formality.

**Tree/reparent support.** react-dnd is a low-level DnD primitives library (similar altitude to `@dnd-kit/core`, without dnd-kit's `sortable` preset). Its [official examples list](https://react-dnd.github.io/react-dnd/examples) covers Dustbin, Drag Around, **Nesting** (nested *drop target/drag source* React components — not hierarchical *data* reparenting), Sortable (flat lists), and native-file cases. There is no official tree/hierarchy example. Arbitrary-depth reparenting would have to be built from scratch on top of `useDrag`/`useDrop`, which is exactly the kind of "flat lists well, trees bolted on awkwardly" case this research was asked to watch for.

**Touch/mobile.** No touch support in the default `react-dnd-html5-backend`; requires the separate `react-dnd-touch-backend` package, typically combined with `react-dnd-multi-backend` to switch backends based on input type.

**Accessibility.** No built-in keyboard sensor or screen-reader live-region system comparable to dnd-kit; would be fully custom.

**Bundle size.** `react-dnd` alone: 42.8 kB min / 12.5 kB gzip. `react-dnd-html5-backend`: 15.7 kB min / 4.6 kB gzip. Desktop-only baseline ≈ 17 kB gzip, before adding a touch backend ([bundlejs.com](https://bundlejs.com/?q=react-dnd@16.0.1), [bundlejs.com](https://bundlejs.com/?q=react-dnd-html5-backend@16.0.1)).

**License.** MIT ([registry.npmjs.org](https://registry.npmjs.org/react-dnd)).

### 4. Native HTML5 Drag and Drop API (no library)

Per [MDN's HTML Drag and Drop API reference](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API):

- Core events: `dragstart`/`drag`/`dragend` fire on the dragged element; `dragenter`/`dragover`/`dragleave`/`drop` fire on potential drop targets. `dragover` must call `preventDefault()` for `drop` to fire at all.
- **Nested drop-target detection is entirely the app's responsibility.** `dragenter`/`dragover`/`dragleave` bubble through the DOM like other events, so with nested list items, a `dragover` handler on an *outer* ancestor item will also fire while hovering an *inner* descendant item — you'd need `event.stopPropagation()` plus manual "closest valid drop target under cursor" logic (e.g. `elementFromPoint` + closest-ancestor walk) to determine the actual intended target at the correct depth, and to avoid a node being droppable into its own descendant.
- `DataTransfer.setData`/`getData` carry data between `dragstart` and `drop`; a custom drag image needs `dataTransfer.setDragImage()`.
- **No native touch support**: `touchstart` does not synthesize `dragstart` on any current browser, so the API silently does nothing on phones/tablets unless you hand-roll a touch-event-based parallel implementation or use a shim.
- No built-in keyboard alternative or accessibility affordances at all — 100% custom.

**Feasibility for Offloader specifically:** every piece of the requirement — projected-depth-on-hover, subtree carry, promote-to-root, keyboard alternative, touch support — would be hand-built from these seven raw events. This is a large, bug-prone undertaking (drop-target-at-depth detection and touch support are the two hardest parts) for a feature a maintained library already solves. Not recommended as a starting point.

## Recommendation

**Use `@dnd-kit/core` + `@dnd-kit/sortable` (the "classic"/legacy dnd-kit line, v6.x/v10.x), built directly on top of the official Sortable Tree example** (`stories/3 - Examples/Tree/SortableTree.tsx`, https://github.com/clauderic/dnd-kit/blob/master/stories/3%20-%20Examples/Tree/SortableTree.tsx).

**Why this and not the others:**

- It is the *only* option with a **concrete, official, primary-source demonstration** of exactly this requirement — arbitrary-depth reparenting, subtree carrying, and a horizontal-offset depth-projection indicator — rather than an inferred capability. react-arborist supports reparenting too (it's a tree component, so that's fundamental to it), but ships no comparable "indent-to-nest" drag interaction pattern out of the box and forces a virtualized, react-dnd-powered rendering model that fights a fully custom reddit-style list. react-dnd has no tree story at all and is stalled on React 19. Native HTML5 DnD makes you build all of this — including the hardest parts (depth detection, subtree carry, touch) — from raw events.
- **Rendering freedom.** dnd-kit is headless — `useSortable()`/`useDraggable()`/`useDroppable()` are hooks, not components, so Offloader's nested-list markup and Tailwind styling stay 100% custom. There's no virtualization or row-height contract imposed, unlike react-arborist.
- **Touch and keyboard accessibility are both built in** (`TouchSensor`, `KeyboardSensor`, live-region announcements), with no extra package needed — react-arborist's inherited `react-dnd-html5-backend` gives it neither for free, and react-dnd needs an extra backend package for touch and has no built-in a11y story at all.
- **React 19**: the classic dnd-kit packages have an unbounded peer-dep range and a closed React-19 tracking issue; this is materially safer than react-dnd's still-open, unresolved React 19 bugs, and arguably safer near-term than the *new* `@dnd-kit/react` (v0.5.0), which explicitly declares React 19 support but is pre-1.0 and has an open React-19-strict-mode bug filed the week before this research (2026-07-31). Re-evaluate the new multi-framework dnd-kit generation once it reaches 1.0 and its own tree example — for now, its explicit React 19 peer dep is a nice-to-have that doesn't outweigh the classic line's proven, feature-complete tree demo.

### Implementation approach and gotchas

1. **Flatten the tree for drag math, rebuild it on drop.** The official example's core trick: convert the nested tree into a flat array (depth-first, each item carrying `id`, `parentId`, `depth`, and index) before feeding it to `@dnd-kit/sortable`'s `SortableContext`. All drag-over/projection math operates on this flat list; on drop, walk it back into a nested tree via a `buildTree()`-style reducer keyed on `parentId`. Model Offloader's tasks store the same way internally (or derive a flat view on each render) rather than trying to nest multiple `SortableContext`s per level.
2. **Projected-depth indicator.** Track horizontal pointer offset (`offsetLeft`) during `onDragMove` alongside the vertical "which item am I over" from `onDragOver`. A `getProjection(items, activeId, overId, offsetLeft, indentationWidth)`-style function (as in the official example) computes: the deepest depth allowed (one more than the item above), the shallowest depth allowed (matching the depth of the last item before the next sibling at a shallower level), and clamps the horizontal-offset-derived "requested" depth into that range. This projected depth becomes both the visual indent guide and the actual reparent target on drop.
3. **Subtree carrying.** Because the drag operates over the flattened list, dragging a parent naturally drags the contiguous block of its flattened descendants along with it (they sit right after it in the flat array) — the projection function's `getChildCount`-equivalent should skip over them as valid drop targets so a node can't become its own descendant. Don't recompute descendant relationships from scratch on every drag frame; derive them once per item from the tree and cache alongside the flat list.
4. **Root-level promotion and cross-thread moves** fall out of the same mechanism for free: dragging to depth 0 with any `overId` reparents to `parentId: null`; dragging over an item in a different root thread reparents into that thread — no special-casing needed beyond what the projection function already computes.
5. **Diagram view stays untouched.** Since the read-only tree-diagram view just needs to re-render from state, treat the flat-list ⇄ nested-tree conversion as the single source of truth the diagram view also subscribes to — no drag wiring needed there, per the requirement.
6. **Sensors and thresholds:** configure `PointerSensor` with an `activationConstraint` (small distance or delay) so that clicking into an item to edit it doesn't accidentally start a drag, and enable `TouchSensor` explicitly with its own delay/tolerance for mobile (long-press-to-drag is the common pattern to avoid hijacking scroll gestures).
