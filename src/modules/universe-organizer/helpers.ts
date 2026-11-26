/**
 * @file src/modules/universe-organizer/helpers.ts
 * @purpose Client-safe constants and pure helper functions for the isolated Admin Universe Organizer.
 */

import {
  OrganizedUniverseSchema,
  OrganizerRegistrySchema,
  SiteOfferBannerSourceSchema,
  type OrganizedUniverse,
  type OrganizerRegistry,
  type SiteOfferBannerSource,
  type SiteProductSource,
} from "./schema";

export const ORGANIZER_PAGE_KEY = "__isolated_universe_organizer_v1__";
export const ORGANIZER_RECORD_ID = "uorg_isolated_registry_v1";
export const ORGANIZER_LOCAL_STORAGE_KEY = "room_isolated_universe_organizer_v1";

interface RawWidgetLike {
  id?: unknown;
  kind?: unknown;
  heading?: unknown;
  body?: unknown;
  ctaLabel?: unknown;
  ctaUrl?: unknown;
  accentColor?: unknown;
  textColor?: unknown;
}

export function extractPromoOffersFromSectionConfigs(
  sections: Array<{
    id: string;
    type: string;
    title: string | null;
    subtitle: string | null;
    config: unknown;
  }>
): SiteOfferBannerSource[] {
  const offers: SiteOfferBannerSource[] = [];

  for (const sec of sections) {
    const cfg =
      sec.config && typeof sec.config === "object"
        ? (sec.config as { widgets?: unknown; accentColor?: unknown })
        : {};
    const widgets = Array.isArray(cfg.widgets) ? (cfg.widgets as RawWidgetLike[]) : [];

    for (const w of widgets) {
      if (w.kind === "PROMO_BANNER" && typeof w.id === "string") {
        offers.push(
          SiteOfferBannerSourceSchema.parse({
            id: `promo_${w.id}`,
            kind: "PROMO_BANNER",
            slug: w.id,
            title:
              typeof w.heading === "string" && w.heading.trim()
                ? w.heading
                : "Midnight Cairo Drop",
            subtitle:
              typeof w.body === "string" && w.body.trim()
                ? w.body
                : "Upgrade your bedroom setup with limited-run textiles.",
            itemCount: null,
            originalPrice: null,
            finalPrice: null,
            savingsAmount: null,
            ctaLabel:
              typeof w.ctaLabel === "string" && w.ctaLabel.trim()
                ? w.ctaLabel
                : "Claim Yours",
            ctaUrl: typeof w.ctaUrl === "string" ? w.ctaUrl : "/universes/cars",
            originalAccentColor:
              typeof w.accentColor === "string" && w.accentColor.trim()
                ? w.accentColor
                : "#c94b99",
            textColor: typeof w.textColor === "string" ? w.textColor : "#ffffff",
            universeSlug: null,
          })
        );
      }
    }

    if (sec.type === "FLASH_DEALS") {
      offers.push(
        SiteOfferBannerSourceSchema.parse({
          id: `section_${sec.id}`,
          kind: "PROMO_BANNER",
          slug: sec.id,
          title: sec.title || "Midnight Flash Deals",
          subtitle: sec.subtitle || "Limited-time storefront offer section",
          itemCount: null,
          originalPrice: null,
          finalPrice: null,
          savingsAmount: null,
          ctaLabel: "Explore Deals",
          ctaUrl: "/",
          originalAccentColor:
            typeof cfg.accentColor === "string" && cfg.accentColor.trim()
              ? cfg.accentColor
              : "#d92323",
          textColor: "#ffffff",
          universeSlug: null,
        })
      );
    }
  }

  return offers;
}

export function buildInitialRegistryFromSources(params: {
  universes: Array<{
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    accentColor: string;
    bannerUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
  products: SiteProductSource[];
  offers: SiteOfferBannerSource[];
}): OrganizerRegistry {
  const now = new Date().toISOString();

  const organized: OrganizedUniverse[] = params.universes.map((u, idx) => {
    const matchingProductIds = params.products
      .filter((p) => p.universeId === u.id || p.universeSlug === u.slug)
      .map((p) => p.id);

    const matchingOfferIds = params.offers
      .filter((o) => o.universeSlug === u.slug)
      .map((o) => o.id);

    return OrganizedUniverseSchema.parse({
      id: `uorg_${u.slug}_${u.id}`,
      slug: u.slug,
      name: u.name,
      tagline: u.tagline ?? "",
      description: u.description ?? "",
      accentColor: u.accentColor,
      iconPngUrl: null,
      bannerUrl: u.bannerUrl,
      sortOrder: u.sortOrder || idx + 1,
      isActive: u.isActive,
      productIds: matchingProductIds,
      offerIds: matchingOfferIds,
      createdAt: now,
      updatedAt: now,
    });
  });

  return OrganizerRegistrySchema.parse({
    schemaVersion: 1,
    updatedAt: now,
    universes: organized,
  });
}

export function slugifyUniverseName(raw: string): string {
  const ascii = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `universe-${Date.now().toString(36)}`;
}
