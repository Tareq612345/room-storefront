/**
 * @file src/modules/admin/index.ts
 * @purpose Admin Module Public API: Exports authentication, single-use 48h invite, and profile schemas/services.
 */

export {
  AcceptAdminInviteSchema,
  AdminLoginInputSchema,
  AdminRoleSchema,
  CreateAdminInviteSchema,
  UpdateAdminProfileSchema,
  type AcceptAdminInviteInput,
  type AdminInviteDTO,
  type AdminLoginInput,
  type AdminUserDTO,
  type CreateAdminInviteInput,
  type UpdateAdminProfileInput,
} from "./schema";
export {
  authenticateAdmin,
  generateSingleUseInvite,
  redeemSingleUseInvite,
  updateProfile,
} from "./service";
