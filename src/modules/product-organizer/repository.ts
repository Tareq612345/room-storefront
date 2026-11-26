/**
 * @file src/modules/product-organizer/repository.ts
 * @purpose Read-only Prisma repository for the isolated Product Data Manager bootstrap.
 */

import { prisma } from "@shared/db/prisma";
import { PRODUCT_ORGANIZER_PAGE_KEY } from "./helpers";

export async function findActiveStoreForProductOrganizer(slug = "room-egypt") {
  return prisma.storeConfig.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
}

export async function findIsolatedProductOrganizerRecord(storeId: string) {
  return prisma.pageSection.findFirst({
    where: {
      storeId,
      pageKey: PRODUCT_ORGANIZER_PAGE_KEY,
    },
    select: {
      id: true,
      config: true,
    },
  });
}

export async function findReadOnlyProductsSnapshot(storeId: string) {
  return prisma.product.findMany({
    where: { storeId, isActive: true },
    include: {
      universe: { select: { slug: true, accentColor: true } },
      variants: { where: { isActive: true }, select: { stock: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
