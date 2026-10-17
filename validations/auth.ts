import { z } from "zod";

export const e164PhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid mobile number in international format, for example +14155552671.");

export const sendOtpSchema = z.object({
  phoneNumber: e164PhoneSchema,
});

export const verifyOtpSchema = z.object({
  phoneNumber: e164PhoneSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});
