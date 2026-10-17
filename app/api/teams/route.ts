import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrganizerOrganizations } from "@/lib/organizations";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/request";
import { prisma } from "@/lib/prisma";

const teamSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const organizations = await getOrganizerOrganizations(user.id);
  const teams = await prisma.team.findMany({
    where: { organizationId: { in: organizations.map(({ id }) => id) } },
    select: {
      id: true,
      name: true,
      organizationId: true,
      organization: { select: { name: true } },
      tournament: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ teams });
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

  const parsed = teamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid team data." },
      { status: 400 },
    );
  }

  const organizations = await getOrganizerOrganizations(user.id);
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
    const team = await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        organizationId: tournament.organizationId,
        name: parsed.data.name,
      },
      select: { id: true, name: true, tournamentId: true, organizationId: true, createdAt: true },
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Create team error", error);
    return NextResponse.json({ error: "Unable to create team." }, { status: 500 });
  }
}
