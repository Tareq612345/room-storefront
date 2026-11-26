/**
 * @file src/modules/universe-organizer/repository.ts
 * @purpose Read-only Prisma repository for the isolated Universe Organizer bootstrap (only reads existing site data and the isolated organizer page_sections record).
 */

import { prisma } from "@shared/db/prisma";

export const ORGANIZER_PAGE_KEY = "__isolated_universe_organizer_v1__";
export const ORGANIZER_RECORD_ID = "uorg_isolated_registry_v1";

export async function findActiveStoreForOrganizer(slug = "room-egypt") {
  return prisma.storeConfig.findFirst({
    where: { slug, isActive: true },
    select: { id: true, slug: true },
  });
}

export async function findIsolatedOrganizerRecord(storeId: string) {
  return prisma.pageSection.findFirst({
    where: {
      storeId,
      pageKey: ORGANIZER_PAGE_KEY,
    },
    select: {
      id: true,
      config: true,
      updatedAt: true,
    },
  });
}

export async function findReadOnlySiteSnapshot(storeId: string) {
  const [universes, products, bundles, homeSections] = await Promise.all([
    prisma.universe.findMany({
      where: { storeId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId, isActive: true },
      include: {
        universe: { select: { id: true, slug: true, accentColor: true } },
        variants: {
          where: { isActive: true },
          select: { stock: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bundle.findMany({
      where: { storeId, isActive: true },
      include: {
        universe: { select: { id: true, slug: true, accentColor: true } },
        items: {
          include: {
            product: { select: { basePrice: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pageSection.findMany({
      where: { storeId, pageKey: "home" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return { universes, products, bundles, homeSections };
}
