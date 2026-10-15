"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MatchSummary = {
  id: string;
  status: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  tournament: { name: string };
  innings: {
    id: string;
    inningsNumber: number;
    battingTeam: { name: string };
    bowlingTeam: { name: string };
    runs: number;
    wickets: number;
    overs: number | null;
    targetRuns: number | null;
    scoreEvents: {
      overNumber: number;
      ballNumber: number;
      runs: number;
      extras: number;
      wicketType: string | null;
    }[];
  }[];
};

export default function ScoringClient({ matches }: { matches: MatchSummary[] }) {
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");
  const [selectedInningsId, setSelectedInningsId] = useState("");
  const [battingTeamId, setBattingTeamId] = useState("");
  const [bowlingTeamId, setBowlingTeamId] = useState("");
  const [inningsNumber, setInningsNumber] = useState(1);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [targetRuns, setTargetRuns] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [overNumber, setOverNumber] = useState(1);
  const [ballNumber, setBallNumber] = useState(1);
  const [eventRuns, setEventRuns] = useState(0);
  const [extras, setExtras] = useState(0);
  const [wicketType, setWicketType] = useState("");
  const [isNoBall, setIsNoBall] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [isLegBye, setIsLegBye] = useState(false);
  const [isBye, setIsBye] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  const teamOptions = selectedMatch
    ? [selectedMatch.teamA, selectedMatch.teamB]
    : [];

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    const inningsOptions = selectedMatch.innings ?? [];
    if (inningsOptions.length === 0) {
      setSelectedInningsId("");
      return;
    }

    if (!inningsOptions.some((inning) => inning.id === selectedInningsId)) {
      setSelectedInningsId(inningsOptions[0].id);
    }
  }, [selectedInningsId, selectedMatch]);

  async function submitInnning(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/innings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          battingTeamId,
          bowlingTeamId,
          inningsNumber,
          runs,
          wickets,
          overs,
          targetRuns: targetRuns ? Number(targetRuns) : undefined,
          isComplete,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to save innings.");
        return;
      }

      setBattingTeamId("");
      setBowlingTeamId("");
      setRuns(0);
      setWickets(0);
      setOvers(0);
      setTargetRuns("");
      setIsComplete(false);
      setInningsNumber(1);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/score-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inningsId: selectedInningsId,
          overNumber,
          ballNumber,
          runs: eventRuns,
          extras,
          wicketType: wicketType || undefined,
          isNoBall,
          isWide,
          isLegBye,
          isBye,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to record the delivery.");
        return;
      }

      setEventRuns(0);
      setExtras(0);
      setWicketType("");
      setIsNoBall(false);
      setIsWide(false);
      setIsLegBye(false);
      setIsBye(false);
      setBallNumber((ballNumber % 6) + 1);
      if (ballNumber === 6) {
        setOverNumber((prev) => prev + 1);
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (matches.length === 0) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Create innings</h2>
        <p className="mt-3 text-sm text-slate-600">Schedule a match before recording scoring.</p>
      </aside>
    );
  }

  const inningsOptions = selectedMatch?.innings ?? [];

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create innings</h2>
          <form className="mt-5 space-y-4" onSubmit={submitInnning}>
            <label className="block text-sm font-medium text-slate-700">
              Match
              <select
                value={selectedMatchId}
                onChange={(event) => {
                  setSelectedMatchId(event.target.value);
                  setBattingTeamId("");
                  setBowlingTeamId("");
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.teamA.name} vs {match.teamB.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Batting team
                <select
                  value={battingTeamId}
                  onChange={(event) => setBattingTeamId(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="">Select</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Bowling team
                <select
                  value={bowlingTeamId}
                  onChange={(event) => setBowlingTeamId(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="">Select</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Innings number
              <input
                type="number"
                min={1}
                max={4}
                value={inningsNumber}
                onChange={(event) => setInningsNumber(Number(event.target.value) || 1)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Runs
                <input
                  type="number"
                  min={0}
                  value={runs}
                  onChange={(event) => setRuns(Number(event.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Wickets
                <input
                  type="number"
                  min={0}
                  value={wickets}
                  onChange={(event) => setWickets(Number(event.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Overs
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={overs}
                  onChange={(event) => setOvers(Number(event.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Target runs
                <input
                  type="number"
                  min={0}
                  value={targetRuns}
                  onChange={(event) => setTargetRuns(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isComplete}
                onChange={(event) => setIsComplete(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Inning complete
            </label>

            <button
              type="submit"
              disabled={busy || !selectedMatchId || !battingTeamId || !bowlingTeamId}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving..." : "Record innings"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">Record delivery</h2>
          <form className="mt-5 space-y-4" onSubmit={submitEvent}>
            <label className="block text-sm font-medium text-slate-700">
              Innings
              <select
                value={selectedInningsId}
                onChange={(event) => setSelectedInningsId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                {inningsOptions.length === 0 ? (
                  <option value="">No innings yet</option>
                ) : (
                  inningsOptions.map((inning) => (
                    <option key={inning.id} value={inning.id}>
                      Innings {inning.inningsNumber}: {inning.battingTeam.name} vs {inning.bowlingTeam.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Over
                <input
                  type="number"
                  min={1}
                  value={overNumber}
                  onChange={(event) => setOverNumber(Number(event.target.value) || 1)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Ball
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={ballNumber}
                  onChange={(event) => setBallNumber(Number(event.target.value) || 1)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Runs
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={eventRuns}
                  onChange={(event) => setEventRuns(Number(event.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Extras
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={extras}
                  onChange={(event) => setExtras(Number(event.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Wicket type (optional)
              <input
                value={wicketType}
                onChange={(event) => setWicketType(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-emerald-100"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isNoBall} onChange={(event) => setIsNoBall(event.target.checked)} />
                No ball
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isWide} onChange={(event) => setIsWide(event.target.checked)} />
                Wide
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isLegBye} onChange={(event) => setIsLegBye(event.target.checked)} />
                Leg bye
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isBye} onChange={(event) => setIsBye(event.target.checked)} />
                Bye
              </label>
            </div>

            {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={busy || !selectedInningsId}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving..." : "Record delivery"}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
