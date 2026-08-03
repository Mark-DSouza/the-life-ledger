// PROTOTYPE — wipe me. Floating variant switcher, per the /prototype skill's UI spec.
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type VariantDef = { key: string; name: string };

export function PrototypeSwitcher({ variants }: { variants: VariantDef[] }) {
  const search = useSearch({ strict: false }) as { variant?: string };
  const navigate = useNavigate();
  const currentIndex = Math.max(
    0,
    variants.findIndex((v) => v.key === search.variant),
  );
  const current = variants[currentIndex] ?? variants[0];

  function go(index: number) {
    const wrapped = (index + variants.length) % variants.length;
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, variant: variants[wrapped].key }),
      replace: true,
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(currentIndex - 1);
      if (e.key === "ArrowRight") go(currentIndex + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-fuchsia-400/40 bg-black/90 px-2 py-1.5 shadow-[0_0_24px_rgba(217,70,239,0.5)] backdrop-blur">
      <button
        onClick={() => go(currentIndex - 1)}
        className="grid h-7 w-7 place-items-center rounded-full text-fuchsia-200 hover:bg-white/10"
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[220px] px-2 text-center text-xs font-medium tracking-wide text-fuchsia-100">
        PROTOTYPE — {current.key} — {current.name}
      </span>
      <button
        onClick={() => go(currentIndex + 1)}
        className="grid h-7 w-7 place-items-center rounded-full text-fuchsia-200 hover:bg-white/10"
        aria-label="Next variant"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
