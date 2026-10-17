"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Team = { id: string; name: string };
type Player = {
  id: string;
  name: string;
  teamId: string;
  runs: number;
  ballsFaced: number;
  dismissals: number;
  fours: number;
  sixes: number;
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
};
type Tournament = { id: string; name: string; description: string; venue: string; overs: number };
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
  homeBalls: number;
  awayBalls: number;
};
type TournamentWorkspace = {
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  matches: Match[];
  activeMatchId: string | null;
  battingTeamId: string | null;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
};
type DemoData = TournamentWorkspace & { otherTournaments: TournamentWorkspace[] };
type Tab = "overview" | "teams" | "players" | "schedule" | "scoring" | "statistics" | "standings";
type Standing = {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
};

const STORAGE_KEY = "sportevent-interactive-demo-v1";
const DEFAULT_MATCH_DATE = "2026-10-19";
const emptyPlayerStats = {
  runs: 0,
  ballsFaced: 0,
  dismissals: 0,
  fours: 0,
  sixes: 0,
  wickets: 0,
  runsConceded: 0,
  ballsBowled: 0,
};

function createSampleData(): DemoData {
  const teams = [
    { id: "team-river", name: "River Strikers" },
    { id: "team-hill", name: "Hillview XI" },
    { id: "team-lakeside", name: "Lakeside Lions" },
    { id: "team-city", name: "City Challengers" },
  ];
  return {
    tournament: {
      id: "tournament-riverside",
      name: "Riverside Cricket Cup",
      description: "A fast-paced local T20 series under the lights.",
      venue: "Riverside Oval",
      overs: 20,
    },
    teams,
    players: [
      { id: "player-1", name: "Aarav Patel", teamId: "team-river", ...emptyPlayerStats, runs: 76, ballsFaced: 51, dismissals: 1, fours: 8, sixes: 3, wickets: 0, runsConceded: 16, ballsBowled: 12 },
      { id: "player-2", name: "Kabir Shah", teamId: "team-river", ...emptyPlayerStats, runs: 42, ballsFaced: 29, dismissals: 1, fours: 4, sixes: 1, wickets: 2, runsConceded: 24, ballsBowled: 18 },
      { id: "player-3", name: "Ishaan Mehta", teamId: "team-hill", ...emptyPlayerStats, runs: 58, ballsFaced: 44, dismissals: 1, fours: 5, sixes: 2, wickets: 1, runsConceded: 22, ballsBowled: 18 },
      { id: "player-4", name: "Reyansh Rao", teamId: "team-hill", ...emptyPlayerStats, runs: 37, ballsFaced: 31, dismissals: 2, fours: 3, sixes: 1, wickets: 3, runsConceded: 27, ballsBowled: 24 },
      { id: "player-5", name: "Vihaan Nair", teamId: "team-lakeside", ...emptyPlayerStats, runs: 69, ballsFaced: 48, dismissals: 1, fours: 7, sixes: 2, wickets: 2, runsConceded: 21, ballsBowled: 18 },
      { id: "player-6", name: "Arjun Das", teamId: "team-lakeside", ...emptyPlayerStats, runs: 31, ballsFaced: 24, dismissals: 2, fours: 2, sixes: 1, wickets: 1, runsConceded: 19, ballsBowled: 12 },
      { id: "player-7", name: "Aditya Sen", teamId: "team-city", ...emptyPlayerStats, runs: 62, ballsFaced: 45, dismissals: 1, fours: 6, sixes: 2, wickets: 1, runsConceded: 25, ballsBowled: 18 },
      { id: "player-8", name: "Dev Malhotra", teamId: "team-city", ...emptyPlayerStats, runs: 28, ballsFaced: 22, dismissals: 2, fours: 3, sixes: 0, wickets: 2, runsConceded: 20, ballsBowled: 18 },
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
        homeBalls: 120,
        awayBalls: 120,
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
        homeBalls: 120,
        awayBalls: 120,
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
        homeBalls: 0,
        awayBalls: 0,
      },
    ],
    activeMatchId: null,
    battingTeamId: null,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
    otherTournaments: [],
  };
}

function parseWorkspace(value: unknown, fallback: TournamentWorkspace): TournamentWorkspace | null {
  if (typeof value !== "object" || value === null) return null;
  const data = value as Record<string, unknown>;
  const isValid =
    Array.isArray(data.teams) &&
    Array.isArray(data.players) &&
    Array.isArray(data.matches) &&
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
    );
  if (!isValid) return null;
  const sample = createSampleData();
  const tournament = data.tournament && typeof data.tournament === "object"
    ? data.tournament as Partial<Tournament>
    : {};
  const players = data.players as Partial<Player>[];
  const matches = data.matches as Partial<Match>[];
  return {
    tournament: {
      id: typeof tournament.id === "string" ? tournament.id : fallback.tournament.id,
      name: typeof tournament.name === "string" ? tournament.name : sample.tournament.name,
      description: typeof tournament.description === "string" ? tournament.description : sample.tournament.description,
      venue: typeof tournament.venue === "string" ? tournament.venue : sample.tournament.venue,
      overs: typeof tournament.overs === "number" ? tournament.overs : sample.tournament.overs,
    },
    teams: data.teams as Team[],
    players: players.map((player, index) => {
      const samplePlayer = sample.players[index % sample.players.length];
      return {
        ...samplePlayer,
        ...player,
        ...Object.fromEntries(
          Object.keys(emptyPlayerStats).map((key) => [
            key,
            typeof player[key as keyof Player] === "number"
              ? player[key as keyof Player]
              : samplePlayer[key as keyof Player],
          ]),
        ),
      } as Player;
    }),
    matches: matches.map((match) => ({
      ...match,
      homeBalls: typeof match.homeBalls === "number" ? match.homeBalls : match.status === "completed" ? 120 : 0,
      awayBalls: typeof match.awayBalls === "number" ? match.awayBalls : match.status === "completed" ? 120 : 0,
    } as Match)),
    activeMatchId: typeof data.activeMatchId === "string" ? data.activeMatchId : null,
    battingTeamId: typeof data.battingTeamId === "string" ? data.battingTeamId : null,
    strikerId: typeof data.strikerId === "string" ? data.strikerId : null,
    nonStrikerId: typeof data.nonStrikerId === "string" ? data.nonStrikerId : null,
    bowlerId: typeof data.bowlerId === "string" ? data.bowlerId : null,
  };
}

function parseDemoData(value: unknown): DemoData | null {
  const sample = createSampleData();
  const current = parseWorkspace(value, sample);
  if (!current) return null;
  const rawOthers = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>).otherTournaments
    : null;
  const otherTournaments = Array.isArray(rawOthers)
    ? rawOthers.flatMap((tournament) => {
      const parsed = parseWorkspace(tournament, sample);
      return parsed ? [parsed] : [];
    })
    : [];
  return { ...current, otherTournaments };
}

function snapshotTournament(data: DemoData): TournamentWorkspace {
  return {
    tournament: data.tournament,
    teams: data.teams,
    players: data.players,
    matches: data.matches,
    activeMatchId: data.activeMatchId,
    battingTeamId: data.battingTeamId,
    strikerId: data.strikerId,
    nonStrikerId: data.nonStrikerId,
    bowlerId: data.bowlerId,
  };
}

function emptyTournamentWorkspace(tournament: Tournament): TournamentWorkspace {
  return {
    tournament,
    teams: [],
    players: [],
    matches: [],
    activeMatchId: null,
    battingTeamId: null,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
  };
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

function formatOvers(balls: number) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function runRate(runs: number, balls: number) {
  return balls === 0 ? "0.00" : (runs / (balls / 6)).toFixed(2);
}

export default function DemoWorkspace() {
  const [data, setData] = useState<DemoData>(createSampleData);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [editingTournament, setEditingTournament] = useState(false);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState<Tournament>(createSampleData().tournament);
  const [teamName, setTeamName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState("");
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");
  const [editingPlayerTeamId, setEditingPlayerTeamId] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [matchDate, setMatchDate] = useState(DEFAULT_MATCH_DATE);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingHomeTeamId, setEditingHomeTeamId] = useState("");
  const [editingAwayTeamId, setEditingAwayTeamId] = useState("");
  const [editingMatchDate, setEditingMatchDate] = useState("");
  const [editingHomeRuns, setEditingHomeRuns] = useState("");
  const [editingAwayRuns, setEditingAwayRuns] = useState("");
  const [editingHomeWickets, setEditingHomeWickets] = useState("");
  const [editingAwayWickets, setEditingAwayWickets] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const restored = parseDemoData(parsed);
        if (restored) {
          setData(restored);
          setTournamentForm(restored.tournament);
        }
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
  const currentBatters = data.players.filter((player) => player.teamId === data.battingTeamId);
  const currentBowlers = data.players.filter((player) =>
    player.teamId === (activeMatch && data.battingTeamId === activeMatch.homeTeamId
      ? activeMatch.awayTeamId
      : activeMatch?.homeTeamId),
  );
  const topBatters = [...data.players].sort((a, b) => b.runs - a.runs);
  const topBowlers = [...data.players].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);
  const completedMatches = data.matches.filter((match) => match.status === "completed");
  const tournamentRunRate = completedMatches.length
    ? completedMatches.reduce((total, match) =>
      total + match.homeRuns + match.awayRuns, 0) /
      Math.max(1, completedMatches.reduce((total, match) => total + match.homeBalls + match.awayBalls, 0) / 6)
    : 0;

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

  function saveTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = tournamentForm.name.trim();
    const venue = tournamentForm.venue.trim();
    if (!name || !venue || tournamentForm.overs < 1 || tournamentForm.overs > 50) {
      setNotice("Enter a tournament name, venue, and an over limit from 1 to 50.");
      return;
    }
    const tournament = { ...tournamentForm, name, venue, description: tournamentForm.description.trim() };
    if (isCreatingTournament) {
      setData((current) => ({
        ...emptyTournamentWorkspace(tournament),
        otherTournaments: [...current.otherTournaments, snapshotTournament(current)],
      }));
      setNotice(`${name} created with a fresh sample workspace.`);
    } else {
      setData((current) => ({ ...current, tournament }));
      setNotice("Tournament details updated in this browser demo.");
    }
    setTournamentForm(tournament);
    setEditingTournament(false);
    setIsCreatingTournament(false);
  }

  function beginNewTournament() {
    setTournamentForm({
      id: makeId(),
      name: "",
      description: "",
      venue: "",
      overs: 20,
    });
    setIsCreatingTournament(true);
    setEditingTournament(true);
  }

  function switchTournament(tournamentId: string) {
    if (tournamentId === data.tournament.id) return;
    const selected = data.otherTournaments.find(({ tournament }) => tournament.id === tournamentId);
    if (!selected) return;
    setData((current) => ({
      ...selected,
      otherTournaments: [
        ...current.otherTournaments.filter(({ tournament }) => tournament.id !== tournamentId),
        snapshotTournament(current),
      ],
    }));
    setEditingTournament(false);
    setIsCreatingTournament(false);
    setEditingTeamId(null);
    setEditingPlayerId(null);
    setEditingMatchId(null);
    setNotice(`Switched to ${selected.tournament.name}.`);
  }

  function saveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = editingTeamName.trim();
    if (!editingTeamId || !name || data.teams.some(
      (team) => team.id !== editingTeamId && team.name.toLowerCase() === name.toLowerCase(),
    )) {
      setNotice("Enter a team name that is not already in this demo.");
      return;
    }
    setData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === editingTeamId ? { ...team, name } : team),
    }));
    setEditingTeamId(null);
    setNotice(`Team name updated to ${name}.`);
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
      players: [...current.players, { id: makeId(), name, teamId: playerTeamId, ...emptyPlayerStats }],
    }));
    setPlayerName("");
    setNotice(`${name} added to the sample squad.`);
  }

  function savePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = editingPlayerName.trim();
    if (!editingPlayerId || !name || !data.teams.some((team) => team.id === editingPlayerTeamId)) {
      setNotice("Enter a player name and choose a team.");
      return;
    }
    setData((current) => ({
      ...current,
      players: current.players.map((player) => player.id === editingPlayerId
        ? { ...player, name, teamId: editingPlayerTeamId }
        : player),
    }));
    setEditingPlayerId(null);
    setNotice(`${name}'s sample profile was updated.`);
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
      homeBalls: 0,
      awayBalls: 0,
    };
    setData((current) => ({ ...current, matches: [...current.matches, match] }));
    setNotice("Match added to the sample schedule.");
  }

  function beginMatchEdit(match: Match) {
    setEditingMatchId(match.id);
    setEditingHomeTeamId(match.homeTeamId);
    setEditingAwayTeamId(match.awayTeamId);
    setEditingMatchDate(match.date);
    setEditingHomeRuns(String(match.homeRuns));
    setEditingAwayRuns(String(match.awayRuns));
    setEditingHomeWickets(String(match.homeWickets));
    setEditingAwayWickets(String(match.awayWickets));
  }

  function saveMatch(event: FormEvent<HTMLFormElement>, match: Match) {
    event.preventDefault();
    if (match.status === "upcoming") {
      if (
        !editingHomeTeamId ||
        !editingAwayTeamId ||
        editingHomeTeamId === editingAwayTeamId ||
        !data.teams.some((team) => team.id === editingHomeTeamId) ||
        !data.teams.some((team) => team.id === editingAwayTeamId) ||
        !editingMatchDate
      ) {
        setNotice("Choose two different teams and a match date.");
        return;
      }
      updateMatch(match.id, (current) => ({
        ...current,
        homeTeamId: editingHomeTeamId,
        awayTeamId: editingAwayTeamId,
        date: editingMatchDate,
      }));
      setNotice("Fixture updated.");
    } else {
      const homeRuns = Number(editingHomeRuns);
      const awayRuns = Number(editingAwayRuns);
      const homeWickets = Number(editingHomeWickets);
      const awayWickets = Number(editingAwayWickets);
      if (
        ![homeRuns, awayRuns, homeWickets, awayWickets].every(Number.isInteger) ||
        homeRuns < 0 ||
        awayRuns < 0 ||
        homeWickets < 0 ||
        homeWickets > 10 ||
        awayWickets < 0 ||
        awayWickets > 10
      ) {
        setNotice("Enter valid scores and wicket totals from 0 to 10.");
        return;
      }
      updateMatch(match.id, (current) => ({
        ...current,
        homeRuns,
        awayRuns,
        homeWickets,
        awayWickets,
      }));
      setNotice("Match score corrected; standings were recalculated.");
    }
    setEditingMatchId(null);
  }

  function startMatch(matchId: string) {
    const match = data.matches.find((entry) => entry.id === matchId);
    if (!match) return;
    const battingPlayers = data.players.filter((player) => player.teamId === match.homeTeamId);
    const bowlingPlayer = data.players.find((player) => player.teamId === match.awayTeamId);
    setData((current) => ({
      ...current,
      activeMatchId: matchId,
      battingTeamId: match.homeTeamId,
      strikerId: battingPlayers[0]?.id ?? null,
      nonStrikerId: battingPlayers[1]?.id ?? null,
      bowlerId: bowlingPlayer?.id ?? null,
      matches: current.matches.map((entry) =>
        entry.id === matchId ? { ...entry, status: "live" } : entry,
      ),
    }));
    setActiveTab("scoring");
    setNotice("Live scoring started in this browser demo.");
  }

  function chooseBattingTeam(teamId: string) {
    if (!activeMatch) return;
    const battingPlayers = data.players.filter((player) => player.teamId === teamId);
    const bowlingTeamId = teamId === activeMatch.homeTeamId ? activeMatch.awayTeamId : activeMatch.homeTeamId;
    const currentBowler = data.players.find((player) => player.id === data.bowlerId);
    const nextBowler = currentBowler?.teamId === bowlingTeamId
      ? currentBowler
      : data.players.find((player) => player.teamId === bowlingTeamId);
    setData((current) => ({
      ...current,
      battingTeamId: teamId,
      strikerId: battingPlayers[0]?.id ?? null,
      nonStrikerId: battingPlayers[1]?.id ?? null,
      bowlerId: nextBowler?.id ?? null,
    }));
  }

  function addScore(runs: number, wicket = false) {
    if (!activeMatch || !data.battingTeamId || !data.strikerId || !data.bowlerId) {
      setNotice("Choose a striker and bowler before recording a delivery.");
      return;
    }
    const homeBatting = data.battingTeamId === activeMatch.homeTeamId;
    const striker = data.players.find((player) => player.id === data.strikerId);
    const bowler = data.players.find((player) => player.id === data.bowlerId);
    if (!striker || !bowler) {
      setNotice("The selected sample players are no longer available. Select players again.");
      return;
    }
    const matchBallNumber = homeBatting ? activeMatch.homeBalls + 1 : activeMatch.awayBalls + 1;
    setData((current) => ({
      ...current,
      players: current.players.map((player) => {
        if (player.id === striker.id) {
          return {
            ...player,
            runs: player.runs + runs,
            ballsFaced: player.ballsFaced + 1,
            dismissals: player.dismissals + (wicket ? 1 : 0),
            fours: player.fours + (runs === 4 ? 1 : 0),
            sixes: player.sixes + (runs === 6 ? 1 : 0),
          };
        }
        if (player.id === bowler.id) {
          return {
            ...player,
            wickets: player.wickets + (wicket ? 1 : 0),
            runsConceded: player.runsConceded + runs,
            ballsBowled: player.ballsBowled + 1,
          };
        }
        return player;
      }),
      matches: current.matches.map((match) => match.id !== activeMatch.id ? match : ({
        ...match,
        homeRuns: match.homeRuns + (homeBatting ? runs : 0),
        awayRuns: match.awayRuns + (homeBatting ? 0 : runs),
        homeWickets: match.homeWickets + (homeBatting && wicket && match.homeWickets < 10 ? 1 : 0),
        awayWickets: match.awayWickets + (!homeBatting && wicket && match.awayWickets < 10 ? 1 : 0),
        homeBalls: match.homeBalls + (homeBatting ? 1 : 0),
        awayBalls: match.awayBalls + (homeBatting ? 0 : 1),
      })),
      strikerId: runs % 2 === 1 ? current.nonStrikerId : current.strikerId,
      nonStrikerId: runs % 2 === 1 ? current.strikerId : current.nonStrikerId,
    }));
    if (wicket) setNotice(`${striker.name} dismissed. Select the new batter.`);
    else if (matchBallNumber % 6 === 0) {
      setData((current) => ({ ...current, strikerId: current.nonStrikerId, nonStrikerId: current.strikerId }));
    }
  }

  function finishInnings() {
    if (!activeMatch) return;
    const nextBattingTeamId =
      data.battingTeamId === activeMatch.homeTeamId ? activeMatch.awayTeamId : activeMatch.homeTeamId;
    const battingPlayers = data.players.filter((player) => player.teamId === nextBattingTeamId);
    const nextBowler = data.players.find((player) => player.teamId === data.battingTeamId);
    setData((current) => ({
      ...current,
      battingTeamId: nextBattingTeamId,
      strikerId: battingPlayers[0]?.id ?? null,
      nonStrikerId: battingPlayers[1]?.id ?? null,
      bowlerId: nextBowler?.id ?? null,
    }));
    setNotice(`${teamNameById.get(nextBattingTeamId) ?? "Next team"} is now batting.`);
  }

  function finishMatch() {
    if (!activeMatch) return;
    updateMatch(activeMatch.id, (match) => ({ ...match, status: "completed" }));
    setData((current) => ({
      ...current,
      activeMatchId: null,
      battingTeamId: null,
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null,
    }));
    setNotice("Match completed. The sample standings have been updated.");
    setActiveTab("standings");
  }

  function resetDemo() {
    const sample = createSampleData();
    setData(sample);
    setTournamentForm(sample.tournament);
    setEditingTournament(false);
    setIsCreatingTournament(false);
    setEditingTeamId(null);
    setEditingPlayerId(null);
    setEditingMatchId(null);
    setNotice("Sample tournament restored. Your local demo changes were cleared.");
    setActiveTab("overview");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "teams", label: "Teams" },
    { id: "players", label: "Players" },
    { id: "schedule", label: "Schedule" },
    { id: "scoring", label: "Live scoring" },
    { id: "statistics", label: "Player stats" },
    { id: "standings", label: "Standings" },
  ];

  return (
    <div className="night-demo mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
      <div className="demo-hero relative overflow-hidden rounded-3xl border border-cyan-300/20 px-6 py-8 shadow-2xl sm:px-9 sm:py-10">
        <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-[35%] opacity-40" viewBox="0 0 520 240" fill="none">
          <defs>
            <linearGradient id="demo-ball" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fb7185" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
            <radialGradient id="demo-glow">
              <stop stopColor="#67e8f9" stopOpacity=".48" />
              <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="378" cy="105" r="120" fill="url(#demo-glow)" />
          <path d="M246 238c8-72 44-112 112-119 61-6 113 21 162 81v38H246Z" fill="#22c55e" fillOpacity=".18" />
          <path d="M305 237c18-59 44-88 80-88s62 29 80 88" stroke="#a3e635" strokeOpacity=".5" strokeWidth="3" strokeDasharray="7 9" />
          <path d="M348 81V31m16 50V31m-24 51h32" stroke="#cffafe" strokeWidth="5" strokeLinecap="round" />
          <path d="M412 67V17m16 50V17m-24 51h32" stroke="#cffafe" strokeWidth="5" strokeLinecap="round" />
          <circle cx="283" cy="110" r="22" fill="url(#demo-ball)" />
          <path d="M272 95c11 8 16 22 13 34" stroke="white" strokeOpacity=".85" strokeWidth="2" strokeDasharray="3 3" />
          <path d="m157 177 12-90 12 90m-19-34h14m-44 34 12-90 12 90m-19-34h14" stroke="#f0fdfa" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Floodlights on · Season 2026</p>
          <h1 className="mt-3 max-w-[34rem] text-3xl font-black tracking-tight text-white sm:text-4xl xl:text-5xl">{data.tournament.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTournamentForm(data.tournament);
                setIsCreatingTournament(false);
                setEditingTournament(true);
              }}
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
            >
              Edit tournament
            </button>
            <button
              type="button"
              onClick={beginNewTournament}
              className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-cyan-200"
            >
              + New tournament
            </button>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
            {data.tournament.description || "A night of big hits, tight spells, and local cricket."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-cyan-50">
            <span className="rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1.5">{data.tournament.overs} overs</span>
            <span className="rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1.5">{data.tournament.venue}</span>
            <span className="rounded-full border border-amber-100/20 bg-amber-100/10 px-3 py-1.5">Fictional demo season</span>
            {data.otherTournaments.length > 0 ? (
              <label className="flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1">
                Tournament
                <select
                  aria-label="Switch tournament"
                  value={data.tournament.id}
                  onChange={(event) => switchTournament(event.target.value)}
                  className="demo-input rounded-full border px-2 py-1 text-xs"
                >
                  {[data.tournament, ...data.otherTournaments.map(({ tournament }) => tournament)].map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="relative z-10 mt-6 rounded-xl border border-white/25 bg-slate-950/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:absolute sm:right-6 sm:top-6 sm:mt-0"
        >
          Reset sample
        </button>
      </div>

      {editingTournament ? (
        <form onSubmit={saveTournament} className="mt-5 grid gap-4 rounded-2xl border border-cyan-300/20 bg-slate-900/90 p-5 shadow-xl md:grid-cols-2">
          <h2 className="text-xl font-black text-white md:col-span-2">
            {isCreatingTournament ? "Create a tournament" : "Edit tournament details"}
          </h2>
          <label className="text-sm font-semibold text-slate-200">
            Tournament name
            <input required minLength={3} maxLength={80} value={tournamentForm.name} onChange={(event) => setTournamentForm((current) => ({ ...current, name: event.target.value }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-200">
            Venue
            <input required maxLength={80} value={tournamentForm.venue} onChange={(event) => setTournamentForm((current) => ({ ...current, venue: event.target.value }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-200">
            Overs per innings
            <input required type="number" min="1" max="50" value={tournamentForm.overs} onChange={(event) => setTournamentForm((current) => ({ ...current, overs: Number(event.target.value) }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-200">
            Tournament description
            <input maxLength={180} value={tournamentForm.description} onChange={(event) => setTournamentForm((current) => ({ ...current, description: event.target.value }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5" />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-300">
              {isCreatingTournament ? "Create tournament" : "Save tournament"}
            </button>
            <button type="button" onClick={() => { setEditingTournament(false); setIsCreatingTournament(false); }} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200">Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Organizer demo console</p>
          <p className="mt-2 text-slate-300">Explore squads, schedule, live scoring, scorecards and tournament analytics.</p>
        </div>
      </div>

      <aside className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
        This is a practice demo using fictional data. Changes are saved only in this browser and are not sent to a server.
        Do not enter real personal information.
      </aside>
      {storageError ? (
        <p role="status" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {storageError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Teams", data.teams.length, "Tournament roster"],
              ["Players", data.players.length, "Squads registered"],
              ["Matches played", completedMatches.length, `${upcomingMatches.length} fixture${upcomingMatches.length === 1 ? "" : "s"} ahead`],
              ["Tournament run rate", tournamentRunRate.toFixed(2), "Runs per over"],
              ["Top batter", topBatters[0]?.name ?? "—", `${topBatters[0]?.runs ?? 0} runs · avg ${topBatters[0]?.dismissals ? (topBatters[0].runs / topBatters[0].dismissals).toFixed(1) : "—"}`],
            ].map(([label, value, detail]) => (
              <article key={label} className="stat-card rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 truncate text-2xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <section className="demo-panel rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Match center</p>
                  <h2 className="mt-1 text-xl font-black text-white">Runs across completed matches</h2>
                </div>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">SCORE COMPARISON</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-300">
                <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-cyan-300" />Home team</span>
                <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-fuchsia-400" />Away team</span>
              </div>
              <svg className="mt-3 h-64 w-full" viewBox="0 0 640 250" role="img" aria-label="Completed match scores chart">
                {[0, 1, 2, 3, 4].map((line) => (
                  <g key={line}>
                    <line x1="48" x2="625" y1={205 - line * 44} y2={205 - line * 44} stroke="#334155" strokeDasharray="4 6" />
                    <text x="7" y={209 - line * 44} fill="#94a3b8" fontSize="11">{line * 50}</text>
                  </g>
                ))}
                {completedMatches.slice(0, 5).map((match, index) => {
                  const x = 78 + index * 108;
                  const homeHeight = Math.max(2, (match.homeRuns / 200) * 176);
                  const awayHeight = Math.max(2, (match.awayRuns / 200) * 176);
                  return (
                    <g key={match.id}>
                      <title>
                        {`${teamNameById.get(match.homeTeamId)} scored ${match.homeRuns}, and ${teamNameById.get(match.awayTeamId)} scored ${match.awayRuns}.`}
                      </title>
                      <rect x={x} y={205 - homeHeight} width="30" height={homeHeight} rx="5" fill="#67e8f9" />
                      <rect x={x + 36} y={205 - awayHeight} width="30" height={awayHeight} rx="5" fill="#e879f9" />
                      <text x={x + 4} y="229" fill="#cbd5e1" fontSize="10">{index + 1} · {formatDate(match.date).slice(0, 6)}</text>
                    </g>
                  );
                })}
              </svg>
            </section>
            <section className="demo-panel rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Up next</p>
              {upcomingMatches[0] ? (
                <>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {teamNameById.get(upcomingMatches[0].homeTeamId)} <span className="text-cyan-300">vs</span>{" "}
                    {teamNameById.get(upcomingMatches[0].awayTeamId)}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">{formatDate(upcomingMatches[0].date)} · {data.tournament.venue}</p>
                  <button
                    type="button"
                    onClick={() => startMatch(upcomingMatches[0].id)}
                    className="mt-6 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-900/40 hover:brightness-110"
                  >
                    Start live scoring →
                  </button>
                </>
              ) : <p className="mt-3 text-sm text-slate-300">No upcoming fixture. Add one in Schedule.</p>}
              <div className="mt-7 border-t border-slate-700 pt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Leading bowler</p>
                <p className="mt-2 text-lg font-bold text-white">{topBowlers[0]?.name ?? "—"}</p>
                <p className="mt-1 text-sm text-slate-300">{topBowlers[0]?.wickets ?? 0} wickets · economy {topBowlers[0]?.ballsBowled ? (topBowlers[0].runsConceded / (topBowlers[0].ballsBowled / 6)).toFixed(2) : "—"}</p>
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "teams" ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.teams.map((team) => (
              <article key={team.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Riverside Cricket Cup</p>
                {editingTeamId === team.id ? (
                  <form onSubmit={saveTeam} className="mt-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Team name
                      <input
                        required
                        minLength={2}
                        maxLength={60}
                        autoFocus
                        value={editingTeamName}
                        onChange={(event) => setEditingTeamName(event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                      />
                    </label>
                    <div className="mt-3 flex gap-2">
                      <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Save</button>
                      <button type="button" onClick={() => setEditingTeamId(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">{team.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {data.players.filter((player) => player.teamId === team.id).length} players
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(team.id);
                        setEditingTeamName(team.name);
                      }}
                      className="mt-3 text-sm font-semibold text-emerald-700 hover:underline"
                    >
                      Edit team
                    </button>
                  </>
                )}
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
              <div key={player.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-5 py-3 text-sm last:border-0">
                {editingPlayerId === player.id ? (
                  <form
                    className="col-span-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                    onSubmit={savePlayer}
                  >
                    <label className="block text-xs font-medium text-slate-600">
                      Player name
                      <input
                        required
                        minLength={2}
                        maxLength={80}
                        autoFocus
                        value={editingPlayerName}
                        onChange={(event) => setEditingPlayerName(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Team
                      <select
                        required
                        value={editingPlayerTeamId}
                        onChange={(event) => setEditingPlayerTeamId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
                      >
                        {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </label>
                    <button className="self-end rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Save</button>
                    <button type="button" onClick={() => setEditingPlayerId(null)} className="self-end rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className="font-medium text-slate-800">{player.name}</span>
                    <span className="text-slate-600">{teamNameById.get(player.teamId) ?? "Unknown team"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlayerId(player.id);
                        setEditingPlayerName(player.name);
                        setEditingPlayerTeamId(player.teamId);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                  </>
                )}
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
                {editingMatchId === match.id ? (
                  <form onSubmit={(event) => saveMatch(event, match)} className="w-full">
                    {match.status === "upcoming" ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-sm font-medium text-slate-700">
                          Home team
                          <select required value={editingHomeTeamId} onChange={(event) => setEditingHomeTeamId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                            {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Away team
                          <select required value={editingAwayTeamId} onChange={(event) => setEditingAwayTeamId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                            {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Date
                          <input required type="date" value={editingMatchDate} onChange={(event) => setEditingMatchDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-3 font-semibold text-slate-900">Correct the sample score</p>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <label className="text-sm font-medium text-slate-700">
                            {teamNameById.get(match.homeTeamId)} runs
                            <input required type="number" min="0" max="999" value={editingHomeRuns} onChange={(event) => setEditingHomeRuns(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            {teamNameById.get(match.homeTeamId)} wickets
                            <input required type="number" min="0" max="10" value={editingHomeWickets} onChange={(event) => setEditingHomeWickets(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            {teamNameById.get(match.awayTeamId)} runs
                            <input required type="number" min="0" max="999" value={editingAwayRuns} onChange={(event) => setEditingAwayRuns(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            {teamNameById.get(match.awayTeamId)} wickets
                            <input required type="number" min="0" max="10" value={editingAwayWickets} onChange={(event) => setEditingAwayWickets(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                          </label>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Save changes</button>
                      <button type="button" onClick={() => setEditingMatchId(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
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
                    <div className="flex flex-wrap items-center gap-3">
                      {match.status === "upcoming" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => beginMatchEdit(match)}
                            className="font-semibold text-emerald-700 hover:underline"
                          >
                            Edit fixture
                          </button>
                          <button
                            type="button"
                            onClick={() => startMatch(match.id)}
                            className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                          >
                            Start match
                          </button>
                        </>
                      ) : null}
                      {match.status === "completed" ? (
                        <button
                          type="button"
                          onClick={() => beginMatchEdit(match)}
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          Edit score
                        </button>
                      ) : null}
                      {match.status === "live" ? (
                        <button type="button" onClick={() => setActiveTab("scoring")} className="font-semibold text-emerald-700">
                          Continue scoring →
                        </button>
                      ) : null}
                    </div>
                  </>
                )}
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
                  const runs = home ? activeMatch.homeRuns : activeMatch.awayRuns;
                  const wickets = home ? activeMatch.homeWickets : activeMatch.awayWickets;
                  const balls = home ? activeMatch.homeBalls : activeMatch.awayBalls;
                  return (
                    <button
                      key={teamId}
                      type="button"
                      onClick={() => chooseBattingTeam(teamId)}
                      aria-pressed={batting}
                      className={`rounded-2xl border p-5 text-left ${batting ? "border-cyan-300 bg-cyan-300/10 shadow-lg shadow-cyan-950/40" : "border-slate-700 bg-slate-950/30"}`}
                    >
                      <span className="text-sm font-semibold text-slate-300">{teamNameById.get(teamId)}{batting ? " · batting" : ""}</span>
                      <span className="mt-2 block text-4xl font-bold text-slate-900">
                        <span className="text-white">{runs}</span>
                        <span className="text-xl text-slate-400">/{wickets}</span>
                      </span>
                      <span className="mt-2 block text-xs text-slate-400">{formatOvers(balls)} overs · RR {runRate(runs, balls)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold text-slate-300">
                  Striker
                  <select value={data.strikerId ?? ""} onChange={(event) => setData((current) => ({ ...current, strikerId: event.target.value || null }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5">
                    {currentBatters.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.runs} runs</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-300">
                  Non-striker
                  <select value={data.nonStrikerId ?? ""} onChange={(event) => setData((current) => ({ ...current, nonStrikerId: event.target.value || null }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5">
                    {currentBatters.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-300">
                  Bowler
                  <select value={data.bowlerId ?? ""} onChange={(event) => setData((current) => ({ ...current, bowlerId: event.target.value || null }))} className="demo-input mt-1.5 w-full rounded-xl border px-3 py-2.5">
                    {currentBowlers.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.wickets} wkts</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-300">Record a delivery · {teamNameById.get(data.battingTeamId ?? "") ?? "select a batting team"}</p>
                <p className="text-xs text-slate-400">
                  {formatOvers(data.battingTeamId === activeMatch.homeTeamId ? activeMatch.homeBalls : activeMatch.awayBalls)} / {data.tournament.overs}.0 overs
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 6].map((runs) => (
                  <button key={runs} type="button" onClick={() => addScore(runs)} disabled={(data.battingTeamId === activeMatch.homeTeamId ? activeMatch.homeBalls : activeMatch.awayBalls) >= data.tournament.overs * 6 || !data.strikerId || !data.bowlerId} className="min-w-12 rounded-lg border border-slate-600 bg-slate-950/30 px-4 py-2.5 font-bold text-white hover:border-cyan-300 hover:bg-cyan-300/10 disabled:opacity-40">
                    {runs === 0 ? "Dot" : runs}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={(data.battingTeamId === activeMatch.homeTeamId ? activeMatch.homeWickets : activeMatch.awayWickets) >= 10 || (data.battingTeamId === activeMatch.homeTeamId ? activeMatch.homeBalls : activeMatch.awayBalls) >= data.tournament.overs * 6 || !data.strikerId || !data.bowlerId}
                  onClick={() => addScore(0, true)}
                  className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-4 py-2.5 font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-40"
                >
                  Wicket
                </button>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={finishInnings} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10">
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

      {activeTab === "statistics" ? (
        <section className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total runs", data.players.reduce((sum, player) => sum + player.runs, 0), "Batting contribution"],
              ["Boundaries", data.players.reduce((sum, player) => sum + player.fours + player.sixes, 0), `${data.players.reduce((sum, player) => sum + player.fours, 0)} fours · ${data.players.reduce((sum, player) => sum + player.sixes, 0)} sixes`],
              ["Wickets", data.players.reduce((sum, player) => sum + player.wickets, 0), "Bowling impact"],
              ["Avg. innings run rate", tournamentRunRate.toFixed(2), "Runs per over across completed fixtures"],
            ].map(([label, value, detail]) => (
              <article key={label} className="stat-card rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
            <section className="demo-panel rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Team performance</p>
              <h2 className="mt-1 text-xl font-black text-white">Points by team</h2>
              <div className="mt-5 space-y-4">
                {standings.map((row, index) => {
                  const maxPoints = Math.max(2, ...standings.map((standing) => standing.points));
                  const colors = ["from-cyan-400 to-emerald-300", "from-fuchsia-400 to-violet-400", "from-amber-300 to-orange-400", "from-sky-400 to-blue-500"];
                  return (
                    <div key={row.team.id}>
                      <div className="mb-1.5 flex justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-200">{row.team.name}</span>
                        <span className="font-black text-white">{row.points} pts</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]}`} style={{ width: `${Math.max(4, row.points / maxPoints * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-slate-700 pt-4">
                <h3 className="text-sm font-bold text-slate-200">Innings run rate · completed matches</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {completedMatches.map((match) => (
                    <article key={match.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                      <p className="truncate text-xs text-slate-400">{teamNameById.get(match.homeTeamId)} · {teamNameById.get(match.awayTeamId)}</p>
                      <p className="mt-2 text-sm font-bold text-white">
                        RR {runRate(match.homeRuns, match.homeBalls)} <span className="text-slate-500">/</span> {runRate(match.awayRuns, match.awayBalls)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            <section className="demo-panel rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">Batting leaders</p>
                  <h2 className="mt-1 text-xl font-black text-white">Top run scorers</h2>
                </div>
                <span className="text-xs text-slate-400">AVG · SR · 4s · 6s</span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                    <tr><th className="py-2">Batter</th><th className="py-2">R</th><th className="py-2">AVG</th><th className="py-2">SR</th><th className="py-2">4s</th><th className="py-2">6s</th></tr>
                  </thead>
                  <tbody>
                    {topBatters.slice(0, 6).map((player) => (
                      <tr key={player.id} className="border-t border-slate-800">
                        <th className="py-3 pr-2 font-semibold text-slate-100">{player.name}</th>
                        <td className="py-3 font-black text-cyan-200">{player.runs}</td>
                        <td className="py-3 text-slate-300">{player.dismissals ? (player.runs / player.dismissals).toFixed(1) : "—"}</td>
                        <td className="py-3 text-slate-300">{player.ballsFaced ? (player.runs / player.ballsFaced * 100).toFixed(1) : "—"}</td>
                        <td className="py-3 text-slate-300">{player.fours}</td>
                        <td className="py-3 text-slate-300">{player.sixes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <section className="demo-panel rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Bowling leaders</p>
                <h2 className="mt-1 text-xl font-black text-white">Best bowling figures</h2>
              </div>
              <p className="text-xs text-slate-400">Overs · runs · wickets · economy · average</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                  <tr><th className="py-2">Bowler</th><th className="py-2">O</th><th className="py-2">R</th><th className="py-2">W</th><th className="py-2">ECON</th><th className="py-2">AVG</th></tr>
                </thead>
                <tbody>
                  {topBowlers.slice(0, 6).map((player) => (
                    <tr key={player.id} className="border-t border-slate-800">
                      <th className="py-3 pr-2 font-semibold text-slate-100">{player.name}</th>
                      <td className="py-3 text-slate-300">{formatOvers(player.ballsBowled)}</td>
                      <td className="py-3 text-slate-300">{player.runsConceded}</td>
                      <td className="py-3 font-black text-amber-200">{player.wickets}</td>
                      <td className="py-3 text-slate-300">{player.ballsBowled ? (player.runsConceded / (player.ballsBowled / 6)).toFixed(2) : "—"}</td>
                      <td className="py-3 text-slate-300">{player.wickets ? (player.runsConceded / player.wickets).toFixed(1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Player leaderboards use fictional sample figures plus deliveries recorded during this browser session. Score corrections to completed matches update team standings, not individual scorecards.</p>
          </section>
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
