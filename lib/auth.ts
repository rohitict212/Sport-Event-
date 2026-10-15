import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import {
  clearDemoUserOtp,
  getDemoUserByMobile,
  isDatabaseUnavailable,
} from "@/lib/auth-demo-store";
import { validateEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

validateEnv();

const normalizeMobile = (value: string) => value.replace(/\s+/g, "").replace(/[^\d+]/g, "").trim();

const credentialsSchema = z.object({
  mobileNumber: z.string().trim().min(10, "Mobile number is required."),
  otp: z.string().trim().length(6, "A valid 6-digit OTP is required."),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "OTP Login",
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(rawCredentials) {
        try {
          const parsed = credentialsSchema.safeParse(rawCredentials);

          if (!parsed.success) {
            return null;
          }

          const mobileNumber = normalizeMobile(parsed.data.mobileNumber);

          try {
            const user = await prisma.user.findUnique({
              where: { mobileNumber },
            });

            if (!user || !user.otpCode || !user.otpExpiresAt) {
              return null;
            }

            const otpExpired = new Date(user.otpExpiresAt).getTime() < Date.now();
            if (otpExpired) {
              return null;
            }

            const isValidOtp = await compare(parsed.data.otp, user.otpCode);
            if (!isValidOtp) {
              return null;
            }

            await prisma.user.update({
              where: { id: user.id },
              data: { otpCode: null, otpExpiresAt: null },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name ?? mobileNumber,
            };
          } catch (error) {
            if (!isDatabaseUnavailable(error)) {
              throw error;
            }

            const demoUser = await getDemoUserByMobile(mobileNumber);
            if (!demoUser || !demoUser.otpCode || !demoUser.otpExpiresAt) {
              return null;
            }

            const otpExpired = new Date(demoUser.otpExpiresAt).getTime() < Date.now();
            if (otpExpired) {
              return null;
            }

            const isValidOtp = await compare(parsed.data.otp, demoUser.otpCode);
            if (!isValidOtp) {
              return null;
            }

            await clearDemoUserOtp(mobileNumber);

            return {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name ?? mobileNumber,
            };
          }
        } catch (error) {
          console.error("Authentication error", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
