/**
 * @file src/modules/admin/service.ts
 * @purpose Business logic for Admin/Owner login (username or email), 48h single-use invite generation/redemption, and profile updates.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { ActionResult } from "@shared/types/common";
import {
  AcceptAdminInviteSchema,
  AdminLoginInputSchema,
  CreateAdminInviteSchema,
  UpdateAdminProfileSchema,
  type AdminInviteDTO,
  type AdminUserDTO,
} from "./schema";
import {
  completeInviteAndUpsertAdmin,
  createInviteRecord,
  findAdminByEmailOrUsername,
  findInviteByToken,
  updateAdminUserProfile,
} from "./repository";

const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 2 Days (48 hours)

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return timingSafeEqual(derived, keyBuf);
}

export async function authenticateAdmin(
  storeId: string,
  rawInput: unknown
): Promise<ActionResult<AdminUserDTO>> {
  const parsed = AdminLoginInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const user = await findAdminByEmailOrUsername(storeId, parsed.data.identifier);
  if (!user || !user.passwordHash) {
    return { ok: false, error: "Invalid username/email or password" };
  }

  const valid = verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Invalid username/email or password" };
  }

  return {
    ok: true,
    data: {
      id: user.id,
      storeId: user.storeId,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role === "OWNER" || user.role === "STAFF" ? user.role : "ADMIN",
      isActive: user.isActive,
    },
  };
}

export async function generateSingleUseInvite(
  storeId: string,
  invitedById: string,
  rawInput: unknown
): Promise<ActionResult<AdminInviteDTO>> {
  const parsed = CreateAdminInviteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await createInviteRecord({
    storeId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token,
    invitedById,
    expiresAt,
  });

  return {
    ok: true,
    data: {
      id: invite.id,
      email: invite.email,
      role: invite.role === "OWNER" || invite.role === "STAFF" ? invite.role : "ADMIN",
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
      usedAt: null,
    },
  };
}

export async function redeemSingleUseInvite(
  rawInput: unknown
): Promise<ActionResult<AdminUserDTO>> {
  const parsed = AcceptAdminInviteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid invite payload" };
  }

  const invite = await findInviteByToken(parsed.data.token);
  if (!invite) {
    return { ok: false, error: "Invite link is invalid" };
  }
  if (invite.usedAt) {
    return { ok: false, error: "This invite link has already been used" };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This invite link has expired (48h limit)" };
  }

  const user = await completeInviteAndUpsertAdmin({
    inviteId: invite.id,
    storeId: invite.storeId,
    email: invite.email,
    role: invite.role === "OWNER" || invite.role === "STAFF" ? invite.role : "ADMIN",
    username: parsed.data.username,
    name: parsed.data.name,
    passwordHash: hashPassword(parsed.data.password),
  });

  return {
    ok: true,
    data: {
      id: user.id,
      storeId: user.storeId,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role === "OWNER" || user.role === "STAFF" ? user.role : "ADMIN",
      isActive: user.isActive,
    },
  };
}

export async function updateProfile(
  userId: string,
  rawInput: unknown
): Promise<ActionResult<AdminUserDTO>> {
  const parsed = UpdateAdminProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid profile data" };
  }

  const passwordHash =
    parsed.data.newPassword && parsed.data.newPassword.length >= 8
      ? hashPassword(parsed.data.newPassword)
      : undefined;

  const updated = await updateAdminUserProfile({
    userId,
    name: parsed.data.name,
    username: parsed.data.username,
    email: parsed.data.email,
    passwordHash,
  });

  return {
    ok: true,
    data: {
      id: updated.id,
      storeId: updated.storeId,
      email: updated.email,
      username: updated.username,
      name: updated.name,
      role: updated.role === "OWNER" || updated.role === "STAFF" ? updated.role : "ADMIN",
      isActive: updated.isActive,
    },
  };
}
