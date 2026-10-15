"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileNumber, setMobileNumber] = useState(searchParams.get("mobile") ?? "");
  const [otp, setOtp] = useState(searchParams.get("otp") ?? "");
  const [error, setError] = useState("");
  const [otpStatus, setOtpStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  async function handleSendOtp() {
    setError("");
    setOtpStatus("");

    if (!mobileNumber.trim()) {
      setError("Enter your mobile number to receive the OTP.");
      return;
    }

    setIsSendingOtp(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const payload = (await response.json()) as { error?: string; otp?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to send OTP.");
        return;
      }

      setOtpStatus(
        payload.otp
          ? `OTP sent. Demo code: ${payload.otp}`
          : "OTP has been sent to your mobile number. Please check it and continue.",
      );
    } catch {
      setError("The OTP service is temporarily unavailable. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      redirect: false,
      mobileNumber,
      otp,
    });

    setIsSubmitting(false);

    if (result?.error) {
      const message = result.error.toLowerCase();
      setError(
        message.includes("database") || message.includes("prisma") || message.includes("db")
          ? "The login service is temporarily unavailable. Please try again in a moment."
          : "Incorrect mobile number or OTP. Please try again.",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">SportEvent</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with your mobile number and OTP.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="mobileNumber">
              Mobile number
            </label>
            <input
              id="mobileNumber"
              type="tel"
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <button
            type="button"
            disabled={isSendingOtp}
            onClick={handleSendOtp}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSendingOtp ? "Sending OTP..." : "Send OTP"}
          </button>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="otp">
              OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {otpStatus ? <p className="text-sm text-emerald-700">{otpStatus}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-600">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
