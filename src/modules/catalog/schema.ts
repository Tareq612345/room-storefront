import { z } from "zod";

export const ProductVariantSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  size: z.string().nullable(),
  colorName: z.string().nullable(),
  colorHex: z.string().nullable(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  stock: z.number().int(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export const ProductSummarySchema = z.object({
  id: z.string(),
  storeId: z.string(),
  universeId: z.string(),
  universeSlug: z.string(),
  universeAccentColor: z.string(),
  slug: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  basePrice: z.number(),
  compareAtPrice: z.number().nullable(),
  thumbnailUrl: z.string(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  totalStock: z.number().int(),
  isVaulted: z.boolean(),
  defaultVariantId: z.string().nullable(),
});

export type ProductVariantDTO = z.infer<typeof ProductVariantSchema>;
export type ProductSummaryDTO = z.infer<typeof ProductSummarySchema>;
