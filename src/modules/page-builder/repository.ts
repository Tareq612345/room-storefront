/**
 * @file src/modules/page-builder/repository.ts
 * @purpose Page-Builder Repository: Prisma queries for visible PageSections ordered by sortOrder.
 */

import { prisma } from "@shared/db/prisma";

export async function findVisiblePageSections(
  storeId: string,
  pageKey = "home"
) {
  return prisma.pageSection.findMany({
    where: { storeId, pageKey, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
}
