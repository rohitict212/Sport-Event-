import Link from "next/link";

const isStaticDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "static";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">SportEvent</p>
        {isStaticDemo ? (
          <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Non-commercial static demo
          </p>
        ) : null}
        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Organize local cricket tournaments with less admin work.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Manage teams, players, schedules, results, and public tournament pages from one simple dashboard.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          {isStaticDemo ? (
            <>
              <Link
                href="/demo"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Try the interactive demo
              </Link>
              <p className="self-center text-sm leading-6 text-slate-600">
                Explore with sample data. Changes stay in this browser.
              </p>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Sign in to manage tournaments
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
