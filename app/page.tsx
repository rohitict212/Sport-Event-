import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">SportEvent</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Organize local cricket tournaments with less admin work.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Manage teams, players, schedules, results, and public tournament pages from one simple dashboard.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
