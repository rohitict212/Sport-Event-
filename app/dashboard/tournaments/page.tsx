import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import ManagementClient from "@/app/dashboard/management-client";

export default async function TournamentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const organizations = await getOrganizerOrganizations(user.id);
  const tournaments = await prisma.tournament.findMany({
    where: { organizationId: { in: organizations.map(({ id }) => id) } },
    include: {
      organization: { select: { name: true } },
      _count: { select: { teams: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Tournaments</h1>
          <p className="mt-2 text-slate-600">Create and manage tournaments for your organizations.</p>
        </div>
        <Link href="/dashboard/teams" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          Manage teams →
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          {tournaments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No tournaments yet.
            </div>
          ) : (
            tournaments.map((tournament) => (
              <article key={tournament.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {tournament.organization.name}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{tournament.name}</h2>
                {tournament.description ? (
                  <p className="mt-2 text-sm text-slate-600">{tournament.description}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{tournament._count.teams} teams</p>
                  <Link href={`/tournaments/${tournament.id}`} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" target="_blank" rel="noreferrer">
                    View standings →
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
        <ManagementClient mode="tournament" organizations={organizations} />
      </div>
    </main>
  );
}
