export type InningOutcome = {
  battingTeamId: string;
  battingTeamName?: string;
  runs: number;
  wickets: number;
};

export type MatchResult = {
  winnerTeamId: string | null;
  winnerTeamName: string | null;
  resultText: string;
};

export function deriveMatchResult(
  completedInnings: InningOutcome[],
): MatchResult {
  if (completedInnings.length < 2) {
    return {
      winnerTeamId: null,
      winnerTeamName: null,
      resultText: "Result pending",
    };
  }

  const firstInnings = completedInnings[0];
  const lastInnings = completedInnings[completedInnings.length - 1];

  if (lastInnings.runs > firstInnings.runs) {
    const wicketsRemaining = Math.max(0, 10 - lastInnings.wickets);
    const winnerTeamName = lastInnings.battingTeamName ?? "Batting side";

    return {
      winnerTeamId: lastInnings.battingTeamId,
      winnerTeamName,
      resultText: `${winnerTeamName} won by ${wicketsRemaining} wickets`,
    };
  }

  if (lastInnings.runs < firstInnings.runs) {
    const margin = firstInnings.runs - lastInnings.runs;
    const winnerTeamName = firstInnings.battingTeamName ?? "Batting side";

    return {
      winnerTeamId: firstInnings.battingTeamId,
      winnerTeamName,
      resultText: `${winnerTeamName} won by ${margin} runs`,
    };
  }

  return {
    winnerTeamId: null,
    winnerTeamName: null,
    resultText: "Match tied",
  };
}
