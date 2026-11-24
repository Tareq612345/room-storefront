/**
 * @file src/modules/universes/schema.ts
 * @purpose Universes Schemas: Zod validation for UniverseDTO (slug, accentColor, bannerUrl, tagline).
 */

import { z } from "zod";

export const UniverseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string().nullable(),
  description: z.string().nullable(),
  accentColor: z.string(),
  iconUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export type UniverseDTO = z.infer<typeof UniverseSchema>;
