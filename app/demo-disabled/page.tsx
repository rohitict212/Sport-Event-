import Link from "next/link";

export default function DemoDisabledPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">SportEvent demo</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Organizer tools are disabled</h1>
        <p className="mt-4 leading-7 text-slate-600">
          This is a non-commercial static preview. Sign-in, tournament data, and organizer actions are not available.
        </p>
        <Link href="/" className="mt-7 inline-flex font-semibold text-emerald-700 hover:text-emerald-800">
          Return to the preview
        </Link>
      </section>
    </main>
  );
}
