import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Proves the test harness is wired end to end: jsdom environment, React
// Testing Library render, and @testing-library/jest-dom matchers.
describe("test harness", () => {
  it("evaluates expressions", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders into jsdom and exposes jest-dom matchers", () => {
    render(<div>hello world</div>);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });
});
