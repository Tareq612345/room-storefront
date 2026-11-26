/**
 * @file src/modules/element-organizer/schema.ts
 * @purpose Zod schemas and TypeScript types for the Isolated Reading Text Blocks & Custom Buttons Organizer (@modules/element-organizer).
 */

import { z } from "zod";

export const TextLineSizeSchema = z.enum(["eyebrow", "title", "subtitle"]);
export type TextLineSize = z.infer<typeof TextLineSizeSchema>;

export const TextAlignSchema = z.enum(["left", "center", "right"]);
export type TextAlign = z.infer<typeof TextAlignSchema>;

export const ButtonPlacementSchema = z.enum([
  "none",
  "bottom-start",
  "bottom-center",
  "bottom-end",
  "top-end",
  "inline-end",
]);
export type ButtonPlacement = z.infer<typeof ButtonPlacementSchema>;

export const ReadingTextLineSchema = z.object({
  id: z.string(),
  text: z.string(),
  size: TextLineSizeSchema.default("subtitle"),
  color: z.string().default("#ffffff"),
});
export type ReadingTextLine = z.infer<typeof ReadingTextLineSchema>;

export const ButtonVariantSchema = z.enum(["solid", "outline", "glass", "glow"]);
export type ButtonVariant = z.infer<typeof ButtonVariantSchema>;

export const ElementBorderRadiusSchema = z.enum(["sharp", "rounded", "pill"]);
export type ElementBorderRadius = z.infer<typeof ElementBorderRadiusSchema>;

export const ButtonSizeSchema = z.enum(["sm", "md", "lg"]);
export type ButtonSize = z.infer<typeof ButtonSizeSchema>;

export const ButtonIconSchema = z.enum(["none", "arrow", "sparkles", "bag"]);
export type ButtonIcon = z.infer<typeof ButtonIconSchema>;

export const ButtonItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  href: z.string().default("/"),
  variant: ButtonVariantSchema.default("solid"),
  bgColor: z.string().default("#c94b99"),
  textColor: z.string().default("#ffffff"),
  borderRadius: ElementBorderRadiusSchema.default("pill"),
  size: ButtonSizeSchema.default("md"),
  icon: ButtonIconSchema.default("arrow"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ButtonItem = z.infer<typeof ButtonItemSchema>;

export const TextBlockItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  align: TextAlignSchema.default("center"),
  lines: z.array(ReadingTextLineSchema).default([]),
  accentColor: z.string().default("#c94b99"),
  bgColor: z.string().default("rgba(0, 0, 0, 0.55)"),
  borderRadius: ElementBorderRadiusSchema.default("rounded"),
  paddingMode: z.enum(["compact", "comfortable"]).default("comfortable"),
  buttonPlacement: ButtonPlacementSchema.default("none"),
  attachedButtonId: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TextBlockItem = z.infer<typeof TextBlockItemSchema>;

export const ElementRegistrySchema = z.object({
  schemaVersion: z.number().int().default(1),
  updatedAt: z.string(),
  textBlocks: z.array(TextBlockItemSchema).default([]),
  buttons: z.array(ButtonItemSchema).default([]),
});
export type ElementRegistry = z.infer<typeof ElementRegistrySchema>;
