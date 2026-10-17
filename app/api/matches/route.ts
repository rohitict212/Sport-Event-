import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrganizerOrganizations } from "@/lib/organizations";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/request";
import { prisma } from "@/lib/prisma";

const matchSchema = z.object({
  tournamentId: z.string().uuid(),
  teamAId: z.string().uuid(),
  teamBId: z.string().uuid(),
  scheduledAt: z
    .string()
    .trim()
    .min(1, "Match time is required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date/time."),
  venueName: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.enum(["scheduled", "live", "completed", "cancelled"]).optional().default("scheduled"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const organizations = await getOrganizerOrganizations(user.id);
  const matches = await prisma.match.findMany({
    where: { organizationId: { in: organizations.map(({ id }) => id) } },
    include: {
      tournament: { select: { name: true } },
      teamA: { select: { name: true } },
      teamB: { select: { name: true } },
      winner: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ matches });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid match data." },
      { status: 400 },
    );
  }

  const organizations = await getOrganizerOrganizations(user.id);
  const teamRows = await prisma.team.findMany({
    where: {
      tournamentId: parsed.data.tournamentId,
      organizationId: { in: organizations.map(({ id }) => id) },
    },
    select: { id: true, organizationId: true },
  });

  const teamIds = new Set(teamRows.map(({ id }) => id));

  if (parsed.data.teamAId === parsed.data.teamBId || !teamIds.has(parsed.data.teamAId) || !teamIds.has(parsed.data.teamBId)) {
    return NextResponse.json({ error: "Choose two valid teams from the selected tournament." }, { status: 400 });
  }

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: parsed.data.tournamentId,
      organizationId: { in: organizations.map(({ id }) => id) },
    },
    select: { id: true, organizationId: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  try {
    const match = await prisma.match.create({
      data: {
        organizationId: tournament.organizationId,
        tournamentId: tournament.id,
        teamAId: parsed.data.teamAId,
        teamBId: parsed.data.teamBId,
        scheduledAt: new Date(parsed.data.scheduledAt),
        venueName: parsed.data.venueName?.trim() || null,
        status: parsed.data.status,
      },
      select: {
        id: true,
        tournamentId: true,
        teamAId: true,
        teamBId: true,
        scheduledAt: true,
        status: true,
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error("Create match error", error);
    return NextResponse.json({ error: "Unable to create match." }, { status: 500 });
  }
}
