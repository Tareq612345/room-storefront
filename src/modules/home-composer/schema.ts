/**
 * @file src/modules/home-composer/schema.ts
 * @purpose Zod schemas and TypeScript types for the Isolated Homepage Composer (@modules/home-composer).
 */

import { z } from "zod";

export const PlacedItemKindSchema = z.enum([
  "UNIVERSE_CARD",
  "PRODUCT_CARD",
  "PACKAGE_CARD",
  "TEXT_BLOCK",
  "BUTTON",
  "DIVIDER",
]);
export type PlacedItemKind = z.infer<typeof PlacedItemKindSchema>;

export const ItemWidthSchema = z.enum([
  "auto",
  "fit",
  "1/3",
  "1/2",
  "2/3",
  "full",
]);
export type ItemWidth = z.infer<typeof ItemWidthSchema>;

export const ItemAlignSchema = z.enum(["start", "center", "end"]);
export type ItemAlign = z.infer<typeof ItemAlignSchema>;

export const DividerStyleConfigSchema = z.object({
  label: z.string().default(""),
  color: z.string().default("#ffffff"),
  thickness: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  width: z.enum(["full", "3/4", "1/2", "1/3"]).default("full"),
  style: z.enum(["glow", "solid", "dashed"]).default("glow"),
  align: z.enum(["left", "center", "right"]).default("center"),
});
export type DividerStyleConfig = z.infer<typeof DividerStyleConfigSchema>;

export const BlockPlacedItemSchema = z.object({
  id: z.string(),
  kind: PlacedItemKindSchema,
  refId: z.string(),
  width: ItemWidthSchema.default("auto"),
  align: ItemAlignSchema.default("center"),
  dividerConfig: DividerStyleConfigSchema.optional(),
});
export type BlockPlacedItem = z.infer<typeof BlockPlacedItemSchema>;

export const MobileColsSchema = z.union([
  z.literal("auto"),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type MobileCols = z.infer<typeof MobileColsSchema>;

export const DesktopColsSchema = z.union([
  z.literal("auto"),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export type DesktopCols = z.infer<typeof DesktopColsSchema>;

export const HomeBlockSchema = z.object({
  id: z.string(),
  internalName: z.string().default("Untitled Block"),
  eyebrow: z.string().default(""),
  eyebrowColor: z.string().default("#c94b99"),
  title: z.string().default(""),
  titleColor: z.string().default("#ffffff"),
  subtitle: z.string().default(""),
  headerAlign: z.enum(["left", "center", "right"]).default("left"),
  startDirection: z.enum(["ltr", "rtl"]).default("ltr"),
  mobileCols: MobileColsSchema.default("auto"),
  desktopCols: DesktopColsSchema.default("auto"),
  gridAlign: z.enum(["center", "start"]).default("center"),
  gap: z.enum(["sm", "md", "lg"]).default("md"),
  paddingY: z.enum(["sm", "md", "lg"]).default("md"),
  containerWidth: z.enum(["narrow", "standard", "wide", "full"]).default("standard"),
  bgColor: z.string().default("transparent"),
  borderRadius: z.enum(["sharp", "rounded", "pill"]).default("rounded"),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  items: z.array(BlockPlacedItemSchema).default([]),
});
export type HomeBlock = z.infer<typeof HomeBlockSchema>;

export const HomepageRegistrySchema = z.object({
  schemaVersion: z.number().int().default(1),
  updatedAt: z.string(),
  showStarHeader: z.boolean().default(true),
  blocks: z.array(HomeBlockSchema).default([]),
});
export type HomepageRegistry = z.infer<typeof HomepageRegistrySchema>;
