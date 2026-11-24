import { BundleSummarySchema, type BundleSummaryDTO } from "./schema";
import { findFeaturedBundles } from "./repository";

const FALLBACK_LOADOUTS: BundleSummaryDTO[] = [
  {
    id: "loadout_touge_full",
    storeId: "store_room_egypt",
    universeSlug: "cars",
    universeAccentColor: "#d92323",
    slug: "midnight-touge-loadout",
    name: "Midnight Touge Full Loadout",
    tagline: "Fitted Sheet + Duvet Cover + 2 Apex Pillowcases + LED Strip",
    itemCount: 4,
    originalPrice: 2850,
    finalPrice: 2350,
    savingsAmount: 500,
  },
  {
    id: "loadout_ranked_arena",
    storeId: "store_room_egypt",
    universeSlug: "gaming",
    universeAccentColor: "#6366f1",
    slug: "obsidian-ranked-loadout",
    name: "Obsidian Ranked Room Loadout",
    tagline: "Stealth Bedsheet Set + Acoustic Desk Mat + Ambient Glow Bar",
    itemCount: 3,
    originalPrice: 2600,
    finalPrice: 2150,
    savingsAmount: 450,
  },
  {
    id: "loadout_shonen_realm",
    storeId: "store_room_egypt",
    universeSlug: "anime",
    universeAccentColor: "#c94b99",
    slug: "neo-tokyo-collector-loadout",
    name: "Neo-Tokyo Collector Loadout",
    tagline: "Eclipse Sateen Set + Embroidered Throw + Wall Scroll",
    itemCount: 3,
    originalPrice: 2990,
    finalPrice: 2490,
    savingsAmount: 500,
  },
];

export function computeBundleFinalPrice(params: {
  originalPrice: number;
  pricingType: "FIXED_PRICE" | "PERCENTAGE_DISCOUNT" | "AMOUNT_DISCOUNT";
  fixedPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
}): number {
  const { originalPrice, pricingType, fixedPrice, discountPercent, discountAmount } =
    params;

  if (pricingType === "FIXED_PRICE" && fixedPrice !== null) {
    return Math.max(0, fixedPrice);
  }
  if (pricingType === "PERCENTAGE_DISCOUNT" && discountPercent !== null) {
    return Math.max(0, originalPrice * (1 - discountPercent / 100));
  }
  if (pricingType === "AMOUNT_DISCOUNT" && discountAmount !== null) {
    return Math.max(0, originalPrice - discountAmount);
  }
  return originalPrice;
}

export async function listFeaturedLoadouts(
  storeId: string,
  limit = 3
): Promise<BundleSummaryDTO[]> {
  try {
    const rows = await findFeaturedBundles(storeId, limit);
    if (rows.length === 0) {
      return FALLBACK_LOADOUTS.slice(0, limit).map((b) => ({ ...b, storeId }));
    }

    return rows.map((row) => {
      const originalPrice = row.items.reduce((sum, item) => {
        const unit = item.variant
          ? Number(item.variant.price)
          : Number(item.product.basePrice);
        return sum + unit * item.quantity;
      }, 0);

      const finalPrice = computeBundleFinalPrice({
        originalPrice,
        pricingType: row.pricingType,
        fixedPrice: row.fixedPrice ? Number(row.fixedPrice) : null,
        discountPercent: row.discountPercent,
        discountAmount: row.discountAmount ? Number(row.discountAmount) : null,
      });

      return BundleSummarySchema.parse({
        id: row.id,
        storeId: row.storeId,
        universeSlug: row.universe?.slug ?? null,
        universeAccentColor: row.universe?.accentColor ?? "#c94b99",
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        itemCount: row.items.length,
        originalPrice,
        finalPrice,
        savingsAmount: Math.max(0, originalPrice - finalPrice),
      });
    });
  } catch {
    return FALLBACK_LOADOUTS.slice(0, limit).map((b) => ({ ...b, storeId }));
  }
}
