import { afterEach, describe, expect, it, vi } from "vitest";

import { isSameOriginRequest } from "../../lib/auth/request";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("same-origin request validation", () => {
  it("accepts requests from the configured origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sportevent.example");
    vi.stubEnv("NODE_ENV", "production");

    const request = new Request("https://sportevent.example/api/organizations", {
      method: "POST",
      headers: { Origin: "https://sportevent.example" },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects cross-origin and missing-origin requests", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sportevent.example");
    vi.stubEnv("NODE_ENV", "production");

    const crossOrigin = new Request("https://sportevent.example/api/organizations", {
      method: "POST",
      headers: { Origin: "https://attacker.example" },
    });
    const missingOrigin = new Request("https://sportevent.example/api/organizations", { method: "POST" });

    expect(isSameOriginRequest(crossOrigin)).toBe(false);
    expect(isSameOriginRequest(missingOrigin)).toBe(false);
  });

  it("allows localhost and loopback aliases only in development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    const localRequest = new Request("http://127.0.0.1:3000/api/auth/otp/send", {
      method: "POST",
      headers: { Origin: "http://127.0.0.1:3000" },
    });

    expect(isSameOriginRequest(localRequest)).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(isSameOriginRequest(localRequest)).toBe(false);
  });
});
