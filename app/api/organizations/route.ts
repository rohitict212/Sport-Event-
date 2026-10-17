import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrganizerOrganizations } from "@/lib/organizations";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/request";
import { prisma } from "@/lib/prisma";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required."),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const organizations = await getOrganizerOrganizations(user.id);

  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid organization data." },
        { status: 400 },
      );
    }

    const baseSlug = parsed.data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "organization";

    const slugBase = baseSlug.slice(0, 40);
    const existingOrganization = await prisma.organization.findUnique({
      where: { slug: slugBase },
    });

    const slug = existingOrganization ? `${slugBase}-${Date.now()}` : slugBase;
    const organization = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        slug,
        ownerUserId: user.id,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error("Create organization error", error);
    return NextResponse.json({ error: "Unable to create organization." }, { status: 500 });
  }
}
