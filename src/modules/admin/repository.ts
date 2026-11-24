/**
 * @file src/modules/admin/repository.ts
 * @purpose Prisma queries for Admin/Owner users, 48-hour single-use AdminInvites, and profile updates (only file in admin module allowed to call Prisma).
 */

import { prisma } from "@shared/db/prisma";

export async function findAdminByEmailOrUsername(
  storeId: string,
  identifier: string
) {
  return prisma.user.findFirst({
    where: {
      storeId,
      isActive: true,
      role: { in: ["OWNER", "ADMIN", "STAFF"] },
      OR: [
        { email: { equals: identifier, mode: "insensitive" } },
        { username: { equals: identifier, mode: "insensitive" } },
      ],
    },
  });
}

export async function listStoreAdmins(storeId: string) {
  return prisma.user.findMany({
    where: {
      storeId,
      role: { in: ["OWNER", "ADMIN", "STAFF"] },
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
  });
}

export async function listAdminInvites(storeId: string) {
  return prisma.adminInvite.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}

export async function createInviteRecord(params: {
  storeId: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  token: string;
  invitedById?: string;
  expiresAt: Date;
}) {
  return prisma.adminInvite.create({
    data: params,
  });
}

export async function findInviteByToken(token: string) {
  return prisma.adminInvite.findUnique({
    where: { token },
  });
}

export async function completeInviteAndUpsertAdmin(params: {
  inviteId: string;
  storeId: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  username: string;
  name: string;
  passwordHash: string;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: {
        storeId_email: { storeId: params.storeId, email: params.email },
      },
      update: {
        username: params.username,
        name: params.name,
        passwordHash: params.passwordHash,
        role: params.role,
        isActive: true,
      },
      create: {
        storeId: params.storeId,
        email: params.email,
        username: params.username,
        name: params.name,
        passwordHash: params.passwordHash,
        role: params.role,
        isActive: true,
      },
    });

    await tx.adminInvite.update({
      where: { id: params.inviteId },
      data: { usedAt: new Date() },
    });

    return user;
  });
}

export async function updateAdminUserProfile(params: {
  userId: string;
  name: string;
  username: string;
  email: string;
  passwordHash?: string;
}) {
  return prisma.user.update({
    where: { id: params.userId },
    data: {
      name: params.name,
      username: params.username,
      email: params.email,
      ...(params.passwordHash ? { passwordHash: params.passwordHash } : {}),
    },
  });
}
