import { prisma } from "@/lib/prisma";

const ORGANIZER_ROLES = ["OWNER", "ADMIN", "ORGANIZER"];

/**
 * Return only organizations the user may manage. Ownership is included for
 * accounts whose owner record predates or lacks an organization-member row.
 */
export async function getOrganizerOrganizations(userId: string) {
  return prisma.organization.findMany({
    where: {
      OR: [
        { ownerUserId: userId },
        {
          members: {
            some: {
              userId,
              role: { in: ORGANIZER_ROLES },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
