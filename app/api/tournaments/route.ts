import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";

const tournamentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  const tournaments = await prisma.tournament.findMany({
    where: { organizationId: { in: organizations.map(({ id }) => id) } },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      organization: { select: { name: true } },
      _count: { select: { teams: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tournaments });
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

  const parsed = tournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tournament data." },
      { status: 400 },
    );
  }

  const organizations = await getOrganizerOrganizations(session.user.id);
  if (!organizations.some(({ id }) => id === parsed.data.organizationId)) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        organizationId: parsed.data.organizationId,
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
      select: { id: true, name: true, organizationId: true, createdAt: true },
    });
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error("Create tournament error", error);
    return NextResponse.json({ error: "Unable to create tournament." }, { status: 500 });
  }
}
