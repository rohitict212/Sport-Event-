import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getDemoUserByMobile,
  isDatabaseUnavailable,
  updateDemoUserOtp,
} from "@/lib/auth-demo-store";
import { prisma } from "@/lib/prisma";

const normalizeMobile = (value: string) => value.replace(/\s+/g, "").replace(/[^\d+]/g, "").trim();

const sendOtpSchema = z.object({
  mobileNumber: z.string().trim().min(10, "A valid mobile number is required."),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid mobile number." },
        { status: 400 },
      );
    }

    const mobileNumber = normalizeMobile(parsed.data.mobileNumber);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    try {
      const user = await prisma.user.findUnique({ where: { mobileNumber } });

      if (!user) {
        return NextResponse.json({ error: "No account found for this mobile number." }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: otpHash,
          otpExpiresAt: otpExpiry,
        },
      });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      const demoUser = await getDemoUserByMobile(mobileNumber);
      if (!demoUser) {
        return NextResponse.json({ error: "No account found for this mobile number." }, { status: 404 });
      }

      await updateDemoUserOtp(mobileNumber, otpHash, otpExpiry);
    }

    return NextResponse.json(
      {
        success: true,
        otp: process.env.NODE_ENV !== "production" ? otp : undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = String(error ?? "");
    const unavailable = isDatabaseUnavailable(error) || message.includes("Can't reach database server") || message.includes("database server") || message.includes("P1001") || message.includes("P1002");

    console.error("Send OTP error", error);
    return NextResponse.json(
      {
        error: unavailable
          ? "The OTP service is temporarily unavailable. Please try again in a moment."
          : "Unable to send OTP right now. Please try again.",
      },
      { status: unavailable ? 503 : 500 },
    );
  }
}
