/**
 * @file src/modules/admin/schema.ts
 * @purpose Zod schemas and TypeScript types for Admin authentication (username or email), 48-hour single-use invites, and profile management.
 */

import { z } from "zod";

export const AdminRoleSchema = z.enum(["OWNER", "ADMIN", "STAFF"]);

export const AdminLoginInputSchema = z.object({
  identifier: z.string().trim().min(2, "Enter your username or email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const CreateAdminInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: AdminRoleSchema.default("ADMIN"),
});

export const AcceptAdminInviteSchema = z.object({
  token: z.string().min(16),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  name: z.string().trim().min(2),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const UpdateAdminProfileSchema = z.object({
  name: z.string().trim().min(2),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  email: z.string().trim().email(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});

export interface AdminUserDTO {
  id: string;
  storeId: string;
  email: string | null;
  username: string | null;
  name: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
}

export interface AdminInviteDTO {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  token: string;
  expiresAt: string;
  usedAt: string | null;
}

export type AdminLoginInput = z.infer<typeof AdminLoginInputSchema>;
export type CreateAdminInviteInput = z.infer<typeof CreateAdminInviteSchema>;
export type AcceptAdminInviteInput = z.infer<typeof AcceptAdminInviteSchema>;
export type UpdateAdminProfileInput = z.infer<typeof UpdateAdminProfileSchema>;
