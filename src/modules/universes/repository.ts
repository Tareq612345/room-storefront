import { prisma } from "@shared/db/prisma";

export async function findActiveUniverses(storeId: string) {
  return prisma.universe.findMany({
    where: { storeId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function findUniverseBySlug(storeId: string, slug: string) {
  return prisma.universe.findFirst({
    where: { storeId, slug, isActive: true },
  });
}
