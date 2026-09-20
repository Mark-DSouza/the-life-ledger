---
status: accepted
---

# Self-host the UI webfont

Until this decision the app had never chosen a typeface. It declared no
`@font-face` and loaded no webfont, so every glyph it had ever rendered came
from whatever the _viewer's_ machine happened to have installed, reached
through a generic CSS stack. The rendering was a property of the host, not of
the app.

That was invisible until PR #82, when regenerating the lockfile moved
`tailwindcss` 4.2.4 → 4.3.3 and 4.3.3 changed its default `--font-sans` from
`ui-sans-serif, system-ui, sans-serif, …` to one leading with
`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …`. Two `offload-visual`
snapshots failed on CI while the identical build passed locally: this dev
machine has none of Roboto, Noto Sans, Arial, Helvetica Neue or Liberation
installed, so both stacks fell through to `sans-serif` → DejaVu Sans and
rendered identically; the CI runner had faces matching the new stack's leading
entries, so it switched typeface. #82 pinned the stack, which stopped a
dependency default from restyling the app — but a pinned stack is not a pinned
face, and `ui-sans-serif, system-ui, sans-serif` still resolved to three
different things on a laptop, a runner and a phone.

Recorded on
[#83](https://github.com/Mark-DSouza/the-life-ledger/issues/83).

## The decision

**Inter**, subset to latin, as a single variable `woff2` committed to this repo
at `public/fonts/inter-variable-latin.woff2` and served from the app's own
origin. `@font-face` declares `font-display: swap`; `--font-sans` names `Inter`
first and keeps the previous generic stack behind it; the face is preloaded
from `__root.tsx`; `--font-sans--font-feature-settings` turns on `tnum`
app-wide.

## Decisions and why

**Served from our own origin, not Google Fonts or any other font CDN.** The
convenient move is a `<link>` to `fonts.googleapis.com`, and the usual argument
for it — that a visitor arrives with the file already cached from some other
site — has not been true since browsers partitioned their HTTP caches by
top-level site. What is left is a third-party request on the critical path of
every cold load, a second origin that can be slow or down, and a dependency on
infrastructure someone else operates. That last one is the direction
[ADR 0003](0003-self-host-on-cloudflare-workers-and-owned-supabase.md) commits
this project to; a webfont is not a special case. The file is 48 KB, served
from the same Worker as everything else, with a one-year immutable
`cache-control` (a `routeRules` entry in `vite.config.ts`, because the filename
is fixed rather than content-hashed, so Nitro's `/assets/*` rule does not cover
it).

**One variable file, not several static weights.** The UI uses four weights —
400 body, 500 `font-medium`, 600 `font-semibold`, 700 `font-bold`. As static
faces that is four files, four `@font-face` blocks and a judgement call about
which of them is worth preloading. One variable file spanning `wght` 100–900 is
smaller than those four together, needs one preload, and makes the whole range
available to future work for free.

**The file is Google Fonts' Inter v20 latin partial instance.** Taken from
`fonts.gstatic.com` once, at build-author time, and committed — which is a
different thing from linking to it at runtime, and is what the OFL 1.1 licence
exists to permit. Choosing this build over upstream `rsms.me/inter` settles the
ticket's open question about Inter v4's optical-size axis: reading the file's
`fvar` directly shows `axisCount: 1`, `wght` 100–900, with `opsz` pinned out by
Google's partial-instancing. So `font-weight` alone drives it and there is no
`font-variation-settings` to wire up or get wrong.

That last claim is the kind that rots into folklore once the person who
measured it has moved on, so it is not left as an assertion here.
`public/fonts/PROVENANCE.md` records the source URL, the sha256 and a
dependency-free script that re-derives the axis list from the committed bytes —
run it and the answer either still reads `axisCount: 1` or the font has been
swapped without this ADR being revisited. `public/fonts/OFL.txt` sits beside
the font because the OFL requires its notice to travel with the software, and
a font committed without one is a licence problem however clearly the ADR
describes the licence.

**Latin subset only, with `unicode-range` declared.** The app's UI strings are
English. Declaring the subset's actual coverage means a browser asked to render
anything outside it skips the download entirely and falls through to the
generic stack, rather than rendering tofu. No italic face ships, because
nothing in the app renders italics.

**Tabular figures on, app-wide.** Inter ships `tnum`, and Tailwind's
`theme.css` already maps `--font-sans--font-feature-settings` to
`--default-font-feature-settings`, so this costs one line and no extra CSS.
This is a dashboard: the stat rows, the weekly tables and the Offloader counts
are columns of numbers that otherwise change width as their digits change.

**`-webkit-font-smoothing: antialiased` is kept.** Re-checked rather than
assumed, since the ticket flagged it. It only does anything in WebKit/Blink on
macOS — inert on Linux and Windows, so it has no bearing on the committed
snapshots either way. Where it does apply it swaps subpixel for grayscale AA,
and the app is white text on a near-black background, the case where subpixel
rendering over-weights and fringes the stems.

## Consequences

The two `offload-visual` baselines were regenerated once, deliberately, in the
same change, on Linux to match CI — the before/after is in that commit's diff
rather than arriving as a surprise inside an unrelated PR. Layout is identical
between them; only the glyphs differ.

Local and CI now render identically for a reason rather than by luck, which
removes a standing source of snapshot flake: neither removing a system font
from a dev machine nor another change to Tailwind's default `--font-sans` can
change the rendered output. `e2e/typography.spec.ts` asserts that directly —
that the face is fetched from our own origin and from nowhere else, that it
actually loads, that it is first in the computed stack, and that `tnum` is
live — so a regression reads as "the font stopped being served" rather than as
two screenshots differing by 1% of their pixels.

Replacing the typeface later means a new filename, not new bytes at this one,
because the `immutable` cache header makes the existing path uncacheable to
bust.
