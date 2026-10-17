import Link from "next/link";

import DemoWorkspace from "./workspace";
import "./demo.css";

export const metadata = {
  title: "Interactive demo | SportEvent",
  description: "Try tournament management with fictional sample data in your browser.",
};

export default function DemoPage() {
  return (
    <main className="demo-page min-h-screen">
      <header className="demo-header border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-lg font-bold text-white">
            SportEvent
          </Link>
          <p className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
            Interactive sample · fictional data · no account
          </p>
        </div>
      </header>
      <DemoWorkspace />
    </main>
  );
}
