import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import LogoutButton from "@/app/dashboard/logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="font-bold text-slate-900">SportEvent</Link>
          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/dashboard">Organizations</Link>
            <Link href="/dashboard/tournaments">Tournaments</Link>
            <Link href="/dashboard/teams">Teams</Link>
            <Link href="/dashboard/players">Players</Link>
            <Link href="/dashboard/matches">Matches</Link>
            <Link href="/dashboard/scoring">Scoring</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">{user.mobileNumber}</span>
            <LogoutButton />
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}
