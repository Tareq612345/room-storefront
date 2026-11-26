/**
 * @file src/modules/universe-organizer/service.ts
 * @purpose Server-side bootstrap service for the isolated Admin Universe Organizer (reads initial site snapshot & existing isolated record via repository).
 */

import { computeBundleFinalPrice, listFeaturedLoadouts } from "@modules/bundles";
import { listFreshDrops } from "@modules/catalog";
import { getActiveStoreConfig } from "@modules/store-config";
import { listStoreUniverses } from "@modules/universes";
import {
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

export async function getUniverseOrganizerBootstrap(): Promise<UniverseOrganizerBootstrap> {
  const fallbackStore = await getActiveStoreConfig();

  try {
    const dbStore = await findActiveStoreForOrganizer("room-egypt");
    const storeId = dbStore?.id ?? fallbackStore.id;
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
        const finalPrice = computeBundleFinalPrice({
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
    // Static build without live DB connection falls back to module services
  }

  const [fallbackUniverses, fallbackProducts, fallbackLoadouts] = await Promise.all([
    listStoreUniverses(fallbackStore.id),
    listFreshDrops(fallbackStore.id, 20),
    listFeaturedLoadouts(fallbackStore.id, 20),
  ]);

  const products: SiteProductSource[] = fallbackProducts.map((p) =>
    SiteProductSourceSchema.parse({
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      thumbnailUrl: p.thumbnailUrl,
      universeId: p.universeId,
      universeSlug: p.universeSlug,
      originalAccentColor: p.universeAccentColor,
      isNewArrival: p.isNewArrival,
      totalStock: p.totalStock,
      isVaulted: p.isVaulted,
    })
  );

  const offers: SiteOfferBannerSource[] = fallbackLoadouts.map((l) =>
    SiteOfferBannerSourceSchema.parse({
      id: l.id,
      kind: "LOADOUT",
      slug: l.slug,
      title: l.name,
      subtitle: l.tagline,
      itemCount: l.itemCount,
      originalPrice: l.originalPrice,
      finalPrice: l.finalPrice,
      savingsAmount: l.savingsAmount,
      ctaLabel: "Add to Room",
      ctaUrl: l.universeSlug ? `/universes/${l.universeSlug}` : "/",
      originalAccentColor: l.universeAccentColor,
      textColor: "#ffffff",
      universeSlug: l.universeSlug,
    })
  );

  return {
    storeId: fallbackStore.id,
    hasPersistedRecord: false,
    initialRegistry: buildInitialRegistryFromSources({
      universes: fallbackUniverses,
      products,
      offers,
    }),
    initialProducts: products,
    initialOffers: offers,
  };
}
