/**
 * @file src/shared/db/prisma.ts
 * @purpose Database Singleton: Exports the single PrismaClient instance (strictly for module repository.ts files only).
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance.
 * STRICT RULE: Only `repository.ts` files inside `src/modules/*` may import this.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
