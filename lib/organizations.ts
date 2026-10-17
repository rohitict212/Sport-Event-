import { prisma } from "@/lib/prisma";

export async function getOrganizerOrganizations(userId: string) {
  return prisma.organization.findMany({
    where: { members: { some: { userId } } },
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
