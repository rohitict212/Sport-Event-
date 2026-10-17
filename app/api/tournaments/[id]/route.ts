import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/request";
import { getOrganizerOrganizations } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";

const visibilitySchema = z.object({ isPublic: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = visibilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tournament visibility." }, { status: 400 });
  }

  const organizations = await getOrganizerOrganizations(user.id);
  const tournament = await prisma.tournament.updateMany({
    where: { id, organizationId: { in: organizations.map(({ id: organizationId }) => organizationId) } },
    data: { isPublic: parsed.data.isPublic },
  });

  if (tournament.count === 0) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  return NextResponse.json({ isPublic: parsed.data.isPublic });
}
