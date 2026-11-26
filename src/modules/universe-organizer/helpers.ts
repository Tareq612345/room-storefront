/**
 * @file src/modules/universe-organizer/helpers.ts
 * @purpose Client-safe constants, route helpers, fallback snapshots, and pure normalization helpers for the isolated Universe Data Manager.
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

const STATIC_UNIVERSE_SLUGS = new Set(["cars", "gaming", "anime"]);

export function getUniverseHref(slug: string): string {
  if (STATIC_UNIVERSE_SLUGS.has(slug)) {
    return `/universes/${slug}`;
  }
  return `/universe/?slug=${encodeURIComponent(slug)}`;
}

export function extractSlugFromLocation(pathname: string | null, search: string | null): string | null {
  const pathMatch = pathname?.match(/\/universes\/([^/]+)/);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }
  if (pathname?.includes("/universe") && search) {
    const params = new URLSearchParams(search);
    const qSlug = params.get("slug");
    if (qSlug) return qSlug;
  }
  return null;
}

export const DEFAULT_ORGANIZER_UNIVERSES = [
  {
    id: "univ_cars",
    slug: "cars",
    name: "GARAGE & CARS",
    tagline: "Midnight Touge & Supercar Bedroom Loadouts",
    description:
      "High-craft automotive bedsheets, carbon-inspired textures, and pit-lane ambient setups built for Cairo car heads.",
    accentColor: "#d92323",
    bannerUrl: "/mockups/universe-cars.svg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "univ_gaming",
    slug: "gaming",
    name: "GAMING ARENA",
    tagline: "Obsidian RGB & Next-Gen Battle Stations",
    description:
      "Sleek dark-mode bedsheets and full-room Loadouts engineered to frame your desk, monitor, and late-night ranked grinds.",
    accentColor: "#6366f1",
    bannerUrl: "/mockups/universe-gaming.svg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "univ_anime",
    slug: "anime",
    name: "ANIME REALM",
    tagline: "Shonen Arcs, Katana & Neo-Tokyo Vibes",
    description:
      "Signature anime-inspired bedsheets and collector room Loadouts that transform your space into your favorite arc.",
    accentColor: "#c94b99",
    bannerUrl: "/mockups/universe-anime.svg",
    sortOrder: 3,
    isActive: true,
  },
];

export const DEFAULT_ORGANIZER_PRODUCTS: SiteProductSource[] = [
  {
    id: "prod_touge_sheet",
    slug: "midnight-touge-bedsheet",
    name: "Midnight Touge Carbon Bedsheet",
    subtitle: "300TC Matte Obsidian Cotton • Pit-Lane Red Piping",
    basePrice: 1450,
    compareAtPrice: 1750,
    thumbnailUrl: "/mockups/products/sheet-midnight-touge.svg",
    universeId: "univ_cars",
    universeSlug: "cars",
    originalAccentColor: "#d92323",
    isNewArrival: true,
    totalStock: 18,
    isVaulted: false,
    defaultVariantId: "var_touge_king",
  },
  {
    id: "prod_cyber_grid",
    slug: "obsidian-ranked-bedsheet",
    name: "Obsidian Ranked Arena Bedsheet",
    subtitle: "Stealth Micro-Weave • Indigo Stitch Matrix",
    basePrice: 1390,
    compareAtPrice: null,
    thumbnailUrl: "/mockups/products/sheet-obsidian-ranked.svg",
    universeId: "univ_gaming",
    universeSlug: "gaming",
    originalAccentColor: "#6366f1",
    isNewArrival: true,
    totalStock: 12,
    isVaulted: false,
    defaultVariantId: "var_cyber_king",
  },
  {
    id: "prod_shonen_eclipse",
    slug: "neo-tokyo-eclipse-sheet",
    name: "Neo-Tokyo Eclipse Bedsheet",
    subtitle: "Brushed Dark Sateen • Orchid Embroidered Crest",
    basePrice: 1550,
    compareAtPrice: 1890,
    thumbnailUrl: "/mockups/products/sheet-neo-tokyo.svg",
    universeId: "univ_anime",
    universeSlug: "anime",
    originalAccentColor: "#c94b99",
    isNewArrival: true,
    totalStock: 9,
    isVaulted: false,
    defaultVariantId: "var_eclipse_king",
  },
  {
    id: "prod_apex_gt_throw",
    slug: "apex-gt-pillow-set",
    name: "Apex GT Twin Pillowcase Pair",
    subtitle: "Limited Cairo Drop • Heavyweight Weave",
    basePrice: 590,
    compareAtPrice: null,
    thumbnailUrl: "/mockups/products/pillows-apex-gt.svg",
    universeId: "univ_cars",
    universeSlug: "cars",
    originalAccentColor: "#d92323",
    isNewArrival: true,
    totalStock: 0,
    isVaulted: true,
    defaultVariantId: "var_apex_std",
  },
];

export const DEFAULT_ORGANIZER_OFFERS: SiteOfferBannerSource[] = [
  {
    id: "loadout_touge_full",
    kind: "LOADOUT",
    slug: "midnight-touge-loadout",
    title: "Midnight Touge Full Loadout",
    subtitle: "Fitted Sheet + Duvet Cover + 2 Apex Pillowcases + LED Strip",
    itemCount: 4,
    originalPrice: 2850,
    finalPrice: 2350,
    savingsAmount: 500,
    ctaLabel: "Add to Room",
    ctaUrl: "/universes/cars",
    originalAccentColor: "#d92323",
    textColor: "#ffffff",
    universeSlug: "cars",
  },
  {
    id: "loadout_ranked_arena",
    kind: "LOADOUT",
    slug: "obsidian-ranked-loadout",
    title: "Obsidian Ranked Room Loadout",
    subtitle: "Stealth Bedsheet Set + Acoustic Desk Mat + Ambient Glow Bar",
    itemCount: 3,
    originalPrice: 2600,
    finalPrice: 2150,
    savingsAmount: 450,
    ctaLabel: "Add to Room",
    ctaUrl: "/universes/gaming",
    originalAccentColor: "#6366f1",
    textColor: "#ffffff",
    universeSlug: "gaming",
  },
  {
    id: "loadout_shonen_realm",
    kind: "LOADOUT",
    slug: "neo-tokyo-collector-loadout",
    title: "Neo-Tokyo Collector Loadout",
    subtitle: "Eclipse Sateen Set + Embroidered Throw + Wall Scroll",
    itemCount: 3,
    originalPrice: 2990,
    finalPrice: 2490,
    savingsAmount: 500,
    ctaLabel: "Add to Room",
    ctaUrl: "/universes/anime",
    originalAccentColor: "#c94b99",
    textColor: "#ffffff",
    universeSlug: "anime",
  },
];

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
