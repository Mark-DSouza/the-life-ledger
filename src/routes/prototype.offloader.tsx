// PROTOTYPE — wipe me. Throwaway route for the Offloader prototypes (issues #33
// and #34, children of the Offloader map: issue #29). Left panel is the settled
// list layout from #33 (variant A won); right panel is three structurally
// different tree-diagram variants for #34, switchable via ?variant=. Both panels
// share one useOffloaderTree() instance, so a drag in the list live-updates the
// tree — that shared instance *is* the live-sync mechanism.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import "./-prototype-offloader/synthwave.css";
import { VariantA } from "./-prototype-offloader/variant-a";
import { TreeVariantA, name as treeNameA } from "./-prototype-offloader/tree-variant-a";
import { TreeVariantB, name as treeNameB } from "./-prototype-offloader/tree-variant-b";
import { TreeVariantC, name as treeNameC } from "./-prototype-offloader/tree-variant-c";
import { PrototypeSwitcher } from "./-prototype-offloader/switcher";
import { useOffloaderTree } from "./-prototype-offloader/use-offloader-tree";

const searchSchema = z.object({
  variant: z.enum(["A", "B", "C"]).optional().catch(undefined),
});

export const Route = createFileRoute("/prototype/offloader")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Offloader prototype (throwaway) — LifeOS" }],
  }),
  component: PrototypeOffloaderPage,
});

const TREE_VARIANTS = [
  { key: "A", name: treeNameA, Component: TreeVariantA },
  { key: "B", name: treeNameB, Component: TreeVariantB },
  { key: "C", name: treeNameC, Component: TreeVariantC },
] as const;

function PrototypeOffloaderPage() {
  const { variant = "A" } = Route.useSearch();
  const tree = useOffloaderTree();
  const ActiveTree = TREE_VARIANTS.find((v) => v.key === variant)?.Component ?? TreeVariantA;

  // Not wrapped in the real AppShell: AppShell blocks all content behind a live
  // Supabase auth check (see require-auth.tsx / auth.tsx), which this throwaway
  // route shouldn't depend on. Same page background token as every other section
  // so the panels still sit against the real dark palette, not a blank page.
  return (
    <div className="min-h-screen bg-sidebar px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-6 lg:grid-cols-2">
        <VariantA tree={tree} />
        <ActiveTree tree={tree} />
      </div>
      <PrototypeSwitcher variants={TREE_VARIANTS.map(({ key, name }) => ({ key, name }))} />
    </div>
  );
}
