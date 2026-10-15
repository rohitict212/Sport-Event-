import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { syncCompletedMatchResult } from "@/lib/match-results";

const scoreEventSchema = z.object({
  inningsId: z.string().uuid(),
  overNumber: z.coerce.number().int().min(1).max(100),
  ballNumber: z.coerce.number().int().min(1).max(12),
  runs: z.coerce.number().int().min(0).max(20).default(0),
  extras: z.coerce.number().int().min(0).max(20).default(0),
  wicketType: z.string().trim().max(30).optional().or(z.literal("")),
  isNoBall: z.boolean().optional().default(false),
  isWide: z.boolean().optional().default(false),
  isLegBye: z.boolean().optional().default(false),
  isBye: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const events = await prisma.scoreEvent.findMany({
    where: { innings: { match: { organizationId: { in: organizations.map(({ id }) => id) } } } },
    include: {
      innings: {
        select: {
          id: true,
          inningsNumber: true,
          battingTeam: { select: { name: true } },
          bowlingTeam: { select: { name: true } },
          match: {
            select: {
              id: true,
              teamA: { select: { name: true } },
              teamB: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: [{ inningsId: "asc" }, { overNumber: "asc" }, { ballNumber: "asc" }],
  });

  return NextResponse.json({ events });
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

  const parsed = scoreEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid score event data." },
      { status: 400 },
    );
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const innings = await prisma.innings.findFirst({
    where: {
      id: parsed.data.inningsId,
      match: { organizationId: { in: organizations.map(({ id }) => id) } },
    },
    select: {
      id: true,
      runs: true,
      wickets: true,
      overs: true,
      matchId: true,
    },
  });

  if (!innings) {
    return NextResponse.json({ error: "Innings not found." }, { status: 404 });
  }

  const existing = await prisma.scoreEvent.findFirst({
    where: {
      inningsId: innings.id,
      overNumber: parsed.data.overNumber,
      ballNumber: parsed.data.ballNumber,
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "A delivery already exists for this over and ball." }, { status: 409 });
  }

  try {
    const nextRuns = innings.runs + parsed.data.runs + parsed.data.extras;
    const nextWickets = innings.wickets + (parsed.data.wicketType ? 1 : 0);
    const updatedOvers = (innings.overs ?? 0) + (parsed.data.isWide || parsed.data.isNoBall ? 0 : 1 / 6);

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.scoreEvent.create({
        data: {
          inningsId: innings.id,
          overNumber: parsed.data.overNumber,
          ballNumber: parsed.data.ballNumber,
          runs: parsed.data.runs,
          extras: parsed.data.extras,
          wicketType: parsed.data.wicketType?.trim() || null,
          isNoBall: parsed.data.isNoBall,
          isWide: parsed.data.isWide,
          isLegBye: parsed.data.isLegBye,
          isBye: parsed.data.isBye,
        },
      });

      await tx.innings.update({
        where: { id: innings.id },
        data: {
          runs: nextRuns,
          wickets: nextWickets,
          overs: updatedOvers,
        },
      });

      await syncCompletedMatchResult(tx, innings.matchId);

      return created;
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create score event error", error);
    return NextResponse.json({ error: "Unable to record the delivery." }, { status: 500 });
  }
}
