import { describe, expect, it } from "vitest";

import { e164PhoneSchema, sendOtpSchema, verifyOtpSchema } from "../../validations/auth";

describe("E.164 mobile-number validation", () => {
  it.each(["+14155552671", "+27821234567", "+919876543210"])("accepts %s", (phoneNumber) => {
    expect(e164PhoneSchema.safeParse(phoneNumber).success).toBe(true);
  });

  it.each(["14155552671", "+01234567890", "+123", "+12345678901234567", "+1 (415) 555-2671", ""])(
    "rejects invalid E.164 number %s",
    (phoneNumber) => {
      expect(e164PhoneSchema.safeParse(phoneNumber).success).toBe(false);
    },
  );
});

describe("OTP validation", () => {
  it("accepts an E.164 number and exactly six numeric digits", () => {
    expect(verifyOtpSchema.safeParse({ phoneNumber: "+14155552671", code: "004219" }).success).toBe(true);
  });

  it.each(["12345", "1234567", "12345a", " 12345", ""])(
    "rejects malformed OTP %s",
    (code) => {
      expect(verifyOtpSchema.safeParse({ phoneNumber: "+14155552671", code }).success).toBe(false);
    },
  );

  it("rejects invalid phone numbers before sending an OTP", () => {
    expect(sendOtpSchema.safeParse({ phoneNumber: "4155552671" }).success).toBe(false);
  });
});
