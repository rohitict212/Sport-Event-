import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL.").optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`);
    throw new Error(`Invalid environment configuration: ${issues.join("; ")}`);
  }

  if (!parsed.data.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment configuration: NEXT_PUBLIC_APP_URL is required in production.");
  }

  return {
    ...parsed.data,
    NEXT_PUBLIC_APP_URL: parsed.data.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}

export const env = validateEnv();
