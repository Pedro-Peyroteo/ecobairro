import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "../routes/index";

describe("HomePage", () => {
  it("renders the handoff guidance placeholders", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /TanStack Start scaffolding is in place/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Route Files Only/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready For Wiring/i)).toBeInTheDocument();
  });
});
