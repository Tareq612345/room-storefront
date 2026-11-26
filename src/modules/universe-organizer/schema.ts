/**
 * @file src/modules/universe-organizer/schema.ts
 * @purpose Zod schemas and TypeScript contracts for the isolated Admin Universe Organizer module (universes, PNG icons, and multi-universe product/offer assignments).
 */

import { z } from "zod";

export const OrganizedUniverseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  accentColor: z.string().min(1),
  iconPngUrl: z.string().nullable().default(null),
  bannerUrl: z.string().nullable().default(null),
  sortOrder: z.number().int().default(1),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
  offerIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrganizedUniverse = z.infer<typeof OrganizedUniverseSchema>;

export const OrganizerRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  universes: z.array(OrganizedUniverseSchema),
});

export type OrganizerRegistry = z.infer<typeof OrganizerRegistrySchema>;

export const SiteProductSourceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  basePrice: z.number(),
  compareAtPrice: z.number().nullable(),
  thumbnailUrl: z.string(),
  universeId: z.string(),
  universeSlug: z.string(),
  originalAccentColor: z.string(),
  isNewArrival: z.boolean(),
  totalStock: z.number().int(),
  isVaulted: z.boolean(),
});

export type SiteProductSource = z.infer<typeof SiteProductSourceSchema>;

export const SiteOfferBannerSourceSchema = z.object({
  id: z.string(),
  kind: z.enum(["LOADOUT", "PROMO_BANNER"]),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  itemCount: z.number().int().nullable(),
  originalPrice: z.number().nullable(),
  finalPrice: z.number().nullable(),
  savingsAmount: z.number().nullable(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  originalAccentColor: z.string(),
  textColor: z.string().nullable(),
  universeSlug: z.string().nullable(),
});

export type SiteOfferBannerSource = z.infer<typeof SiteOfferBannerSourceSchema>;

export interface UniverseOrganizerBootstrap {
  storeId: string;
  initialRegistry: OrganizerRegistry;
  hasPersistedRecord: boolean;
  initialProducts: SiteProductSource[];
  initialOffers: SiteOfferBannerSource[];
}
