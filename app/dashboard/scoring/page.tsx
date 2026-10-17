import ScoringClient from "@/app/dashboard/scoring/scoring-client";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function ScoringPage() {
  const user = await requireCurrentUser();
  const organizations = await getOrganizerOrganizations(user.id);
  const organizationIds = organizations.map(({ id }) => id);

  const matches = await prisma.match.findMany({
    where: { organizationId: { in: organizationIds } },
    include: {
      tournament: { select: { name: true } },
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      innings: {
        include: {
          battingTeam: { select: { name: true } },
          bowlingTeam: { select: { name: true } },
          scoreEvents: {
            orderBy: [{ overNumber: "asc" }, { ballNumber: "asc" }],
          },
        },
        orderBy: { inningsNumber: "asc" },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Scoring</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Live score board</h1>
          <p className="mt-2 text-slate-600">Track innings totals for scheduled matches.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No matches are scheduled for scoring yet.
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
                </p>
                {match.resultText ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">{match.resultText}</p>
                ) : null}

                {match.innings.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No innings recorded yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {match.innings.map((inning) => (
                      <div key={inning.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-800">
                          Innings {inning.inningsNumber}: {inning.battingTeam.name} vs {inning.bowlingTeam.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {inning.runs}/{inning.wickets} in {inning.overs ?? 0} overs
                        </p>
                        {inning.scoreEvents.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {inning.scoreEvents.map((event) => (
                              <span key={`${inning.id}-${event.overNumber}-${event.ballNumber}`} className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                                {event.overNumber}.{event.ballNumber}: {event.runs + event.extras}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {inning.targetRuns ? (
                          <p className="mt-1 text-xs text-slate-500">Target: {inning.targetRuns}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </section>

        <ScoringClient matches={matches} />
      </div>
    </main>
  );
}
