/**
 * @file src/modules/product-organizer/helpers.ts
 * @purpose Client-safe constants, route helpers, default product snapshots, and normalization utilities for the isolated Product Data Manager.
 */

import {
  OrganizedProductSchema,
  ProductRegistrySchema,
  type OrganizedProduct,
  type ProductRegistry,
  type ProductSpecItem,
} from "./schema";

export const PRODUCT_ORGANIZER_PAGE_KEY = "__isolated_product_organizer_v1__";
export const PRODUCT_ORGANIZER_RECORD_ID = "porg_isolated_registry_v1";
export const PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY = "room_isolated_product_organizer_v1";

export function getProductHref(slug: string): string {
  return `/product/?slug=${encodeURIComponent(slug)}`;
}

export function slugifyProductName(raw: string): string {
  const ascii = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `product-${Date.now().toString(36)}`;
}

export function buildDefaultSpecs(subtitle?: string | null): ProductSpecItem[] {
  return [
    {
      id: "spec_material",
      label: "Fabric & Feel",
      value: subtitle?.trim() || "300TC Luxury Matte Dark Cotton",
    },
    {
      id: "spec_size",
      label: "Size Coverage",
      value: "King (240 × 220 cm) + 2 Pillowcases",
    },
    {
      id: "spec_care",
      label: "Care Guide",
      value: "Machine wash cold • Fade-resistant print",
    },
    {
      id: "spec_delivery",
      label: "Cairo Delivery",
      value: "1–2 Days Express • COD & Online",
    },
  ];
}

export interface ProductSeedInput {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  thumbnailUrl: string;
  images: string[];
  universeSlug: string;
  accentColor: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  stock: number;
}

export const DEFAULT_PRODUCT_SEEDS: ProductSeedInput[] = [
  {
    id: "prod_touge_sheet",
    slug: "midnight-touge-bedsheet",
    name: "Midnight Touge Carbon Bedsheet",
    subtitle: "300TC Matte Obsidian Cotton • Pit-Lane Red Piping",
    description:
      "Engineered for Cairo car enthusiasts: deep matte obsidian cotton with precision pit-lane crimson piping that upgrades your bedroom into a midnight garage showcase.",
    basePrice: 1450,
    compareAtPrice: 1750,
    thumbnailUrl: "/mockups/products/sheet-midnight-touge.svg",
    images: ["/mockups/products/sheet-midnight-touge.svg"],
    universeSlug: "cars",
    accentColor: "#d92323",
    isNewArrival: true,
    isFeatured: true,
    stock: 18,
  },
  {
    id: "prod_cyber_grid",
    slug: "obsidian-ranked-bedsheet",
    name: "Obsidian Ranked Arena Bedsheet",
    subtitle: "Stealth Micro-Weave • Indigo Stitch Matrix",
    description:
      "Sleek dark-mode micro-weave bedsheet crafted to blend seamlessly with RGB battlestations, dual-monitor desks, and late-night ranked sessions.",
    basePrice: 1390,
    compareAtPrice: null,
    thumbnailUrl: "/mockups/products/sheet-obsidian-ranked.svg",
    images: ["/mockups/products/sheet-obsidian-ranked.svg"],
    universeSlug: "gaming",
    accentColor: "#6366f1",
    isNewArrival: true,
    isFeatured: true,
    stock: 12,
  },
  {
    id: "prod_shonen_eclipse",
    slug: "neo-tokyo-eclipse-sheet",
    name: "Neo-Tokyo Eclipse Bedsheet",
    subtitle: "Brushed Dark Sateen • Orchid Embroidered Crest",
    description:
      "Signature brushed dark sateen with a minimalist Neo-Tokyo orchid crest, delivering ultra-soft comfort and collector-grade presence.",
    basePrice: 1550,
    compareAtPrice: 1890,
    thumbnailUrl: "/mockups/products/sheet-neo-tokyo.svg",
    images: ["/mockups/products/sheet-neo-tokyo.svg"],
    universeSlug: "anime",
    accentColor: "#c94b99",
    isNewArrival: true,
    isFeatured: true,
    stock: 9,
  },
  {
    id: "prod_apex_gt_throw",
    slug: "apex-gt-pillow-set",
    name: "Apex GT Twin Pillowcase Pair",
    subtitle: "Limited Cairo Drop • Heavyweight Weave",
    description:
      "Heavyweight twin pillowcase pair with crisp obsidian finish and signature embroidered trim for daily comfort.",
    basePrice: 590,
    compareAtPrice: null,
    thumbnailUrl: "/mockups/products/pillows-apex-gt.svg",
    images: ["/mockups/products/pillows-apex-gt.svg"],
    universeSlug: "cars",
    accentColor: "#d92323",
    isNewArrival: true,
    isFeatured: false,
    stock: 10,
  },
];

export function buildInitialProductRegistry(
  seeds: ProductSeedInput[]
): ProductRegistry {
  const now = new Date().toISOString();

  const products: OrganizedProduct[] = seeds.map((s, idx) => {
    const gallery = s.images.length > 0 ? s.images : [s.thumbnailUrl];
    const vaulted = s.stock <= 0;

    return OrganizedProductSchema.parse({
      id: s.id,
      slug: s.slug,
      name: s.name,
      subtitle: s.subtitle ?? "",
      badgeLabel: s.isNewArrival ? "Fresh Drop" : "Signature",
      basePrice: s.basePrice,
      compareAtPrice: s.compareAtPrice,
      stock: Math.max(0, s.stock),
      isVaulted: vaulted,
      accentColor: s.accentColor,
      universeSlug: s.universeSlug,
      cardImageUrl: s.thumbnailUrl,
      cardImageFit: "cover",
      cardImagePosition: "center",
      isNewArrival: s.isNewArrival,
      isFeatured: s.isFeatured,
      isActive: true,
      sortOrder: idx + 1,
      galleryImages: gallery,
      description:
        s.description?.trim() ||
        `${s.name} — ${s.subtitle ?? "High-craft dark-mode ROOM textile drop."}`,
      specs: buildDefaultSpecs(s.subtitle),
      detailLayout: "split-gallery",
      showSpecsGrid: true,
      showBuyNowBtn: true,
      addToBagLabel: "Claim Yours",
      buyNowLabel: "Buy Now",
      createdAt: now,
      updatedAt: now,
    });
  });

  return ProductRegistrySchema.parse({
    schemaVersion: 1,
    updatedAt: now,
    products,
  });
}
