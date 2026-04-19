import { describe, expect, it } from "vitest";

import { readClientEnv } from "./env";

describe("readClientEnv", () => {
  it("uses documented defaults when optional values are missing", () => {
    expect(
      readClientEnv({
        BASE_URL: "/",
        DEV: true,
        MODE: "test",
        PROD: false,
        SSR: false,
      }),
    ).toEqual({
      appName: "EcoBairro",
      apiBaseUrl: "/api",
      analyticsBaseUrl: "/analytics",
    });
  });

  it("throws when a provided value is blank", () => {
    expect(() =>
      readClientEnv({
        BASE_URL: "/",
        DEV: true,
        MODE: "test",
        PROD: false,
        SSR: false,
        VITE_API_BASE_URL: "   ",
      }),
    ).toThrow("Expected VITE_API_BASE_URL to be defined.");
  });
});
