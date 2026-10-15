import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { syncCompletedMatchResult } from "@/lib/match-results";

const inningsSchema = z.object({
  matchId: z.string().uuid(),
  battingTeamId: z.string().uuid(),
  bowlingTeamId: z.string().uuid(),
  inningsNumber: z.coerce.number().int().min(1).max(4),
  runs: z.coerce.number().int().min(0).default(0),
  wickets: z.coerce.number().int().min(0).default(0),
  overs: z.coerce.number().min(0).max(100).default(0),
  targetRuns: z.coerce.number().int().min(0).optional(),
  isComplete: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const innings = await prisma.innings.findMany({
    where: { match: { organizationId: { in: organizations.map(({ id }) => id) } } },
    include: {
      match: {
        select: {
          id: true,
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
          scheduledAt: true,
        },
      },
      battingTeam: { select: { name: true } },
      bowlingTeam: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ innings });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = inningsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid innings data." },
      { status: 400 },
    );
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const match = await prisma.match.findFirst({
    where: {
      id: parsed.data.matchId,
      organizationId: { in: organizations.map(({ id }) => id) },
    },
    select: {
      id: true,
      organizationId: true,
      teamAId: true,
      teamBId: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const battingTeamId = parsed.data.battingTeamId;
  const bowlingTeamId = parsed.data.bowlingTeamId;
  if (battingTeamId === bowlingTeamId) {
    return NextResponse.json({ error: "Batting and bowling teams must be different." }, { status: 400 });
  }

  const eligibleTeamIds = new Set([match.teamAId, match.teamBId]);
  if (!eligibleTeamIds.has(battingTeamId) || !eligibleTeamIds.has(bowlingTeamId)) {
    return NextResponse.json({ error: "Choose teams from the selected match." }, { status: 400 });
  }

  const existing = await prisma.innings.findUnique({
    where: {
      matchId_inningsNumber: {
        matchId: match.id,
        inningsNumber: parsed.data.inningsNumber,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "This innings number already exists for the match." }, { status: 409 });
  }

  try {
    const innings = await prisma.$transaction(async (tx) => {
      const created = await tx.innings.create({
        data: {
          matchId: match.id,
          battingTeamId,
          bowlingTeamId,
          inningsNumber: parsed.data.inningsNumber,
          runs: parsed.data.runs,
          wickets: parsed.data.wickets,
          overs: parsed.data.overs,
          targetRuns: parsed.data.targetRuns,
          isComplete: parsed.data.isComplete,
        },
        include: {
          battingTeam: { select: { name: true } },
          bowlingTeam: { select: { name: true } },
        },
      });

      await tx.match.update({
        where: { id: match.id },
        data: { status: "live" },
      });

      if (parsed.data.isComplete) {
        await syncCompletedMatchResult(tx, match.id);
      }

      return created;
    });

    return NextResponse.json({ innings }, { status: 201 });
  } catch (error) {
    console.error("Create innings error", error);
    return NextResponse.json({ error: "Unable to create innings." }, { status: 500 });
  }
}
