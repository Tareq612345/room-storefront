/**
 * @file src/modules/product-organizer/service.ts
 * @purpose Self-contained server-side bootstrap service for the isolated Product Data Manager (zero cross-module dependencies).
 */

import {
  DEFAULT_PRODUCT_SEEDS,
  buildInitialProductRegistry,
  type ProductSeedInput,
} from "./helpers";
import {
  findActiveStoreForProductOrganizer,
  findIsolatedProductOrganizerRecord,
  findReadOnlyProductsSnapshot,
} from "./repository";
import { ProductRegistrySchema, type ProductOrganizerBootstrap } from "./schema";

export async function getProductOrganizerBootstrap(): Promise<ProductOrganizerBootstrap> {
  try {
    const store = await findActiveStoreForProductOrganizer("room-egypt");
    const storeId = store?.id ?? "store_room_egypt";
    const [existingRecord, rows] = await Promise.all([
      findIsolatedProductOrganizerRecord(storeId),
      findReadOnlyProductsSnapshot(storeId),
    ]);

    const parsedExisting = existingRecord
      ? ProductRegistrySchema.safeParse(existingRecord.config)
      : null;

    if (parsedExisting?.success) {
      return {
        storeId,
        hasPersistedRecord: true,
        initialRegistry: parsedExisting.data,
      };
    }

    if (rows.length > 0) {
      const seeds: ProductSeedInput[] = rows.map((r) => {
        const stock = r.variants.reduce((sum, v) => sum + v.stock, 0);
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          subtitle: r.subtitle,
          description: r.description,
          basePrice: Number(r.basePrice),
          compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : null,
          thumbnailUrl: r.thumbnailUrl,
          images: r.images.length > 0 ? r.images : [r.thumbnailUrl],
          universeSlug: r.universe.slug,
          accentColor: r.universe.accentColor,
          isNewArrival: r.isNewArrival,
          isFeatured: r.isFeatured,
          stock,
        };
      });

      return {
        storeId,
        hasPersistedRecord: false,
        initialRegistry: buildInitialProductRegistry(seeds),
      };
    }
  } catch {
    // Static build without DATABASE_URL uses clean local seeds
  }

  return {
    storeId: "store_room_egypt",
    hasPersistedRecord: false,
    initialRegistry: buildInitialProductRegistry(DEFAULT_PRODUCT_SEEDS),
  };
}
