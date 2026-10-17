"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const isStaticDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "static";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch(isCodeSent ? "/api/auth/otp/verify" : "/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCodeSent ? { phoneNumber, code } : { phoneNumber }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to verify your mobile number.");
        return;
      }

      if (isCodeSent) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setIsCodeSent(true);
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          SportEvent
        </Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-900">Sign in with your mobile</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We’ll send a one-time verification code by SMS. Use your full international number, including the + country code.
        </p>

        {isStaticDemo ? (
          <p className="mt-7 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Sign-in is disabled in this non-commercial static demo. No SMS messages are sent.
          </p>
        ) : (
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="phone-number">
            Mobile number
            <input
              id="phone-number"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              pattern="^\+[1-9][0-9]{7,14}$"
              title="Use international E.164 format, for example +14155552671."
              disabled={isCodeSent}
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+14155552671"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
            />
          </label>

          {isCodeSent ? (
            <label className="block text-sm font-medium text-slate-700" htmlFor="otp-code">
              6-digit verification code
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 tracking-[0.4em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          ) : null}

          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait..." : isCodeSent ? "Verify and sign in" : "Send verification code"}
          </button>

          {isCodeSent ? (
            <button
              type="button"
              onClick={() => {
                setIsCodeSent(false);
                setCode("");
                setError("");
              }}
              className="w-full text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Change mobile number
            </button>
          ) : null}
        </form>
        )}
      </section>
    </main>
  );
}
