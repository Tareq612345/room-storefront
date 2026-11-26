/**
 * @file src/modules/package-organizer/schema.ts
 * @purpose Zod schemas and TypeScript contracts for the isolated Packages & Collections Data Manager.
 */

import { z } from "zod";

export const PackageSpecItemSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  value: z.string(),
});

export type PackageSpecItem = z.infer<typeof PackageSpecItemSchema>;

export const OrganizedPackageSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: z.enum(["PACKAGE", "COLLECTION"]).default("PACKAGE"),
  name: z.string(),
  tagline: z.string().default(""),
  description: z.string().default(""),
  badgeLabel: z.string().default("Loadout"),
  ctaLabel: z.string().default("Add to Room"),
  accentColor: z.string().min(1).default("#c94b99"),
  universeSlug: z.string().nullable().default(null),

  // Outer card banner image + framing
  bannerImageUrl: z.string().default(""),
  bannerImageFit: z.enum(["cover", "contain"]).default("cover"),
  bannerImagePosition: z.enum(["center", "top", "bottom"]).default("center"),

  // Large top image on the inner Package/Collection detail page
  heroImageUrl: z.string().default(""),

  // Pricing (optional for pure Collection showcase)
  pricingMode: z.enum(["FIXED_PRICE", "COLLECTION_SHOWCASE"]).default("FIXED_PRICE"),
  originalPrice: z.number().nonnegative().nullable().default(null),
  finalPrice: z.number().nonnegative().nullable().default(null),

  // Products belonging to this Package / Collection
  productIds: z.array(z.string()).default([]),

  // Extra detail rows & display toggles
  specs: z.array(PackageSpecItemSchema).default([]),
  showProductsInside: z.boolean().default(true),
  showAddPackBtn: z.boolean().default(true),
  isFeatured: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrganizedPackage = z.infer<typeof OrganizedPackageSchema>;

export const PackageRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  packages: z.array(OrganizedPackageSchema),
});

export type PackageRegistry = z.infer<typeof PackageRegistrySchema>;

export interface PackageOrganizerBootstrap {
  storeId: string;
  initialRegistry: PackageRegistry;
  hasPersistedRecord: boolean;
}
