import {
  StoreConfigSchema,
  StoreThemeTokensSchema,
  type StoreConfigDTO,
} from "./schema";
import { findActiveStoreBySlug } from "./repository";

const DEFAULT_FALLBACK_STORE: StoreConfigDTO = {
  id: "store_room_egypt",
  slug: "room-egypt",
  name: "ROOM",
  domain: null,
  currency: "EGP",
  defaultAccentColor: "#c94b99",
  themeTokens: {
    bgPrimary: "#05030a",
    bgSecondary: "#0b0617",
    bgElevated: "#140b29",
    defaultAccent: "#c94b99",
  },
  whatsappNumber: "+201000000000",
  supportEmail: "hello@room-eg.com",
  isActive: true,
};

export async function getActiveStoreConfig(
  slug = process.env.NEXT_PUBLIC_DEFAULT_STORE_SLUG ?? "room-egypt"
): Promise<StoreConfigDTO> {
  try {
    const record = await findActiveStoreBySlug(slug);
    if (!record) {
      return DEFAULT_FALLBACK_STORE;
    }

    const parsedTokens = StoreThemeTokensSchema.safeParse(record.themeTokens);

    return StoreConfigSchema.parse({
      id: record.id,
      slug: record.slug,
      name: record.name,
      domain: record.domain,
      currency: record.currency,
      defaultAccentColor: record.defaultAccentColor,
      themeTokens: parsedTokens.success
        ? parsedTokens.data
        : DEFAULT_FALLBACK_STORE.themeTokens,
      whatsappNumber: record.whatsappNumber,
      supportEmail: record.supportEmail,
      isActive: record.isActive,
    });
  } catch {
    // Graceful fallback when PostgreSQL is not yet provisioned locally
    return DEFAULT_FALLBACK_STORE;
  }
}
