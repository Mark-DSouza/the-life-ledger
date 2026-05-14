import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpandableCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
  accent,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  accent?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-gradient-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-card-nested/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-base font-semibold">{title}</span>
            {accent}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-tertiary transition-transform",
            open && "rotate-180 text-primary-light",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-border/60 bg-card-nested/40 px-5 py-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "primary" | "success" | "warn" }) {
  const tones: Record<string, string> = {
    muted: "bg-card-nested text-muted-foreground border-border",
    primary: "bg-primary/15 text-primary-light border-primary/30",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
