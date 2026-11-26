/**
 * @file src/modules/product-organizer/schema.ts
 * @purpose Zod schemas and TypeScript contracts for the isolated Product Data Manager (outer card banner styling/image + inner product page content & specs).
 */

import { z } from "zod";

export const ProductSpecItemSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  value: z.string(),
});

export type ProductSpecItem = z.infer<typeof ProductSpecItemSchema>;

export const OrganizedProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string(),
  subtitle: z.string(),
  badgeLabel: z.string().default("Fresh Drop"),
  basePrice: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable().default(null),
  stock: z.number().int().nonnegative().default(10),
  isVaulted: z.boolean().default(false),
  accentColor: z.string().min(1).default("#c94b99"),
  universeSlug: z.string().default("cars"),
  cardImageUrl: z.string(),
  cardImageFit: z.enum(["cover", "contain"]).default("cover"),
  cardImagePosition: z.enum(["center", "top", "bottom"]).default("center"),
  isNewArrival: z.boolean().default(true),
  isFeatured: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(1),

  // Inner product page content & layout
  galleryImages: z.array(z.string()).default([]),
  description: z.string().default(""),
  specs: z.array(ProductSpecItemSchema).default([]),
  detailLayout: z.enum(["split-gallery", "cinema-hero"]).default("split-gallery"),
  showSpecsGrid: z.boolean().default(true),
  showBuyNowBtn: z.boolean().default(true),
  addToBagLabel: z.string().default("Claim Yours"),
  buyNowLabel: z.string().default("Buy Now"),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrganizedProduct = z.infer<typeof OrganizedProductSchema>;

export const ProductRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  products: z.array(OrganizedProductSchema),
});

export type ProductRegistry = z.infer<typeof ProductRegistrySchema>;

export interface ProductOrganizerBootstrap {
  storeId: string;
  initialRegistry: ProductRegistry;
  hasPersistedRecord: boolean;
}
