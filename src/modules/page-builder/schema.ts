/**
 * @file src/modules/page-builder/schema.ts
 * @purpose Page-Builder Schemas: Zod validation for dynamic homepage PageSection types and JSON configs.
 */

import { z } from "zod";

export const PageSectionTypeSchema = z.enum([
  "HERO_SLIDER",
  "UNIVERSE_QUICK_BAR",
  "TRENDING_CAROUSEL",
  "FEATURED_BUNDLES",
  "FLASH_DEALS",
  "CATEGORY_SPOTLIGHT",
  "BEST_SELLERS",
  "NEW_ARRIVALS",
  "CUSTOMER_SETUPS",
]);

export const PageSectionSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  pageKey: z.string(),
  type: PageSectionTypeSchema,
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  config: z.record(z.unknown()),
});

export type PageSectionType = z.infer<typeof PageSectionTypeSchema>;
export type PageSectionDTO = z.infer<typeof PageSectionSchema>;
