/**
 * @file src/modules/store-config/repository.ts
 * @purpose Store-Config Repository: Prisma queries for StoreConfig (only file in module allowed to call Prisma).
 */

import { prisma } from "@shared/db/prisma";

export async function findActiveStoreBySlug(slug: string) {
  return prisma.storeConfig.findFirst({
    where: { slug, isActive: true },
  });
}

export async function findStoreById(storeId: string) {
  return prisma.storeConfig.findUnique({
    where: { id: storeId },
  });
}
