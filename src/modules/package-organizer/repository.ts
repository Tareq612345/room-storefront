/**
 * @file src/modules/package-organizer/repository.ts
 * @purpose Read-only Prisma repository for the isolated Packages & Collections Data Manager bootstrap.
 */

import { prisma } from "@shared/db/prisma";
import { PACKAGE_ORGANIZER_PAGE_KEY } from "./helpers";

export async function findActiveStoreForPackageOrganizer(slug = "room-egypt") {
  return prisma.storeConfig.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
}

export async function findIsolatedPackageOrganizerRecord(storeId: string) {
  return prisma.pageSection.findFirst({
    where: {
      storeId,
      pageKey: PACKAGE_ORGANIZER_PAGE_KEY,
    },
    select: {
      id: true,
      config: true,
    },
  });
}

export async function findReadOnlyBundlesSnapshot(storeId: string) {
  return prisma.bundle.findMany({
    where: { storeId, isActive: true },
    include: {
      universe: { select: { slug: true, accentColor: true } },
      items: {
        include: {
          product: { select: { id: true, basePrice: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
