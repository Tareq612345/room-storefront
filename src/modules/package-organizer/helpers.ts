/**
 * @file src/modules/package-organizer/helpers.ts
 * @purpose Client-safe constants, route helpers, and default Package/Collection seeds for the isolated Package Data Manager.
 */

import {
  OrganizedPackageSchema,
  PackageRegistrySchema,
  type OrganizedPackage,
  type PackageRegistry,
  type PackageSpecItem,
} from "./schema";

export const PACKAGE_ORGANIZER_PAGE_KEY = "__isolated_package_organizer_v1__";
export const PACKAGE_ORGANIZER_RECORD_ID = "korg_isolated_registry_v1";
export const PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY = "room_isolated_package_organizer_v1";

export function getPackageHref(slug: string): string {
  return `/package/?slug=${encodeURIComponent(slug)}`;
}

export function slugifyPackageName(raw: string): string {
  const ascii = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `collection-${Date.now().toString(36)}`;
}

export function buildDefaultPackageSpecs(kind: "PACKAGE" | "COLLECTION"): PackageSpecItem[] {
  return [
    {
      id: "pspec_theme",
      label: "Curated Domain",
      value: kind === "COLLECTION" ? "Signature Bedroom Collection" : "Complete Room Loadout",
    },
    {
      id: "pspec_delivery",
      label: "Cairo Express",
      value: "1–2 Days Delivery • COD & Online",
    },
  ];
}

export interface PackageSeedInput {
  id: string;
  slug: string;
  kind: "PACKAGE" | "COLLECTION";
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  universeSlug: string | null;
  bannerImageUrl: string;
  heroImageUrl: string;
  originalPrice: number | null;
  finalPrice: number | null;
  productIds: string[];
  isFeatured: boolean;
}

export const DEFAULT_PACKAGE_SEEDS: PackageSeedInput[] = [
  {
    id: "loadout_touge_full",
    slug: "midnight-touge-loadout",
    kind: "PACKAGE",
    name: "Midnight Touge Full Loadout",
    tagline: "Fitted Sheet + Duvet Cover + 2 Apex Pillowcases + LED Strip",
    description:
      "A complete automotive bedroom loadout built around matte obsidian textures and pit-lane crimson accents.",
    accentColor: "#d92323",
    universeSlug: "cars",
    bannerImageUrl: "/mockups/universe-cars.svg",
    heroImageUrl: "/mockups/universe-cars.svg",
    originalPrice: 2850,
    finalPrice: 2350,
    productIds: ["prod_touge_sheet", "prod_apex_gt_throw"],
    isFeatured: true,
  },
  {
    id: "loadout_ranked_arena",
    slug: "obsidian-ranked-loadout",
    kind: "PACKAGE",
    name: "Obsidian Ranked Room Loadout",
    tagline: "Stealth Bedsheet Set + Acoustic Desk Mat + Ambient Glow Bar",
    description:
      "Full battlestation bedding package designed to match dark RGB setups and late-night ranked sessions.",
    accentColor: "#6366f1",
    universeSlug: "gaming",
    bannerImageUrl: "/mockups/universe-gaming.svg",
    heroImageUrl: "/mockups/universe-gaming.svg",
    originalPrice: 2600,
    finalPrice: 2150,
    productIds: ["prod_cyber_grid"],
    isFeatured: true,
  },
  {
    id: "loadout_shonen_realm",
    slug: "neo-tokyo-collector-loadout",
    kind: "COLLECTION",
    name: "Neo-Tokyo Collector Loadout",
    tagline: "Eclipse Sateen Set + Embroidered Throw + Wall Scroll",
    description:
      "Collector anime bedroom collection pairing brushed dark sateen textiles with Neo-Tokyo orchid highlights.",
    accentColor: "#c94b99",
    universeSlug: "anime",
    bannerImageUrl: "/mockups/universe-anime.svg",
    heroImageUrl: "/mockups/universe-anime.svg",
    originalPrice: 2990,
    finalPrice: 2490,
    productIds: ["prod_shonen_eclipse"],
    isFeatured: true,
  },
];

export function buildInitialPackageRegistry(
  seeds: PackageSeedInput[]
): PackageRegistry {
  const now = new Date().toISOString();

  const packages: OrganizedPackage[] = seeds.map((s, idx) =>
    OrganizedPackageSchema.parse({
      id: s.id,
      slug: s.slug,
      kind: s.kind,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      badgeLabel: s.kind === "COLLECTION" ? "Collection" : "Loadout",
      ctaLabel: s.finalPrice !== null ? "Add to Room" : "Explore Collection",
      accentColor: s.accentColor,
      universeSlug: s.universeSlug,
      bannerImageUrl: s.bannerImageUrl,
      bannerImageFit: "cover",
      bannerImagePosition: "center",
      heroImageUrl: s.heroImageUrl || s.bannerImageUrl,
      pricingMode: s.finalPrice !== null ? "FIXED_PRICE" : "COLLECTION_SHOWCASE",
      originalPrice: s.originalPrice,
      finalPrice: s.finalPrice,
      productIds: s.productIds,
      specs: buildDefaultPackageSpecs(s.kind),
      showProductsInside: true,
      showAddPackBtn: s.finalPrice !== null,
      isFeatured: s.isFeatured,
      isActive: true,
      sortOrder: idx + 1,
      createdAt: now,
      updatedAt: now,
    })
  );

  return PackageRegistrySchema.parse({
    schemaVersion: 1,
    updatedAt: now,
    packages,
  });
}
