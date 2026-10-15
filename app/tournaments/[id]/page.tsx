import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { calculateTournamentStandings } from "@/lib/tournament-standings";

export default async function TournamentPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      organization: { select: { name: true } },
      teams: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
      matches: {
        orderBy: { scheduledAt: "asc" },
        include: {
          teamA: { select: { id: true, name: true } },
          teamB: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } },
          innings: {
            select: {
              battingTeamId: true,
              bowlingTeamId: true,
              runs: true,
              wickets: true,
              overs: true,
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const standings = calculateTournamentStandings(
    tournament.teams,
    tournament.matches.map((match) => ({
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      winnerTeamId: match.winnerTeamId,
      innings: match.innings.map((inning) => ({
        battingTeamId: inning.battingTeamId,
        bowlingTeamId: inning.bowlingTeamId,
        runs: inning.runs,
      })),
    })),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Tournament</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{tournament.name}</h1>
          <p className="mt-2 text-slate-600">{tournament.organization.name}</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          ← Back home
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Standings</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Team</th>
                  <th className="px-3 py-2 font-semibold">P</th>
                  <th className="px-3 py-2 font-semibold">W</th>
                  <th className="px-3 py-2 font-semibold">L</th>
                  <th className="px-3 py-2 font-semibold">Pts</th>
                  <th className="px-3 py-2 font-semibold">NRR</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{team.name}</td>
                    <td className="px-3 py-2">{team.played}</td>
                    <td className="px-3 py-2">{team.wins}</td>
                    <td className="px-3 py-2">{team.losses}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">{team.points}</td>
                    <td className="px-3 py-2">{team.netRunRate > 0 ? `+${team.netRunRate}` : team.netRunRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Results</h2>
          <div className="mt-4 space-y-3">
            {tournament.matches.length === 0 ? (
              <p className="text-sm text-slate-500">No fixtures have been created yet.</p>
            ) : (
              tournament.matches.map((match) => (
                <div key={match.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    {new Date(match.scheduledAt).toLocaleDateString()} · {match.status}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {match.teamA.name} vs {match.teamB.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {match.resultText ?? (match.winner ? `${match.winner.name} won` : "Result pending")}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
