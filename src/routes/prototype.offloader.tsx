// PROTOTYPE — wipe me. Throwaway route for the Offloader capture-flow prototype
// (issue #33, child of the Offloader map: issue #29). Three structurally different
// variants of the capture input + tiered list + drag-and-drop, switchable via
// ?variant=. No real persistence — everything lives in useOffloaderTree's in-memory
// state. See src/routes/-prototype-offloader/ for the shared engine and variants.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import "./-prototype-offloader/synthwave.css";
import { VariantA, name as nameA } from "./-prototype-offloader/variant-a";
import { VariantB, name as nameB } from "./-prototype-offloader/variant-b";
import { VariantC, name as nameC } from "./-prototype-offloader/variant-c";
import { PrototypeSwitcher } from "./-prototype-offloader/switcher";

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

const VARIANTS = [
  { key: "A", name: nameA, Component: VariantA },
  { key: "B", name: nameB, Component: VariantB },
  { key: "C", name: nameC, Component: VariantC },
] as const;

function PrototypeOffloaderPage() {
  const { variant = "A" } = Route.useSearch();
  const Active = VARIANTS.find((v) => v.key === variant)?.Component ?? VariantA;

  // Not wrapped in the real AppShell: AppShell blocks all content behind a live
  // Supabase auth check (see require-auth.tsx / auth.tsx), which this throwaway
  // route shouldn't depend on. Same page background token as every other section
  // so the variants still sit against the real dark palette, not a blank page.
  return (
    <div className="min-h-screen bg-sidebar px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Active />
      </div>
      <PrototypeSwitcher variants={VARIANTS.map(({ key, name }) => ({ key, name }))} />
    </div>
  );
}
