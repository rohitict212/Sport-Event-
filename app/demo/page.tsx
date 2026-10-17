import Link from "next/link";

import DemoWorkspace from "./workspace";

export const metadata = {
  title: "Interactive demo | SportEvent",
  description: "Try tournament management with fictional sample data in your browser.",
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-lg font-bold text-slate-900">
            SportEvent
          </Link>
          <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Interactive sample · fictional data · no account
          </p>
        </div>
      </header>
      <DemoWorkspace />
    </main>
  );
}
