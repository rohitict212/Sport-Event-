"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Tournament = {
  id: string;
  name: string;
  organizationId: string;
  organization: { name: string };
  teams: { id: string; name: string }[];
};

export default function MatchManagementClient({ tournaments }: { tournaments: Tournament[] }) {
  const router = useRouter();
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id ?? "");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venueName, setVenueName] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedTournamentTeams = tournaments.find((tournament) => tournament.id === selectedTournamentId)?.teams ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          teamAId,
          teamBId,
          scheduledAt,
          venueName,
          status,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create match.");
        return;
      }

      setTeamAId("");
      setTeamBId("");
      setScheduledAt("");
      setVenueName("");
      setStatus("scheduled");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (tournaments.length === 0) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Schedule match</h2>
        <p className="mt-3 text-sm text-slate-600">Create a tournament before scheduling fixtures.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Schedule match</h2>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-700">
          Tournament
          <select
            value={selectedTournamentId}
            onChange={(event) => {
              setSelectedTournamentId(event.target.value);
              setTeamAId("");
              setTeamBId("");
            }}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name} · {tournament.organization.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Team A
            <select
              value={teamAId}
              onChange={(event) => setTeamAId(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            >
              <option value="">Select a team</option>
              {selectedTournamentTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Team B
            <select
              value={teamBId}
              onChange={(event) => setTeamBId(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
            >
              <option value="">Select a team</option>
              {selectedTournamentTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Match time
          <input
            required
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Venue (optional)
          <input
            maxLength={100}
            value={venueName}
            onChange={(event) => setVenueName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !selectedTournamentId || !teamAId || !teamBId || !scheduledAt}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving..." : "Create match"}
        </button>
      </form>
    </aside>
  );
}
