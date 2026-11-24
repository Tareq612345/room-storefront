import { ProductSummarySchema, type ProductSummaryDTO } from "./schema";
import {
  findNewArrivalProducts,
  findProductsByUniverseSlug,
} from "./repository";

const FALLBACK_PRODUCTS: ProductSummaryDTO[] = [
  {
    id: "prod_touge_sheet",
    storeId: "store_room_egypt",
    universeId: "univ_cars",
    universeSlug: "cars",
    universeAccentColor: "#d92323",
    slug: "midnight-touge-bedsheet",
    name: "Midnight Touge Carbon Bedsheet",
    subtitle: "300TC Matte Obsidian Cotton • Pit-Lane Red Piping",
    basePrice: 1450,
    compareAtPrice: 1750,
    thumbnailUrl: "",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    totalStock: 18,
    isVaulted: false,
    defaultVariantId: "var_touge_king",
  },
  {
    id: "prod_cyber_grid",
    storeId: "store_room_egypt",
    universeId: "univ_gaming",
    universeSlug: "gaming",
    universeAccentColor: "#6366f1",
    slug: "obsidian-ranked-bedsheet",
    name: "Obsidian Ranked Arena Bedsheet",
    subtitle: "Stealth Micro-Weave • Indigo Stitch Matrix",
    basePrice: 1390,
    compareAtPrice: null,
    thumbnailUrl: "",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    totalStock: 12,
    isVaulted: false,
    defaultVariantId: "var_cyber_king",
  },
  {
    id: "prod_shonen_eclipse",
    storeId: "store_room_egypt",
    universeId: "univ_anime",
    universeSlug: "anime",
    universeAccentColor: "#c94b99",
    slug: "neo-tokyo-eclipse-sheet",
    name: "Neo-Tokyo Eclipse Bedsheet",
    subtitle: "Brushed Dark Sateen • Orchid Embroidered Crest",
    basePrice: 1550,
    compareAtPrice: 1890,
    thumbnailUrl: "",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    totalStock: 9,
    isVaulted: false,
    defaultVariantId: "var_eclipse_king",
  },
  {
    id: "prod_apex_gt_throw",
    storeId: "store_room_egypt",
    universeId: "univ_cars",
    universeSlug: "cars",
    universeAccentColor: "#d92323",
    slug: "apex-gt-pillow-set",
    name: "Apex GT Twin Pillowcase Pair",
    subtitle: "Limited Cairo Drop • Heavyweight Weave",
    basePrice: 590,
    compareAtPrice: null,
    thumbnailUrl: "",
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    totalStock: 0,
    isVaulted: true,
    defaultVariantId: "var_apex_std",
  },
];

export async function listFreshDrops(
  storeId: string,
  limit = 4
): Promise<ProductSummaryDTO[]> {
  try {
    const rows = await findNewArrivalProducts(storeId, limit);
    if (rows.length === 0) {
      return FALLBACK_PRODUCTS.slice(0, limit).map((p) => ({ ...p, storeId }));
    }

    return rows.map((row) => {
      const totalStock = row.variants.reduce((sum, v) => sum + v.stock, 0);
      const defaultVariant = row.variants[0] ?? null;

      return ProductSummarySchema.parse({
        id: row.id,
        storeId: row.storeId,
        universeId: row.universeId,
        universeSlug: row.universe.slug,
        universeAccentColor: row.universe.accentColor,
        slug: row.slug,
        name: row.name,
        subtitle: row.subtitle,
        basePrice: Number(row.basePrice),
        compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
        thumbnailUrl: row.thumbnailUrl,
        isFeatured: row.isFeatured,
        isNewArrival: row.isNewArrival,
        isBestSeller: row.isBestSeller,
        totalStock,
        isVaulted: totalStock <= 0,
        defaultVariantId: defaultVariant?.id ?? null,
      });
    });
  } catch {
    return FALLBACK_PRODUCTS.slice(0, limit).map((p) => ({ ...p, storeId }));
  }
}

export async function listProductsByUniverse(
  storeId: string,
  universeSlug: string
): Promise<ProductSummaryDTO[]> {
  try {
    const rows = await findProductsByUniverseSlug(storeId, universeSlug);
    if (rows.length > 0) {
      return rows.map((row) => {
        const totalStock = row.variants.reduce((sum, v) => sum + v.stock, 0);
        const defaultVariant = row.variants[0] ?? null;

        return ProductSummarySchema.parse({
          id: row.id,
          storeId: row.storeId,
          universeId: row.universeId,
          universeSlug: row.universe.slug,
          universeAccentColor: row.universe.accentColor,
          slug: row.slug,
          name: row.name,
          subtitle: row.subtitle,
          basePrice: Number(row.basePrice),
          compareAtPrice: row.compareAtPrice
            ? Number(row.compareAtPrice)
            : null,
          thumbnailUrl: row.thumbnailUrl,
          isFeatured: row.isFeatured,
          isNewArrival: row.isNewArrival,
          isBestSeller: row.isBestSeller,
          totalStock,
          isVaulted: totalStock <= 0,
          defaultVariantId: defaultVariant?.id ?? null,
        });
      });
    }
  } catch {
    // Fallback below
  }

  return FALLBACK_PRODUCTS.filter((p) => p.universeSlug === universeSlug).map(
    (p) => ({ ...p, storeId })
  );
}
