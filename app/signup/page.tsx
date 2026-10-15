"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [otpNotice, setOtpNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOtpNotice("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobileNumber }),
    });

    const payload = (await response.json()) as { error?: string; otp?: string; mobileNumber?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to create account.");
      return;
    }

    const notice = payload.otp
      ? `Account created successfully. Demo OTP: ${payload.otp}`
      : "Account created successfully. Please sign in with your mobile number and OTP.";

    setOtpNotice(notice);
    router.push(`/login?mobile=${encodeURIComponent(payload.mobileNumber ?? mobileNumber)}${payload.otp ? `&otp=${encodeURIComponent(payload.otp)}` : ""}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">SportEvent</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">Set up your organizer account using only your mobile number and OTP.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

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

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {otpNotice ? <p className="text-sm text-emerald-700">{otpNotice}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
