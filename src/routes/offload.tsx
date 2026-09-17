import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/require-auth";
import { OffloaderPage } from "@/components/offloader-page";

export const Route = createFileRoute("/offload")({
  head: () => ({
    meta: [
      { title: "Offload — LifeOS" },
      {
        name: "description",
        content: "Quick-capture stray tasks and thoughts without derailing into a weekly section.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OffloaderPage />
    </RequireAuth>
  ),
});
