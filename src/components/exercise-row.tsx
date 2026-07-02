import { Trash2 } from "lucide-react";
import { InlineEdit } from "@/components/inline-edit";
import type { Exercise } from "@/lib/fitness-data";

/** A single Training Week exercise — renders lift or cardio fields per exerciseType. */
export function ExerciseRow({
  exercise,
  onChange,
  onDelete,
}: {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onDelete: () => void;
}) {
  const num = (v: string) => Number(v) || 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-3 text-sm">
      {exercise.exerciseType === "lift" ? (
        <>
          <span className="text-tertiary">Body</span>
          <InlineEdit
            value={exercise.bodyPart}
            onChange={(v) => onChange({ ...exercise, bodyPart: v })}
          />
          <span className="text-tertiary">·</span>
          <span className="text-tertiary">Exercise</span>
          <InlineEdit value={exercise.name} onChange={(v) => onChange({ ...exercise, name: v })} />
          <span>
            Sets{" "}
            <InlineEdit
              type="number"
              value={exercise.sets}
              onChange={(v) => onChange({ ...exercise, sets: num(v) })}
              width="4ch"
            />
          </span>
          <span>
            Reps{" "}
            <InlineEdit
              type="number"
              value={exercise.reps}
              onChange={(v) => onChange({ ...exercise, reps: num(v) })}
              width="4ch"
            />
          </span>
          <span>
            Weight{" "}
            <InlineEdit
              type="number"
              value={exercise.weight}
              onChange={(v) => onChange({ ...exercise, weight: num(v) })}
              suffix="kg"
              width="5ch"
            />
          </span>
          <span>
            Seat{" "}
            <InlineEdit
              value={exercise.seat}
              onChange={(v) => onChange({ ...exercise, seat: v })}
            />
          </span>
        </>
      ) : (
        <>
          <InlineEdit
            value={exercise.name}
            onChange={(v) => onChange({ ...exercise, name: v })}
            placeholder="Exercise"
          />
          <span className="text-tertiary">·</span>
          <span>
            Pace{" "}
            <InlineEdit
              type="number"
              value={exercise.pace}
              onChange={(v) => onChange({ ...exercise, pace: num(v) })}
              suffix="min/km"
              width="6ch"
              step={0.1}
            />
          </span>
          <span>
            Duration{" "}
            <InlineEdit
              type="number"
              value={exercise.duration}
              onChange={(v) => onChange({ ...exercise, duration: num(v) })}
              suffix="min"
              width="4ch"
            />
          </span>
          <span>
            BPM{" "}
            <InlineEdit
              type="number"
              value={exercise.bpm}
              onChange={(v) => onChange({ ...exercise, bpm: num(v) })}
              width="4ch"
            />
          </span>
        </>
      )}
      <button
        onClick={onDelete}
        className="ml-auto text-tertiary hover:text-destructive"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
