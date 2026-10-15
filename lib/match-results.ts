import type { Prisma } from "@prisma/client";

import { deriveMatchResult } from "@/lib/scoring-rules";

export async function syncCompletedMatchResult(
  tx: Prisma.TransactionClient,
  matchId: string,
) {
  const match = await tx.match.findUnique({
    where: { id: matchId },
    include: {
      innings: {
        orderBy: { inningsNumber: "asc" },
        include: {
          battingTeam: { select: { id: true, name: true } },
          bowlingTeam: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!match) {
    return null;
  }

  const completedInnings = match.innings
    .filter((inning) => inning.isComplete)
    .map((inning) => ({
      battingTeamId: inning.battingTeamId,
      battingTeamName: inning.battingTeam.name,
      runs: inning.runs,
      wickets: inning.wickets,
    }));

  const result = deriveMatchResult(completedInnings);

  if (completedInnings.length < 2 || result.resultText === "Result pending") {
    return match;
  }

  return tx.match.update({
    where: { id: match.id },
    data: {
      status: "completed",
      winnerTeamId: result.winnerTeamId,
      resultText: result.resultText,
    },
  });
}
