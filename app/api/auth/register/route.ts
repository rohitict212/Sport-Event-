import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createDemoUser,
  getDemoUserByMobile,
  isDatabaseUnavailable,
} from "@/lib/auth-demo-store";
import { prisma } from "@/lib/prisma";

const normalizeMobile = (value: string) => value.replace(/\s+/g, "").replace(/[^\d+]/g, "").trim();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  mobileNumber: z.string().trim().min(10, "A valid mobile number is required."),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid form data." },
        { status: 400 },
      );
    }

    const mobileNumber = normalizeMobile(parsed.data.mobileNumber);
    if (!mobileNumber) {
      return NextResponse.json({ error: "A valid mobile number is required." }, { status: 400 });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { mobileNumber },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with that mobile number already exists." },
          { status: 409 },
        );
      }
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      const demoUser = await getDemoUserByMobile(mobileNumber);
      if (demoUser) {
        return NextResponse.json(
          { error: "An account with that mobile number already exists." },
          { status: 409 },
        );
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hash(otp, 10);
    const email = `${mobileNumber.replace(/\D/g, "")}@sportevent.local`;
    const passwordHash = await hash(`${mobileNumber}-otp-user`, 12);

    try {
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email,
          mobileNumber,
          passwordHash,
          otpCode: otpHash,
          otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      return NextResponse.json(
        {
          id: user.id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          otp: process.env.NODE_ENV !== "production" ? otp : undefined,
        },
        { status: 201 },
      );
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      const demoUser = await createDemoUser({
        name: parsed.data.name,
        mobileNumber,
        passwordHash,
        otpCode: otpHash,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      return NextResponse.json(
        {
          id: demoUser.id,
          name: demoUser.name,
          mobileNumber: demoUser.mobileNumber,
          otp: process.env.NODE_ENV !== "production" ? otp : undefined,
        },
        { status: 201 },
      );
    }
  } catch (error) {
    const message = String(error ?? "");
    const isUnavailable = isDatabaseUnavailable(error) || message.includes("Can't reach database server") || message.includes("database server") || message.includes("P1001") || message.includes("P1002");

    console.error("Register error", error);
    return NextResponse.json(
      {
        error: isUnavailable
          ? "The account service is temporarily unavailable. Please try again in a moment."
          : "Unable to create account. Please check your details and try again.",
      },
      { status: isUnavailable ? 503 : 500 },
    );
  }
}
