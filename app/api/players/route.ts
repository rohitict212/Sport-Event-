import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";

const playerSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().trim().min(2, "Player name is required.").max(100),
  role: z.string().trim().max(50).optional().or(z.literal("")),
  jerseyNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const players = await prisma.player.findMany({
    where: { organizationId: { in: organizations.map(({ id }) => id) } },
    select: {
      id: true,
      name: true,
      role: true,
      jerseyNumber: true,
      organizationId: true,
      teamId: true,
      createdAt: true,
      team: { select: { name: true, tournament: { select: { name: true } } } },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ players });
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

  const parsed = playerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid player data." },
      { status: 400 },
    );
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const team = await prisma.team.findFirst({
    where: {
      id: parsed.data.teamId,
      organizationId: { in: organizations.map(({ id }) => id) },
    },
    select: { id: true, organizationId: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  try {
    const player = await prisma.player.create({
      data: {
        organizationId: team.organizationId,
        teamId: team.id,
        name: parsed.data.name,
        role: parsed.data.role?.trim() || null,
        jerseyNumber: parsed.data.jerseyNumber?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        role: true,
        jerseyNumber: true,
        teamId: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error("Create player error", error);
    return NextResponse.json({ error: "Unable to create player." }, { status: 500 });
  }
}
