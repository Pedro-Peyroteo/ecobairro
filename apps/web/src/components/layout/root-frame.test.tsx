import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RootFrame } from "./root-frame";

describe("RootFrame", () => {
  it("renders the shared scaffold chrome", () => {
    render(
      <RootFrame appName="EcoBairro" navigation={<div>Primary Navigation</div>}>
        <div>Route Outlet</div>
      </RootFrame>,
    );

    expect(screen.getByText("EcoBairro")).toBeInTheDocument();
    expect(screen.getByText("Primary Navigation")).toBeInTheDocument();
    expect(screen.getByText("Route Outlet")).toBeInTheDocument();
    expect(
      screen.getByText(/Routes are authored only from/i),
    ).toBeInTheDocument();
  });
});
