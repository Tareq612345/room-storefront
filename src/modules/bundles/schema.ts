/**
 * @file src/modules/bundles/schema.ts
 * @purpose Bundles Schemas: Zod validation for Loadout pricing types and BundleSummaryDTO.
 */

import { z } from "zod";

export const BundlePricingTypeSchema = z.enum([
  "FIXED_PRICE",
  "PERCENTAGE_DISCOUNT",
  "AMOUNT_DISCOUNT",
]);

export const BundleSummarySchema = z.object({
  id: z.string(),
  storeId: z.string(),
  universeSlug: z.string().nullable(),
  universeAccentColor: z.string(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string().nullable(),
  itemCount: z.number().int(),
  originalPrice: z.number(),
  finalPrice: z.number(),
  savingsAmount: z.number(),
});

export type BundleSummaryDTO = z.infer<typeof BundleSummarySchema>;
