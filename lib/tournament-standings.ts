export type TeamStanding = {
  id: string;
  name: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  runsFor: number;
  runsAgainst: number;
  netRunRate: number;
};

type MatchForStandings = {
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  innings: {
    battingTeamId: string;
    bowlingTeamId: string;
    runs: number;
  }[];
};

export function calculateTournamentStandings(
  teams: { id: string; name: string }[],
  matches: MatchForStandings[],
): TeamStanding[] {
  const standingsMap = new Map<string, TeamStanding>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      id: team.id,
      name: team.name,
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      runsFor: 0,
      runsAgainst: 0,
      netRunRate: 0,
    });
  }

  for (const match of matches) {
    const teamA = standingsMap.get(match.teamAId);
    const teamB = standingsMap.get(match.teamBId);

    if (!teamA || !teamB) {
      continue;
    }

    const teamARuns = match.innings
      .filter((inning) => inning.battingTeamId === match.teamAId)
      .reduce((total, inning) => total + inning.runs, 0);
    const teamBRuns = match.innings
      .filter((inning) => inning.battingTeamId === match.teamBId)
      .reduce((total, inning) => total + inning.runs, 0);

    teamA.runsFor += teamARuns;
    teamA.runsAgainst += teamBRuns;
    teamB.runsFor += teamBRuns;
    teamB.runsAgainst += teamARuns;

    teamA.played += 1;
    teamB.played += 1;

    if (match.winnerTeamId === null) {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1;
      teamB.points += 1;
      continue;
    }

    if (match.winnerTeamId === match.teamAId) {
      teamA.wins += 1;
      teamB.losses += 1;
      teamA.points += 2;
    } else {
      teamB.wins += 1;
      teamA.losses += 1;
      teamB.points += 2;
    }
  }

  return [...standingsMap.values()]
    .map((standing) => ({
      ...standing,
      netRunRate: Number((standing.runsFor - standing.runsAgainst).toFixed(2)),
    }))
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      if (right.wins !== left.wins) return right.wins - left.wins;
      if (right.netRunRate !== left.netRunRate) return right.netRunRate - left.netRunRate;
      return left.name.localeCompare(right.name);
    });
}
