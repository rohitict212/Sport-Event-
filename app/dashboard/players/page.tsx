import PlayerManagementClient from "@/app/dashboard/players/player-client";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function PlayersPage() {
  const user = await requireCurrentUser();
  const organizations = await getOrganizerOrganizations(user.id);
  const organizationIds = organizations.map(({ id }) => id);

  const [teams, players] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: { in: organizationIds } },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: { select: { name: true } },
        tournament: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.player.findMany({
      where: { organizationId: { in: organizationIds } },
      select: {
        id: true,
        name: true,
        role: true,
        jerseyNumber: true,
        team: { select: { name: true, tournament: { select: { name: true } } } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Players</h1>
          <p className="mt-2 text-slate-600">Track squad members for each team and tournament.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          {players.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No players added yet.
            </div>
          ) : (
            players.map((player) => (
              <article key={player.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{player.name}</h2>
                  {player.role ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {player.role}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {player.team.name} · {player.team.tournament.name} · {player.organization.name}
                </p>
                {player.jerseyNumber ? (
                  <p className="mt-2 text-sm text-slate-500">Jersey #{player.jerseyNumber}</p>
                ) : null}
              </article>
            ))
          )}
        </section>

        <PlayerManagementClient teams={teams} />
      </div>
    </main>
  );
}
