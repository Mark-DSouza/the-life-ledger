import { cn } from "@/lib/utils";
import type { WeightUnit } from "@/lib/preferences-data";

/** kg / lbs segmented toggle for the global Weight Unit preference. */
export function WeightUnitToggle({
  value,
  onChange,
}: {
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border text-sm">
      {(["kg", "lbs"] as const).map((unit) => (
        <button
          key={unit}
          aria-pressed={value === unit}
          onClick={() => {
            if (unit !== value) onChange(unit);
          }}
          className={cn(
            "px-3 py-1 transition-colors",
            value === unit
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-card-nested",
          )}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}
