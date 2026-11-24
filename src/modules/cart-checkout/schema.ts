/**
 * @file src/modules/cart-checkout/schema.ts
 * @purpose Cart-Checkout Schemas: Zod validation for items inside the My Room bag.
 */

import { z } from "zod";

export const RoomBagItemSchema = z.object({
  id: z.string(),
  itemType: z.enum(["PRODUCT", "BUNDLE"]),
  title: z.string(),
  subtitle: z.string().nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  accentColor: z.string(),
  imageUrl: z.string().optional(),
});

export type RoomBagItem = z.infer<typeof RoomBagItemSchema>;
