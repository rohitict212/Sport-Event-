import { describe, expect, it } from "vitest";

import { calculateTournamentStandings } from "../../lib/tournament-standings";
import { deriveMatchResult } from "../../lib/scoring-rules";

describe("deriveMatchResult", () => {
  it("returns a winning margin by runs", () => {
    const result = deriveMatchResult([
      { battingTeamId: "team-a", battingTeamName: "Alpha", runs: 180, wickets: 8 },
      { battingTeamId: "team-b", battingTeamName: "Bravo", runs: 175, wickets: 10 },
    ]);

    expect(result).toEqual({
      winnerTeamId: "team-a",
      winnerTeamName: "Alpha",
      resultText: "Alpha won by 5 runs",
    });
  });

  it("returns a winning margin by wickets", () => {
    const result = deriveMatchResult([
      { battingTeamId: "team-a", battingTeamName: "Alpha", runs: 150, wickets: 10 },
      { battingTeamId: "team-b", battingTeamName: "Bravo", runs: 151, wickets: 4 },
    ]);

    expect(result).toEqual({
      winnerTeamId: "team-b",
      winnerTeamName: "Bravo",
      resultText: "Bravo won by 6 wickets",
    });
  });

  it("returns a tie result when totals are equal", () => {
    const result = deriveMatchResult([
      { battingTeamId: "team-a", battingTeamName: "Alpha", runs: 160, wickets: 8 },
      { battingTeamId: "team-b", battingTeamName: "Bravo", runs: 160, wickets: 9 },
    ]);

    expect(result).toEqual({
      winnerTeamId: null,
      winnerTeamName: null,
      resultText: "Match tied",
    });
  });
});

describe("calculateTournamentStandings", () => {
  it("sorts teams by points, wins, and net run rate", () => {
    const standings = calculateTournamentStandings(
      [
        { id: "team-a", name: "Alpha" },
        { id: "team-b", name: "Bravo" },
        { id: "team-c", name: "Charlie" },
      ],
      [
        {
          teamAId: "team-a",
          teamBId: "team-b",
          winnerTeamId: "team-a",
          innings: [
            { battingTeamId: "team-a", bowlingTeamId: "team-b", runs: 180 },
            { battingTeamId: "team-b", bowlingTeamId: "team-a", runs: 150 },
          ],
        },
        {
          teamAId: "team-a",
          teamBId: "team-c",
          winnerTeamId: "team-c",
          innings: [
            { battingTeamId: "team-a", bowlingTeamId: "team-c", runs: 140 },
            { battingTeamId: "team-c", bowlingTeamId: "team-a", runs: 170 },
          ],
        },
      ],
    );

    expect(standings.map((team) => team.name)).toEqual(["Charlie", "Alpha", "Bravo"]);
    expect(standings[0].points).toBe(2);
    expect(standings[1].points).toBe(2);
    expect(standings[2].points).toBe(0);
  });
});
