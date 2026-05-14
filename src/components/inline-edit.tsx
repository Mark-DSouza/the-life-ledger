import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Tiny inline-editable text/number that looks like plain text but accepts edits. */
export function InlineEdit({
  value,
  onChange,
  type = "text",
  suffix,
  placeholder,
  className,
  width,
  min,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
  suffix?: string;
  placeholder?: string;
  className?: string;
  width?: string;
  min?: number;
  step?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // Auto-grow text inputs
  useEffect(() => {
    if (ref.current && !width && type === "text") {
      ref.current.style.width = `${Math.max(2, String(value || placeholder || "").length + 1)}ch`;
    }
  }, [value, placeholder, type, width]);

  const props: InputHTMLAttributes<HTMLInputElement> = {
    type,
    value: value === 0 || value ? String(value) : "",
    onChange: (e) => onChange(e.target.value),
    placeholder,
    min,
    step,
  };

  return (
    <span className="inline-flex items-baseline gap-1">
      <input
        ref={ref}
        {...props}
        style={width ? { width } : undefined}
        className={cn(
          "rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-foreground outline-none transition-colors",
          "hover:bg-card-nested focus:border-primary/40 focus:bg-card-nested focus:ring-1 focus:ring-primary/30",
          type === "number" && "tabular-nums",
          className,
        )}
      />
      {suffix ? <span className="text-xs text-tertiary">{suffix}</span> : null}
    </span>
  );
}
