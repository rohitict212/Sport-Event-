import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "../../middleware";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("static demo middleware", () => {
  it("blocks API requests when static demo mode is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "static");

    const response = middleware(new NextRequest("https://sportevent.example/api/auth/otp/send", { method: "POST" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "This feature is disabled in the static demo." });
  });

  it.each(["/dashboard", "/tournaments/example"])("rewrites %s to the demo notice", (path) => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "static");

    const response = middleware(new NextRequest(`https://sportevent.example${path}`));

    expect(response.headers.get("x-middleware-rewrite")).toBe("https://sportevent.example/demo-disabled");
  });

  it("does not change routes outside static demo mode", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");

    const response = middleware(new NextRequest("https://sportevent.example/api/organizations"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("adds HSTS to production HTTPS responses", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    vi.stubEnv("NODE_ENV", "production");

    const response = middleware(new NextRequest("https://sportevent.example/"));

    expect(response.headers.get("strict-transport-security")).toBe("max-age=63072000");
  });
});
