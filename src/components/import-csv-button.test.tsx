import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportCsvButton } from "./import-csv-button";

const HEADER =
  "day,day_type,summary,exercise_type,name,body_part,sets,reps,weight,seat,pace,duration_min,bpm";

const VALID_CSV = `${HEADER}\nMon,Strength,Back,lift,Deadlift,Back,3,5,110,—,,,\n`;

function csvFile(content: string): File {
  return new File([content], "fitness-week.csv", { type: "text/csv" });
}

async function pickFile(content: string) {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Import CSV file"), csvFile(content));
}

describe("ImportCsvButton", () => {
  it("shows a replace-week confirmation before importing anything", async () => {
    const onImport = vi.fn();
    render(<ImportCsvButton onImport={onImport} />);

    await pickFile(VALID_CSV);

    await waitFor(() => expect(screen.getByText(/replace your current week/i)).toBeInTheDocument());
    expect(onImport).not.toHaveBeenCalled();
  });

  it("imports the parsed week when the user confirms", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<ImportCsvButton onImport={onImport} />);

    await pickFile(VALID_CSV);
    await user.click(await screen.findByRole("button", { name: /continue/i }));

    expect(onImport).toHaveBeenCalledTimes(1);
    const week = onImport.mock.calls[0][0];
    expect(week.Mon.exercises[0]).toMatchObject({ exerciseType: "lift", name: "Deadlift" });
  });

  it("makes no changes when the user cancels", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<ImportCsvButton onImport={onImport} />);

    await pickFile(VALID_CSV);
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(onImport).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText(/replace your current week/i)).not.toBeInTheDocument(),
    );
  });

  it("surfaces validation errors instead of a confirmation for a bad file", async () => {
    const onImport = vi.fn();
    render(<ImportCsvButton onImport={onImport} />);

    await pickFile("not,a,fitness\ncsv,at,all\n");

    await waitFor(() => expect(screen.getByText(/missing required column/i)).toBeInTheDocument());
    expect(screen.queryByText(/replace your current week/i)).not.toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });
});
