import { createHmac } from "node:crypto";

import { prisma } from "@/lib/prisma";

type RateLimit = {
  key: string;
  limit: number;
  windowSeconds: number;
};

function hashRateLimitKey(value: string) {
  const secret = process.env.TWILIO_AUTH_TOKEN;
  if (!secret) {
    throw new Error("Twilio Verify is not configured.");
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

export function getClientAddress(request: Request) {
  const realAddress = request.headers.get("x-real-ip")?.trim();
  if (realAddress) {
    return realAddress;
  }

  const forwardedAddress = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwardedAddress || "unknown";
}

export async function consumeAuthRateLimits(request: Request, phoneNumber: string, action: "send" | "verify") {
  const address = getClientAddress(request);
  const limits: RateLimit[] =
    action === "send"
      ? [
          { key: `send:phone:${phoneNumber}`, limit: 3, windowSeconds: 600 },
          { key: `send:address:${address}`, limit: 10, windowSeconds: 600 },
        ]
      : [
          { key: `verify:phone:${phoneNumber}`, limit: 6, windowSeconds: 900 },
          { key: `verify:address:${address}`, limit: 30, windowSeconds: 900 },
        ];

  const hashedLimits = limits.map((limit) => ({
    ...limit,
    key: hashRateLimitKey(limit.key),
  }));

  const results = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      DELETE FROM "auth_rate_limits"
      WHERE "window_started_at" < CURRENT_TIMESTAMP - INTERVAL '1 day'
    `;

    return Promise.all(
      hashedLimits.map(({ key, windowSeconds }) =>
        transaction.$queryRaw<{ count: number }[]>`
          INSERT INTO "auth_rate_limits" ("key", "count", "window_started_at", "updated_at")
          VALUES (${key}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("key") DO UPDATE
          SET
            "count" = CASE
              WHEN "auth_rate_limits"."window_started_at" <= CURRENT_TIMESTAMP - make_interval(secs => ${windowSeconds})
              THEN 1
              ELSE "auth_rate_limits"."count" + 1
            END,
            "window_started_at" = CASE
              WHEN "auth_rate_limits"."window_started_at" <= CURRENT_TIMESTAMP - make_interval(secs => ${windowSeconds})
              THEN CURRENT_TIMESTAMP
              ELSE "auth_rate_limits"."window_started_at"
            END,
            "updated_at" = CURRENT_TIMESTAMP
          RETURNING "count"
        `,
      ),
    );
  });

  return results.some((result, index) => (result[0]?.count ?? Number.MAX_SAFE_INTEGER) > hashedLimits[index].limit);
}
