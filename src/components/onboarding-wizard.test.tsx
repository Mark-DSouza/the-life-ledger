import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingWizard } from "./onboarding-wizard";
import type { WorkoutTemplate } from "@/lib/fitness-templates";

const ppl: WorkoutTemplate = {
  id: "11111111-1111-1111-1111-111111111111",
  goal: "Hypertrophy",
  name: "PPL Hypertrophy",
  description: "Push/Pull/Legs 6-day split",
  isPublic: true,
  days: [
    { weekday: "Mon", type: "Hypertrophy", summary: "Push" },
    { weekday: "Sun", type: "Rest", summary: "Recovery" },
  ],
};

function setup(templates: WorkoutTemplate[] = [ppl]) {
  const loadTemplates = vi.fn(async () => templates);
  const onApplyTemplate = vi.fn(async () => {});
  const onCustom = vi.fn(async () => {});
  render(
    <OnboardingWizard
      loadTemplates={loadTemplates}
      onApplyTemplate={onApplyTemplate}
      onCustom={onCustom}
    />,
  );
  return { loadTemplates, onApplyTemplate, onCustom };
}

describe("OnboardingWizard", () => {
  it("offers Hypertrophy, Cardio and Custom goals", () => {
    setup();
    expect(screen.getByRole("button", { name: /hypertrophy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cardio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /custom/i })).toBeInTheDocument();
  });

  it("skips the template picker entirely for Custom", async () => {
    const user = userEvent.setup();
    const { loadTemplates, onCustom } = setup();

    await user.click(screen.getByRole("button", { name: /custom/i }));

    expect(onCustom).toHaveBeenCalledTimes(1);
    expect(loadTemplates).not.toHaveBeenCalled();
  });

  it("shows the goal's templates with a day-by-day breakdown", async () => {
    const user = userEvent.setup();
    const { loadTemplates } = setup();

    await user.click(screen.getByRole("button", { name: /hypertrophy/i }));

    expect(loadTemplates).toHaveBeenCalledWith("Hypertrophy");
    expect(await screen.findByText("PPL Hypertrophy")).toBeInTheDocument();
    expect(screen.getByText("Push/Pull/Legs 6-day split")).toBeInTheDocument();
    expect(screen.getByText("Push")).toBeInTheDocument();
    expect(screen.getByText("Recovery")).toBeInTheDocument();
  });

  it("applies the selected template on confirmation", async () => {
    const user = userEvent.setup();
    const { onApplyTemplate } = setup();

    await user.click(screen.getByRole("button", { name: /hypertrophy/i }));
    await user.click(await screen.findByText("PPL Hypertrophy"));
    await user.click(screen.getByRole("button", { name: /use this plan/i }));

    expect(onApplyTemplate).toHaveBeenCalledWith(ppl.id);
  });

  it("can go back to the goal picker", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /hypertrophy/i }));
    await screen.findByText("PPL Hypertrophy");
    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByRole("button", { name: /custom/i })).toBeInTheDocument();
  });
});
