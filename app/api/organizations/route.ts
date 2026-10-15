import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required."),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        ownerUserId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error("Create organization error", error);
    return NextResponse.json({ error: "Unable to create organization." }, { status: 500 });
  }
}
