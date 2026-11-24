/**
 * @file src/modules/bundles/repository.ts
 * @purpose Bundles Repository: Prisma queries for featured Loadouts and their items.
 */

import { prisma } from "@shared/db/prisma";

export async function findFeaturedBundles(storeId: string, limit = 3) {
  return prisma.bundle.findMany({
    where: { storeId, isActive: true, isFeatured: true },
    include: {
      universe: { select: { slug: true, accentColor: true } },
      items: {
        include: {
          product: { select: { basePrice: true } },
          variant: { select: { price: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
