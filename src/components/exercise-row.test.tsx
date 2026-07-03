import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExerciseRow } from "./exercise-row";
import type { Exercise } from "@/lib/fitness-data";

const lift: Exercise = {
  id: "1",
  exerciseType: "lift",
  name: "Bench Press",
  bodyPart: "Chest",
  sets: 3,
  reps: 10,
  weight: 60,
  seat: "—",
};

const cardio: Exercise = {
  id: "2",
  exerciseType: "cardio",
  name: "Treadmill",
  pace: 6.5,
  duration: 35,
  bpm: 138,
};

describe("ExerciseRow", () => {
  it("renders a lift with body part, name, sets, reps and weight", () => {
    render(<ExerciseRow exercise={lift} onChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Sets")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bench Press")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chest")).toBeInTheDocument();
  });

  it("reports edits to the sets field through onChange", () => {
    const onChange = vi.fn();
    render(<ExerciseRow exercise={lift} onChange={onChange} onDelete={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("3"), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith({ ...lift, sets: 5 });
  });

  it("renders a cardio block with pace labelled min/km and no lift fields", () => {
    render(<ExerciseRow exercise={cardio} onChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByDisplayValue("6.5")).toBeInTheDocument();
    expect(screen.getByText("min/km")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Treadmill")).toBeInTheDocument();
    expect(screen.queryByText("Sets")).not.toBeInTheDocument();
  });

  it("labels the weight with the user's preferred unit", () => {
    render(
      <ExerciseRow exercise={lift} weightUnit="lbs" onChange={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText("lbs")).toBeInTheDocument();
    expect(screen.queryByText("kg")).not.toBeInTheDocument();
  });

  it("defaults the weight unit to kg", () => {
    render(<ExerciseRow exercise={lift} onChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("fires onDelete when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<ExerciseRow exercise={lift} onChange={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });
});
