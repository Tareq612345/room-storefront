/**
 * @file src/modules/catalog/repository.ts
 * @purpose Catalog Repository: Prisma queries for Fresh Drops and Universe-filtered products.
 */

import { prisma } from "@shared/db/prisma";

export async function findNewArrivalProducts(storeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { storeId, isActive: true, isNewArrival: true },
    include: {
      universe: { select: { slug: true, accentColor: true } },
      variants: {
        where: { isActive: true },
        orderBy: { isDefault: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findProductsByUniverseSlug(
  storeId: string,
  universeSlug: string
) {
  return prisma.product.findMany({
    where: {
      storeId,
      isActive: true,
      universe: { slug: universeSlug, isActive: true },
    },
    include: {
      universe: { select: { slug: true, accentColor: true } },
      variants: {
        where: { isActive: true },
        orderBy: { isDefault: "desc" },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}
