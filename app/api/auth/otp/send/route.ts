import { NextResponse } from "next/server";

import { consumeAuthRateLimits } from "@/lib/auth/rate-limit";
import { isSameOriginRequest } from "@/lib/auth/request";
import { sendPhoneVerification } from "@/lib/auth/twilio-verify";
import { sendOtpSchema } from "@/validations/auth";

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

  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid mobile number." }, { status: 400 });
  }

  try {
    if (await consumeAuthRateLimits(request, parsed.data.phoneNumber, "send")) {
      return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
    }

    const result = await sendPhoneVerification(parsed.data.phoneNumber);
    if (!result.ok) {
      const status = result.status === 429 ? 429 : 502;
      return NextResponse.json({ error: "Unable to send a verification code right now." }, { status });
    }

    return NextResponse.json({ message: "If this number can receive messages, a verification code has been sent." });
  } catch (error) {
    console.error("Phone verification request failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Phone verification is temporarily unavailable." }, { status: 503 });
  }
}
