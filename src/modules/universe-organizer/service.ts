/**
 * @file src/modules/universe-organizer/service.ts
 * @purpose Self-contained server-side bootstrap service for the isolated Universe Data Manager (zero cross-module dependencies).
 */

import {
  DEFAULT_ORGANIZER_OFFERS,
  DEFAULT_ORGANIZER_PRODUCTS,
  DEFAULT_ORGANIZER_UNIVERSES,
  buildInitialRegistryFromSources,
  extractPromoOffersFromSectionConfigs,
} from "./helpers";
import {
  findActiveStoreForOrganizer,
  findIsolatedOrganizerRecord,
  findReadOnlySiteSnapshot,
} from "./repository";
import {
  OrganizerRegistrySchema,
  SiteOfferBannerSourceSchema,
  SiteProductSourceSchema,
  type SiteOfferBannerSource,
  type SiteProductSource,
  type UniverseOrganizerBootstrap,
} from "./schema";

function computeFinalPrice(params: {
  originalPrice: number;
  pricingType: "FIXED_PRICE" | "PERCENTAGE_DISCOUNT" | "AMOUNT_DISCOUNT";
  fixedPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
}): number {
  if (params.pricingType === "FIXED_PRICE" && params.fixedPrice !== null) {
    return Math.max(0, params.fixedPrice);
  }
  if (params.pricingType === "PERCENTAGE_DISCOUNT" && params.discountPercent !== null) {
    return Math.max(0, params.originalPrice * (1 - params.discountPercent / 100));
  }
  if (params.pricingType === "AMOUNT_DISCOUNT" && params.discountAmount !== null) {
    return Math.max(0, params.originalPrice - params.discountAmount);
  }
  return params.originalPrice;
}

export async function getUniverseOrganizerBootstrap(): Promise<UniverseOrganizerBootstrap> {
  try {
    const dbStore = await findActiveStoreForOrganizer("room-egypt");
    const storeId = dbStore?.id ?? "store_room_egypt";
    const [existingRecord, snapshot] = await Promise.all([
      findIsolatedOrganizerRecord(storeId),
      findReadOnlySiteSnapshot(storeId),
    ]);

    if (snapshot.products.length > 0 || snapshot.universes.length > 0) {
      const products: SiteProductSource[] = snapshot.products.map((p) => {
        const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
        return SiteProductSourceSchema.parse({
          id: p.id,
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          basePrice: Number(p.basePrice),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          thumbnailUrl: p.thumbnailUrl,
          universeId: p.universeId,
          universeSlug: p.universe.slug,
          originalAccentColor: p.universe.accentColor,
          isNewArrival: p.isNewArrival,
          totalStock,
          isVaulted: totalStock <= 0,
        });
      });

      const loadoutOffers: SiteOfferBannerSource[] = snapshot.bundles.map((b) => {
        const originalPrice = b.items.reduce(
          (sum, item) => sum + Number(item.product.basePrice) * item.quantity,
          0
        );
        const finalPrice = computeFinalPrice({
          originalPrice,
          pricingType: b.pricingType,
          fixedPrice: b.fixedPrice ? Number(b.fixedPrice) : null,
          discountPercent: b.discountPercent,
          discountAmount: b.discountAmount ? Number(b.discountAmount) : null,
        });
        const effectiveOriginal =
          originalPrice > finalPrice ? originalPrice : finalPrice + 450;

        return SiteOfferBannerSourceSchema.parse({
          id: b.id,
          kind: "LOADOUT",
          slug: b.slug,
          title: b.name,
          subtitle: b.tagline,
          itemCount: b.items.length || 3,
          originalPrice: effectiveOriginal,
          finalPrice,
          savingsAmount: Math.max(0, effectiveOriginal - finalPrice),
          ctaLabel: "Add to Room",
          ctaUrl: b.universe?.slug ? `/universes/${b.universe.slug}` : "/",
          originalAccentColor: b.universe?.accentColor ?? "#c94b99",
          textColor: "#ffffff",
          universeSlug: b.universe?.slug ?? null,
        });
      });

      const promoOffers = extractPromoOffersFromSectionConfigs(snapshot.homeSections);
      const offers = [...loadoutOffers, ...promoOffers];

      const parsedExisting = existingRecord
        ? OrganizerRegistrySchema.safeParse(existingRecord.config)
        : null;

      return {
        storeId,
        hasPersistedRecord: Boolean(parsedExisting?.success),
        initialRegistry: parsedExisting?.success
          ? parsedExisting.data
          : buildInitialRegistryFromSources({
              universes: snapshot.universes,
              products,
              offers,
            }),
        initialProducts: products,
        initialOffers: offers,
      };
    }
  } catch {
    // Static build without DATABASE_URL uses clean self-contained fallback defaults
  }

  return {
    storeId: "store_room_egypt",
    hasPersistedRecord: false,
    initialRegistry: buildInitialRegistryFromSources({
      universes: DEFAULT_ORGANIZER_UNIVERSES,
      products: DEFAULT_ORGANIZER_PRODUCTS,
      offers: DEFAULT_ORGANIZER_OFFERS,
    }),
    initialProducts: DEFAULT_ORGANIZER_PRODUCTS,
    initialOffers: DEFAULT_ORGANIZER_OFFERS,
  };
}
