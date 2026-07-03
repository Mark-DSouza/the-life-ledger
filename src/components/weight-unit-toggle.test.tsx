import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WeightUnitToggle } from "./weight-unit-toggle";

describe("WeightUnitToggle", () => {
  it("offers kg and lbs and marks the active unit", () => {
    render(<WeightUnitToggle value="kg" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "kg" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "lbs" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the newly chosen unit through onChange", () => {
    const onChange = vi.fn();
    render(<WeightUnitToggle value="kg" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "lbs" }));
    expect(onChange).toHaveBeenCalledWith("lbs");
  });

  it("does not fire onChange when the active unit is clicked again", () => {
    const onChange = vi.fn();
    render(<WeightUnitToggle value="kg" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "kg" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
