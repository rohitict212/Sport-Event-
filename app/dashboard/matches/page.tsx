import MatchManagementClient from "@/app/dashboard/matches/match-client";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function MatchesPage() {
  const user = await requireCurrentUser();
  const organizations = await getOrganizerOrganizations(user.id);
  const organizationIds = organizations.map(({ id }) => id);

  const [tournaments, matches] = await Promise.all([
    prisma.tournament.findMany({
      where: { organizationId: { in: organizationIds } },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: { select: { name: true } },
        teams: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { organizationId: { in: organizationIds } },
      include: {
        tournament: { select: { name: true } },
        teamA: { select: { name: true } },
        teamB: { select: { name: true } },
        winner: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Matches</h1>
          <p className="mt-2 text-slate-600">Schedule fixtures for your tournaments.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No matches scheduled yet.
            </div>
          ) : (
            matches.map((match) => (
              <article key={match.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {match.tournament.name}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {match.status}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {match.teamA.name} vs {match.teamB.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {new Date(match.scheduledAt).toLocaleString()}
                  {match.venueName ? `· ${match.venueName}` : ""}
                </p>
                {match.winner ? (
                  <p className="mt-2 text-sm text-emerald-700">Winner: {match.winner.name}</p>
                ) : null}
              </article>
            ))
          )}
        </section>

        <MatchManagementClient tournaments={tournaments} />
      </div>
    </main>
  );
}
