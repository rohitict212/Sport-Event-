"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Team = { id: string; name: string };
type Player = { id: string; name: string; teamId: string };
type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: "upcoming" | "live" | "completed";
  homeRuns: number;
  awayRuns: number;
  homeWickets: number;
  awayWickets: number;
};
type DemoData = {
  teams: Team[];
  players: Player[];
  matches: Match[];
  activeMatchId: string | null;
  battingTeamId: string | null;
};
type Tab = "overview" | "teams" | "players" | "schedule" | "scoring" | "standings";
type Standing = {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
};

const STORAGE_KEY = "sportevent-interactive-demo-v1";

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function createSampleData(): DemoData {
  const teams = [
    { id: "team-river", name: "River Strikers" },
    { id: "team-hill", name: "Hillview XI" },
    { id: "team-lakeside", name: "Lakeside Lions" },
    { id: "team-city", name: "City Challengers" },
  ];
  return {
    teams,
    players: [
      { id: "player-1", name: "Aarav Patel", teamId: "team-river" },
      { id: "player-2", name: "Kabir Shah", teamId: "team-river" },
      { id: "player-3", name: "Ishaan Mehta", teamId: "team-hill" },
      { id: "player-4", name: "Reyansh Rao", teamId: "team-hill" },
      { id: "player-5", name: "Vihaan Nair", teamId: "team-lakeside" },
      { id: "player-6", name: "Arjun Das", teamId: "team-lakeside" },
      { id: "player-7", name: "Aditya Sen", teamId: "team-city" },
      { id: "player-8", name: "Dev Malhotra", teamId: "team-city" },
    ],
    matches: [
      {
        id: "match-1",
        homeTeamId: "team-river",
        awayTeamId: "team-hill",
        date: "2026-10-15",
        status: "completed",
        homeRuns: 148,
        awayRuns: 132,
        homeWickets: 6,
        awayWickets: 10,
      },
      {
        id: "match-2",
        homeTeamId: "team-lakeside",
        awayTeamId: "team-city",
        date: "2026-10-16",
        status: "completed",
        homeRuns: 121,
        awayRuns: 121,
        homeWickets: 8,
        awayWickets: 7,
      },
      {
        id: "match-3",
        homeTeamId: "team-hill",
        awayTeamId: "team-lakeside",
        date: "2026-10-18",
        status: "upcoming",
        homeRuns: 0,
        awayRuns: 0,
        homeWickets: 0,
        awayWickets: 0,
      },
    ],
    activeMatchId: null,
    battingTeamId: null,
  };
}

function isDemoData(value: unknown): value is DemoData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    Array.isArray(data.teams) &&
    Array.isArray(data.players) &&
    Array.isArray(data.matches) &&
    (data.activeMatchId === null || typeof data.activeMatchId === "string") &&
    (data.battingTeamId === null || typeof data.battingTeamId === "string") &&
    data.teams.every((team) => typeof team?.id === "string" && typeof team?.name === "string") &&
    data.players.every(
      (player) =>
        typeof player?.id === "string" &&
        typeof player?.name === "string" &&
        typeof player?.teamId === "string",
    ) &&
    data.matches.every(
      (match) =>
        typeof match?.id === "string" &&
        typeof match?.homeTeamId === "string" &&
        typeof match?.awayTeamId === "string" &&
        typeof match?.date === "string" &&
        ["upcoming", "live", "completed"].includes(match?.status) &&
        typeof match?.homeRuns === "number" &&
        typeof match?.awayRuns === "number" &&
        typeof match?.homeWickets === "number" &&
        typeof match?.awayWickets === "number",
    )
  );
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    month - 1
  ];
  return `${monthName} ${day}, ${year}`;
}

export default function DemoWorkspace() {
  const [data, setData] = useState<DemoData>(createSampleData);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [matchDate, setMatchDate] = useState(localDate(2));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isDemoData(parsed)) setData(parsed);
        else setStorageError("Saved demo data was invalid. You can reset to the sample tournament.");
      }
    } catch {
      setStorageError("Browser storage is unavailable. Changes may not stay after you close this page.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      setStorageError("Browser storage is unavailable. Changes may not stay after you close this page.");
    }
  }, [data, ready]);

  const teamNameById = useMemo(
    () => new Map(data.teams.map((team) => [team.id, team.name])),
    [data.teams],
  );
  const standings = useMemo(() => {
    const rows = new Map<string, Standing>(
      data.teams.map((team) => [
        team.id,
        { team, played: 0, wins: 0, losses: 0, ties: 0, points: 0 },
      ]),
    );
    data.matches
      .filter((match) => match.status === "completed")
      .forEach((match) => {
        const home = rows.get(match.homeTeamId);
        const away = rows.get(match.awayTeamId);
        if (!home || !away) return;
        home.played += 1;
        away.played += 1;
        if (match.homeRuns > match.awayRuns) {
          home.wins += 1;
          home.points += 2;
          away.losses += 1;
        } else if (match.awayRuns > match.homeRuns) {
          away.wins += 1;
          away.points += 2;
          home.losses += 1;
        } else {
          home.ties += 1;
          away.ties += 1;
          home.points += 1;
          away.points += 1;
        }
      });
    return Array.from(rows.values()).sort(
      (a, b) => b.points - a.points || b.wins - a.wins || a.team.name.localeCompare(b.team.name),
    );
  }, [data.matches, data.teams]);

  const activeMatch = data.matches.find((match) => match.id === data.activeMatchId) ?? null;
  const upcomingMatches = data.matches.filter((match) => match.status === "upcoming");

  function updateMatch(matchId: string, update: (match: Match) => Match) {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) => (match.id === matchId ? update(match) : match)),
    }));
  }

  function addTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = teamName.trim();
    if (!name || data.teams.some((team) => team.name.toLowerCase() === name.toLowerCase())) {
      setNotice("Enter a team name that is not already in this demo.");
      return;
    }
    setData((current) => ({ ...current, teams: [...current.teams, { id: makeId(), name }] }));
    setTeamName("");
    setNotice(`${name} added to this sample tournament.`);
  }

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = playerName.trim();
    if (!name || !playerTeamId) {
      setNotice("Enter a player name and choose a team.");
      return;
    }
    setData((current) => ({
      ...current,
      players: [...current.players, { id: makeId(), name, teamId: playerTeamId }],
    }));
    setPlayerName("");
    setNotice(`${name} added to the sample squad.`);
  }

  function addMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      setNotice("Choose two different teams for the match.");
      return;
    }
    const match: Match = {
      id: makeId(),
      homeTeamId,
      awayTeamId,
      date: matchDate,
      status: "upcoming",
      homeRuns: 0,
      awayRuns: 0,
      homeWickets: 0,
      awayWickets: 0,
    };
    setData((current) => ({ ...current, matches: [...current.matches, match] }));
    setNotice("Match added to the sample schedule.");
  }

  function startMatch(matchId: string) {
    const match = data.matches.find((entry) => entry.id === matchId);
    if (!match) return;
    setData((current) => ({
      ...current,
      activeMatchId: matchId,
      battingTeamId: match.homeTeamId,
      matches: current.matches.map((entry) =>
        entry.id === matchId ? { ...entry, status: "live" } : entry,
      ),
    }));
    setActiveTab("scoring");
    setNotice("Live scoring started in this browser demo.");
  }

  function addScore(runs: number, wicket = false) {
    if (!activeMatch || !data.battingTeamId) return;
    const homeBatting = data.battingTeamId === activeMatch.homeTeamId;
    updateMatch(activeMatch.id, (match) => ({
      ...match,
      homeRuns: match.homeRuns + (homeBatting ? runs : 0),
      awayRuns: match.awayRuns + (homeBatting ? 0 : runs),
      homeWickets: match.homeWickets + (homeBatting && wicket && match.homeWickets < 10 ? 1 : 0),
      awayWickets: match.awayWickets + (!homeBatting && wicket && match.awayWickets < 10 ? 1 : 0),
    }));
  }

  function finishInnings() {
    if (!activeMatch) return;
    const nextBattingTeamId =
      data.battingTeamId === activeMatch.homeTeamId ? activeMatch.awayTeamId : activeMatch.homeTeamId;
    setData((current) => ({ ...current, battingTeamId: nextBattingTeamId }));
    setNotice(`${teamNameById.get(nextBattingTeamId) ?? "Next team"} is now batting.`);
  }

  function finishMatch() {
    if (!activeMatch) return;
    updateMatch(activeMatch.id, (match) => ({ ...match, status: "completed" }));
    setData((current) => ({ ...current, activeMatchId: null, battingTeamId: null }));
    setNotice("Match completed. The sample standings have been updated.");
    setActiveTab("standings");
  }

  function resetDemo() {
    setData(createSampleData());
    setNotice("Sample tournament restored. Your local demo changes were cleared.");
    setActiveTab("overview");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "teams", label: "Teams" },
    { id: "players", label: "Players" },
    { id: "schedule", label: "Schedule" },
    { id: "scoring", label: "Live scoring" },
    { id: "standings", label: "Standings" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Demo workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Riverside Cricket Cup
          </h1>
          <p className="mt-2 text-slate-600">Explore teams, squads, fixtures, scoring, and standings.</p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Reset sample
        </button>
      </div>

      <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        This is a practice demo using fictional data. Changes are saved only in this browser and are not sent to a server.
        Do not enter real personal information.
      </aside>
      {storageError ? (
        <p role="status" className="mt-3 rounded-xl bg-slate-200 px-4 py-3 text-sm text-slate-700">
          {storageError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}

      <nav aria-label="Demo sections" className="mt-7 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === tab.id
                ? "bg-emerald-700 text-white"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <section className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Teams", data.teams.length],
              ["Players", data.players.length],
              ["Matches played", data.matches.filter((match) => match.status === "completed").length],
              ["Upcoming", upcomingMatches.length],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
              </article>
            ))}
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Next fixture</h2>
                <p className="mt-1 text-sm text-slate-500">Try starting a match and recording a few runs.</p>
              </div>
              {upcomingMatches[0] ? (
                <button
                  type="button"
                  onClick={() => startMatch(upcomingMatches[0].id)}
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Start live scoring
                </button>
              ) : null}
            </div>
            {upcomingMatches[0] ? (
              <p className="mt-5 text-lg font-semibold text-slate-800">
                {teamNameById.get(upcomingMatches[0].homeTeamId)} <span className="text-slate-400">vs</span>{" "}
                {teamNameById.get(upcomingMatches[0].awayTeamId)}
                <span className="ml-3 text-sm font-normal text-slate-500">{formatDate(upcomingMatches[0].date)}</span>
              </p>
            ) : (
              <p className="mt-5 text-sm text-slate-600">No upcoming fixtures. Add one in Schedule.</p>
            )}
          </section>
        </section>
      ) : null}

      {activeTab === "teams" ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.teams.map((team) => (
              <article key={team.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Riverside Cricket Cup</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">{team.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {data.players.filter((player) => player.teamId === team.id).length} players
                </p>
              </article>
            ))}
          </div>
          <form onSubmit={addTeam} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Add a team</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Team name
              <input
                required
                minLength={2}
                maxLength={60}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>
            <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              Add team
            </button>
          </form>
        </section>
      ) : null}

      {activeTab === "players" ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_1fr] gap-3 border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Player</span><span>Team</span>
            </div>
            {data.players.map((player) => (
              <div key={player.id} className="grid grid-cols-[1fr_1fr] gap-3 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
                <span className="font-medium text-slate-800">{player.name}</span>
                <span className="text-slate-600">{teamNameById.get(player.teamId) ?? "Unknown team"}</span>
              </div>
            ))}
          </div>
          <form onSubmit={addPlayer} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Add a player</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Player name
              <input
                required
                minLength={2}
                maxLength={80}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Team
              <select
                required
                value={playerTeamId}
                onChange={(event) => setPlayerTeamId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                <option value="">Choose a team</option>
                {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              Add player
            </button>
          </form>
        </section>
      ) : null}

      {activeTab === "schedule" ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            {data.matches.length === 0 ? <p className="rounded-2xl bg-white p-5 text-slate-600">No fixtures yet.</p> : null}
            {data.matches.map((match) => (
              <article key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm text-slate-500">{formatDate(match.date)} · {match.status}</p>
                  <h2 className="mt-1 font-bold text-slate-900">
                    {teamNameById.get(match.homeTeamId)} vs {teamNameById.get(match.awayTeamId)}
                  </h2>
                  {match.status !== "upcoming" ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {match.homeRuns}/{match.homeWickets} · {match.awayRuns}/{match.awayWickets}
                    </p>
                  ) : null}
                </div>
                {match.status === "upcoming" ? (
                  <button
                    type="button"
                    onClick={() => startMatch(match.id)}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    Start match
                  </button>
                ) : null}
                {match.status === "live" ? (
                  <button type="button" onClick={() => setActiveTab("scoring")} className="font-semibold text-emerald-700">
                    Continue scoring →
                  </button>
                ) : null}
              </article>
            ))}
          </div>
          <form onSubmit={addMatch} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Schedule a match</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Home team
              <select required value={homeTeamId} onChange={(event) => setHomeTeamId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <option value="">Choose a team</option>
                {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Away team
              <select required value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <option value="">Choose a team</option>
                {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Date
              <input required type="date" value={matchDate} onChange={(event) => setMatchDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
            <button disabled={data.teams.length < 2} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
              Add fixture
            </button>
          </form>
        </section>
      ) : null}

      {activeTab === "scoring" ? (
        <section className="mt-6">
          {activeMatch ? (
            <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-rose-700">Live demo match</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {teamNameById.get(activeMatch.homeTeamId)} vs {teamNameById.get(activeMatch.awayTeamId)}
                  </h2>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase text-rose-800">Live</span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[activeMatch.homeTeamId, activeMatch.awayTeamId].map((teamId) => {
                  const home = teamId === activeMatch.homeTeamId;
                  const batting = teamId === data.battingTeamId;
                  return (
                    <button
                      key={teamId}
                      type="button"
                      onClick={() => setData((current) => ({ ...current, battingTeamId: teamId }))}
                      aria-pressed={batting}
                      className={`rounded-2xl border p-5 text-left ${batting ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}
                    >
                      <span className="text-sm font-semibold text-slate-600">{teamNameById.get(teamId)}{batting ? " · batting" : ""}</span>
                      <span className="mt-2 block text-4xl font-bold text-slate-900">
                        {home ? activeMatch.homeRuns : activeMatch.awayRuns}
                        <span className="text-xl text-slate-500">/{home ? activeMatch.homeWickets : activeMatch.awayWickets}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-sm font-semibold text-slate-700">Record a delivery for {teamNameById.get(data.battingTeamId ?? "") ?? "the selected team"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 6].map((runs) => (
                  <button key={runs} type="button" onClick={() => addScore(runs)} className="min-w-12 rounded-lg border border-slate-300 px-4 py-2.5 font-bold text-slate-800 hover:bg-slate-100">
                    {runs === 0 ? "Dot" : runs}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={(data.battingTeamId === activeMatch.homeTeamId ? activeMatch.homeWickets : activeMatch.awayWickets) >= 10}
                  onClick={() => addScore(0, true)}
                  className="rounded-lg border border-rose-300 px-4 py-2.5 font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Wicket
                </button>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={finishInnings} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Switch batting team
                </button>
                <button type="button" onClick={finishMatch} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
                  Complete match
                </button>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="text-xl font-bold text-slate-900">No match being scored</h2>
              <p className="mt-2 text-slate-600">Start a scheduled match from the Schedule tab to try live scoring.</p>
              <button type="button" onClick={() => setActiveTab("schedule")} className="mt-4 font-semibold text-emerald-700">
                Go to schedule →
              </button>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "standings" ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-bold text-slate-900">Tournament standings</h2>
            <p className="mt-1 text-sm text-slate-500">2 points for a win, 1 point each for a tie.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Team</th><th className="px-5 py-3">P</th><th className="px-5 py-3">W</th><th className="px-5 py-3">L</th><th className="px-5 py-3">T</th><th className="px-5 py-3">Pts</th></tr>
              </thead>
              <tbody>
                {standings.map((row, index) => (
                  <tr key={row.team.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                    <th scope="row" className="px-5 py-3 font-semibold text-slate-900">{row.team.name}</th>
                    <td className="px-5 py-3">{row.played}</td><td className="px-5 py-3">{row.wins}</td><td className="px-5 py-3">{row.losses}</td><td className="px-5 py-3">{row.ties}</td><td className="px-5 py-3 font-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="mt-8 text-center text-xs leading-5 text-slate-500">
        Demo only. No account, server, real data, SMS, or tournament results are used.{" "}
        <button type="button" onClick={resetDemo} className="font-semibold text-emerald-700 hover:underline">
          Reset sample data
        </button>
      </p>
    </div>
  );
}
