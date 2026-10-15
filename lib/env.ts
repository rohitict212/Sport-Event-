import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL.").default("http://localhost:3000"),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET must be at least 16 characters long.")
    .default("development-secret-change-me"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL.").default("http://localhost:3000"),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`);
    throw new Error(`Invalid environment configuration: ${issues.join("; ")}`);
  }

  return parsed.data;
}

export const env = validateEnv();
