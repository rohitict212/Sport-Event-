import Link from "next/link";
import { redirect } from "next/navigation";

import ManagementClient from "@/app/dashboard/management-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const organizations = await getOrganizerOrganizations(user.id);
  const organizationIds = organizations.map(({ id }) => id);
  const [tournaments, teams] = await Promise.all([
    prisma.tournament.findMany({
      where: { organizationId: { in: organizationIds } },
      select: { id: true, name: true, organizationId: true, organization: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      where: { organizationId: { in: organizationIds } },
      select: {
        id: true,
        name: true,
        organization: { select: { name: true } },
        tournament: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Teams</h1>
          <p className="mt-2 text-slate-600">Add teams to tournaments you organize.</p>
        </div>
        <Link href="/dashboard/tournaments" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          Manage tournaments →
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          {teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No teams yet.
            </div>
          ) : (
            teams.map((team) => (
              <article key={team.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">{team.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {team.tournament.name} · {team.organization.name}
                </p>
              </article>
            ))
          )}
        </section>
        <ManagementClient mode="team" tournaments={tournaments} />
      </div>
    </main>
  );
}
