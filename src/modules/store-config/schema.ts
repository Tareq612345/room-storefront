import { z } from "zod";

export const StoreThemeTokensSchema = z.object({
  bgPrimary: z.string().default("#05030a"),
  bgSecondary: z.string().default("#0b0617"),
  bgElevated: z.string().default("#140b29"),
  defaultAccent: z.string().default("#c94b99"),
});

export const StoreConfigSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  currency: z.string().default("EGP"),
  defaultAccentColor: z.string().default("#c94b99"),
  themeTokens: StoreThemeTokensSchema,
  whatsappNumber: z.string().nullable(),
  supportEmail: z.string().nullable(),
  isActive: z.boolean(),
});

export type StoreThemeTokens = z.infer<typeof StoreThemeTokensSchema>;
export type StoreConfigDTO = z.infer<typeof StoreConfigSchema>;
