import { afterEach, describe, expect, it, vi } from "vitest";

import { checkPhoneVerification, sendPhoneVerification } from "../../lib/auth/twilio-verify";

const accountSid = `AC${"a".repeat(32)}`;
const verifyServiceSid = `VA${"b".repeat(32)}`;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Twilio Verify integration", () => {
  it("sends a verification through SMS without exposing provider errors", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", accountSid);
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test-auth-token");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", verifyServiceSid);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "pending" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendPhoneVerification("+14155552671")).resolves.toEqual({
      ok: true,
      data: { status: "pending" },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/Services/${verifyServiceSid}/Verifications`);
    expect(options.method).toBe("POST");
    expect(String(options.body)).toContain("Channel=sms");
    expect(String(options.body)).toContain("To=%2B14155552671");
  });

  it("checks a six-digit code with Twilio Verify", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", accountSid);
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test-auth-token");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", verifyServiceSid);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "approved" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkPhoneVerification("+14155552671", "004219")).resolves.toEqual({
      ok: true,
      data: { status: "approved" },
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/Services/${verifyServiceSid}/VerificationCheck`);
    expect(String(options.body)).toContain("Code=004219");
  });

  it("fails closed when production provider credentials are missing", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendPhoneVerification("+14155552671")).rejects.toThrow("Twilio Verify is not configured.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed Twilio service identifiers before network calls", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "not-a-twilio-account");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test-auth-token");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", verifyServiceSid);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendPhoneVerification("+14155552671")).rejects.toThrow("Twilio Verify is not configured.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
