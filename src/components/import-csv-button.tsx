import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { importFitnessCSV } from "@/lib/fitness-csv";
import type { FitnessWeek } from "@/lib/fitness-data";

/**
 * Import a Fitness CSV: pick a file, validate it, and confirm the full replace
 * of the Training Week before handing the parsed week to the caller.
 */
export function ImportCsvButton({ onImport }: { onImport: (week: FitnessWeek) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<FitnessWeek | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);

  const handleFile = async (file: File) => {
    const result = importFitnessCSV(await file.text());
    if (result.ok) setPending(result.week);
    else setErrors(result.errors);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="border-border bg-card hover:bg-card-nested"
      >
        <Upload className="h-3.5 w-3.5" /> Import CSV
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        aria-label="Import CSV file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current week with the contents of the CSV. Your existing
              exercises will be overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) onImport(pending);
                setPending(null);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={errors !== null} onOpenChange={(open) => !open && setErrors(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import failed</AlertDialogTitle>
            <AlertDialogDescription>
              The file could not be imported. Fix the issues below and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-destructive">
            {(errors ?? []).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrors(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
