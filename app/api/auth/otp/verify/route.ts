import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth/session";
import { consumeAuthRateLimits } from "@/lib/auth/rate-limit";
import { isSameOriginRequest } from "@/lib/auth/request";
import { checkPhoneVerification } from "@/lib/auth/twilio-verify";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/validations/auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification code." }, { status: 400 });
  }

  try {
    if (await consumeAuthRateLimits(request, parsed.data.phoneNumber, "verify")) {
      return NextResponse.json({ error: "Too many attempts. Request a new code later." }, { status: 429 });
    }

    const result = await checkPhoneVerification(parsed.data.phoneNumber, parsed.data.code);
    if (!result.ok) {
      const status = result.status === 429 ? 429 : 502;
      return NextResponse.json({ error: "Unable to verify the code right now." }, { status });
    }

    if (result.data.status !== "approved") {
      return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { mobileNumber: parsed.data.phoneNumber },
      update: {},
      create: { mobileNumber: parsed.data.phoneNumber },
      select: { id: true },
    });

    await prisma.session.deleteMany({ where: { expires: { lt: new Date() } } });
    await createSession(user.id);

    return NextResponse.json({ message: "Your mobile number has been verified." });
  } catch (error) {
    console.error("Phone verification failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Phone sign-in is temporarily unavailable." }, { status: 503 });
  }
}
