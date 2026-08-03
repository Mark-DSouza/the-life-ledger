# Offloader: choosing a tree-layout approach

## Problem

Offloader tasks form an unbounded-depth parent/child tree — reply-to-decompose,
like a Reddit thread, not a general graph (no cross-links, no cycles, one
parent per node). The diagram needs to render that tree as SVG with tiers
flowing **horizontally left-to-right** (root at the left edge, deeper tiers
further right — not top-down, not a time axis) with branching descent lines
connecting each parent to its children. distrowatch.com's package-version
graph is the visual reference for line/node styling only, not for its
timeline-lane semantics.

The layout must **relayout live and cheaply**: items get dragged to
reorder/reparent in a separate, synced list view, and every such drag is a
full data change that has to flow through to a fresh tree layout. This rules
out anything with meaningful per-run cost, async/worker hops, or iterative
convergence — the bar is "recompute in a `useMemo` on every render without a
perceptible stall."

Four options were compared: **d3-hierarchy**, **@dagrejs/dagre**, **elkjs**,
and a **hand-rolled recursive layout**. Only pure layout math was in scope —
in all cases React owns the actual SVG rendering (`<g>`/`<path>` elements
generated from computed coordinates), never DOM writes performed by the
layout library itself.

## Comparison

### d3-hierarchy

| | |
|---|---|
| Latest version | `3.1.2`, published 2022-04-02 ([npm](https://www.npmjs.com/package/d3-hierarchy)) |
| Maintenance | No release since April 2022, but the GitHub repo has commits as recently as 2025-04-08, 1,268 stars, 26 open issues, not archived ([github.com/d3/d3-hierarchy](https://github.com/d3/d3-hierarchy)) — this reads as "feature-complete and stable," typical for d3 submodules, not abandoned |
| License | ISC |
| Dependencies | **Zero runtime dependencies.** `package.json` exports only `src/index.js` (ESM) and a UMD `dist/d3-hierarchy.min.js` build — no `d3-selection`, no DOM module of any kind. Confirms it can be used purely as layout math with React doing all rendering. |
| Bundle size | 14.8 KB minified / **5.8 KB gzipped**, measured directly against the published `dist/d3-hierarchy.min.js` via unpkg + `gzip -9` (bundlephobia.com returned HTTP 429 during this research and could not be reached) |
| React 19 / bundler fit | Ships native ESM (`"type": "module"`), tree-shakeable, no peer deps to conflict with React 19 or Vite. TypeScript types available separately via `@types/d3-hierarchy` (currently `3.1.7` on npm). |
| Fit for strict-tree live relayout | **Excellent.** `d3.hierarchy(data)` + `d3.tree()` (or `d3.cluster()` for even tier spacing) is a single O(n) pass over plain JS objects that annotates each node with `x`/`y`. The canonical "tidy tree" pattern (used in most d3+React tree examples, e.g. Observable's Tidy Tree) swaps the conventional `x`/`y` axes to get exactly a left-to-right, tier-by-depth layout for free — `node.depth` (or `node.y` after the swap) is already a pure function of tier, and sibling/subtree spacing without overlap is what `tree()` computes. No async, no iteration to convergence, purpose-built for trees (not general graphs), so there's no unused conceptual surface (no edge routing, no cycle handling). |

### @dagrejs/dagre (maintained fork)

| | |
|---|---|
| Latest version | `3.1.0`, published 2026-08-02 ([npm](https://www.npmjs.com/package/@dagrejs/dagre)) — actively maintained |
| Maintenance | GitHub repo `dagrejs/dagre` pushed 2026-08-02, 5,741 stars, 171 open issues, not archived ([github.com/dagrejs/dagre](https://github.com/dagrejs/dagre)). The README states explicitly: "There are 2 versions on NPM, but only the one in the DagreJs org is receiving updates right now" — confirming the original unscoped `dagre` package (last published 2022-06-14, still at `0.8.5`) is superseded/effectively abandoned. Use `@dagrejs/dagre`, never plain `dagre`. |
| License | MIT |
| Dependencies | `@dagrejs/graphlib@4.0.3` (a general graph data-structure library) |
| Bundle size | Browser build `dist/dagre.js` is 105 KB raw / **~24 KB gzipped**, measured via unpkg + `gzip -9`. Unpacked package size (all dist formats + docs) is ~1.4 MB per npm registry metadata. |
| React 19 / bundler fit | Dual ESM/CJS package (`exports.import` → `dagre.esm.js`, `exports.require` → `dagre.cjs.js`), ships its own TypeScript types (`dist/types/index.d.ts`). No React peer dependency, framework-agnostic — no compatibility concerns with React 19 or Vite. |
| Fit for strict-tree live relayout | **Overkill, and API friction.** Dagre is built for arbitrary directed graphs: it runs cycle removal, layer assignment, and Sugiyama-style crossing minimization — none of which a strict, already-ordered tree needs (there are no cycles and no crossings possible when children only ever attach to one parent). Using it means building a `graphlib.Graph`, calling `setNode`/`setEdge` for every task and parent-child pair, then `dagre.layout(g)` mutates positions in place — a heavier, more graph-shaped API for a problem with no graph-shaped edge cases. Layout cost is still roughly linear for a tree-shaped input, so it wouldn't be *slow*, but it carries dependency weight (~4x the gzip size of d3-hierarchy) and conceptual overhead for zero benefit here. |

### elkjs

| | |
|---|---|
| Latest version | `0.12.0`, published 2026-07-17 ([npm](https://www.npmjs.com/package/elkjs)) |
| Maintenance | GitHub repo `kieler/elkjs` pushed 2026-07-30, 2,687 stars, 103 open issues, not archived ([github.com/kieler/elkjs](https://github.com/kieler/elkjs)) — actively maintained |
| License | `EPL-2.0 OR GPL-3.0-or-later` per npm registry metadata — the Eclipse Layout Kernel's Java core is compiled to JS via GWT, so the license is inherited from that Java project, not a typical permissive JS-package license. Worth a second look if the project cares about copyleft obligations. |
| Dependencies | None listed — self-contained compiled bundle |
| Bundle size | `lib/elk.bundled.js` (the all-in-one browser bundle) is **1.6 MB raw / ~467 KB gzipped**, measured via unpkg + `gzip -9`. Unpacked package size is ~8 MB per npm registry metadata (includes both the worker-capable and bundled builds). This is roughly **80x** d3-hierarchy's gzip size and ~20x dagre's. |
| React 19 / bundler fit | No React peer dependency, but the API is fundamentally async: `new ELK().layout(graph)` returns a **Promise**, because the underlying engine is designed to optionally run inside a Web Worker for large graphs (the compiled Java layout engine is not fast enough to guarantee main-thread synchronous use at scale). That's a materially different integration shape from d3-hierarchy/dagre — it needs `useEffect` + async state, and rapid successive drags would need explicit request-cancellation/debouncing to avoid stale layouts racing the latest one in. |
| Fit for strict-tree live relayout | **Poor fit.** elkjs targets data-flow diagrams with ports, obstacle-avoiding edge routing, and multiple pluggable layered/force/box algorithms — none of which apply to a strict tree with a single fixed left-to-right axis. The async API alone adds real complexity (state, races, possible worker setup) for a "relayout on every drag" requirement that's better served synchronously. Combined with the ~467 KB gzip cost, this is the least suited option of the four for this feature. |

### Hand-rolled recursive layout

| | |
|---|---|
| Maintenance / version / license | N/A — no dependency to track |
| Bundle size | ~0 KB (a few dozen lines of application code) |
| React 19 / bundler fit | Trivial — plain TypeScript, no library integration surface at all |
| Fit for strict-tree live relayout | **Ideal, given the constraints are this simple.** Because it's a strict tree (no cross-edges, no crossing minimization needed, order is already fixed by the underlying task order), the layout reduces to two independent, O(n) computations: <br>1. **x (tier) coordinate** — a pure function of depth: `x = depth * TIER_WIDTH`. No traversal needed at all beyond knowing each node's depth. <br>2. **y (stacking) coordinate** — a single post-order (or in-order) DFS: assign leaves a `y` from a running cursor incremented by `nodeHeight + spacing`, then set each internal node's `y` to the midpoint (or mean) of its children's `y` values once they're known. <br>This is the same core idea as Reingold–Tilford / d3's `tree()`, minus the generality (radial layouts, custom separation functions, cluster mode) Offloader doesn't need. It runs in a single pass, has no async/worker complexity, and gives full control over spacing, collapsing subtrees, and animating position changes (e.g. via CSS transitions or `framer-motion` on the computed `x`/`y`) without fighting a library's own transition model. |

## Summary table

| | Last release | Gzip size (measured) | License | Async? | Built for |
|---|---|---|---|---|---|
| d3-hierarchy | 2022-04-02 (repo active 2025) | 5.8 KB | ISC | No | Trees & hierarchies |
| @dagrejs/dagre | 2026-08-02 | ~24 KB | MIT | No | General directed graphs |
| elkjs | 2026-07-17 | ~467 KB | EPL-2.0 / GPL-3.0 | **Yes** (Promise-based) | General layered graphs w/ port routing |
| Hand-rolled | — | 0 KB | — | No | Exactly this problem |

## Recommendation

**Hand-roll the recursive layout**, as a small, local utility (a single
`layoutTree(root): PositionedNode` function), rather than reaching for any of
the three libraries.

Reasoning:

- The problem is explicitly a strict tree, not a general graph — the entire
  value proposition of dagre and elkjs (cycle handling, layered crossing
  minimization, obstacle-avoiding edge routing for arbitrary DAGs) is unused
  surface here, since a parent-to-children fan-out drawn left-to-right by
  construction can never have a crossing edge to minimize. elkjs additionally
  introduces an async/Promise-based API and a ~467 KB gzip payload for a
  feature that needs to relayout synchronously on every drag — the worst fit
  of the four on every axis (bundle size, API shape, conceptual weight).
  dagre is far lighter than elkjs and actively maintained under
  `@dagrejs/dagre`, but still requires standing up a `graphlib.Graph` and
  running general-graph layout for a problem with no graph-specific edge
  cases to justify it.
- d3-hierarchy is the strongest *library* candidate if one is wanted: it's
  purpose-built for exactly this shape of problem (trees, not graphs), has
  zero runtime dependencies (confirmed via its published `package.json` —
  no `d3-selection` or other DOM module pulled in), is 5.8 KB gzipped, and
  its `tree()`/`cluster()` layouts are already the standard tool React+SVG
  tree diagrams reach for (axis-swapped for left-to-right instead of
  top-down). Its lack of a release since 2022 is not a red flag — the
  underlying repo is still active and the algorithm is mathematically
  complete, not abandoned mid-feature.
- But given the tree is strict and the diagram's tier/stacking rules are as
  simple as "x = depth, y = stack siblings without overlap," a ~40-line
  hand-rolled DFS does the same job as d3-hierarchy's `tree()` with **zero**
  added dependency weight, zero API to learn or fight, and full control over
  spacing/collapsing/animation semantics specific to Offloader (e.g.
  collapsing a subtree, or animating a node's position when it's
  drag-reparented in the synced list view). Because relayout must run on
  every drag, "cheap" here also means "no library abstraction between the
  data change and the numbers" — the hand-rolled version is the most
  transparent to profile and tune if it's ever on a hot path.
- If Offloader's layout needs grow non-trivially beyond this (e.g. genuine
  radial/collapsible-cluster layouts, or configurable separation functions
  per node), d3-hierarchy is the natural upgrade path — same conceptual
  model (`hierarchy` → `tree()` → per-node `x`/`y`), just swapping the
  hand-rolled traversal for the library's, with no rendering code to change
  since React still owns all SVG output either way.

## Sources

- [npmjs.com/package/d3-hierarchy](https://www.npmjs.com/package/d3-hierarchy) — version, license, dependency-free package.json (fetched via `npm view`)
- [github.com/d3/d3-hierarchy](https://github.com/d3/d3-hierarchy) — commit activity, stars, open issues (fetched via `gh api`)
- [npmjs.com/package/@dagrejs/dagre](https://www.npmjs.com/package/@dagrejs/dagre) — version, license, dependencies
- [github.com/dagrejs/dagre](https://github.com/dagrejs/dagre) — commit activity, stars, open issues, README statement on the unscoped `dagre` package being superseded
- [npmjs.com/package/dagre](https://www.npmjs.com/package/dagre) — confirms the unscoped package is stale (last published 2022-06-14, `0.8.5`)
- [npmjs.com/package/elkjs](https://www.npmjs.com/package/elkjs) — version, license, description
- [github.com/kieler/elkjs](https://github.com/kieler/elkjs) — commit activity, stars, open issues
- Bundle sizes: measured directly by downloading each package's published minified/bundled file from `unpkg.com` and piping through `gzip -9`, since bundlephobia.com returned HTTP 429 (rate-limited) throughout this research session
