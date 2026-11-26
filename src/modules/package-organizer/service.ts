/**
 * @file src/modules/package-organizer/service.ts
 * @purpose Self-contained server-side bootstrap service for the isolated Packages & Collections Data Manager.
 */

import {
  DEFAULT_PACKAGE_SEEDS,
  buildInitialPackageRegistry,
  type PackageSeedInput,
} from "./helpers";
import {
  findActiveStoreForPackageOrganizer,
  findIsolatedPackageOrganizerRecord,
  findReadOnlyBundlesSnapshot,
} from "./repository";
import { PackageRegistrySchema, type PackageOrganizerBootstrap } from "./schema";

export async function getPackageOrganizerBootstrap(): Promise<PackageOrganizerBootstrap> {
  try {
    const store = await findActiveStoreForPackageOrganizer("room-egypt");
    const storeId = store?.id ?? "store_room_egypt";
    const [existingRecord, rows] = await Promise.all([
      findIsolatedPackageOrganizerRecord(storeId),
      findReadOnlyBundlesSnapshot(storeId),
    ]);

    const parsedExisting = existingRecord
      ? PackageRegistrySchema.safeParse(existingRecord.config)
      : null;

    if (parsedExisting?.success) {
      return {
        storeId,
        hasPersistedRecord: true,
        initialRegistry: parsedExisting.data,
      };
    }

    if (rows.length > 0) {
      const seeds: PackageSeedInput[] = rows.map((r) => {
        const originalPrice = r.items.reduce(
          (sum, it) => sum + Number(it.product.basePrice),
          0
        );
        const finalPrice = r.fixedPrice ? Number(r.fixedPrice) : originalPrice;
        return {
          id: r.id,
          slug: r.slug,
          kind: "PACKAGE",
          name: r.name,
          tagline: r.tagline ?? "",
          description: r.description ?? (r.tagline || r.name),
          accentColor: r.universe?.accentColor ?? "#c94b99",
          universeSlug: r.universe?.slug ?? null,
          bannerImageUrl: r.thumbnailUrl,
          heroImageUrl: r.bannerUrl || r.thumbnailUrl,
          originalPrice:
            originalPrice > finalPrice ? originalPrice : finalPrice + 450,
          finalPrice,
          productIds: r.items.map((it) => it.product.id),
          isFeatured: r.isFeatured,
        };
      });

      return {
        storeId,
        hasPersistedRecord: false,
        initialRegistry: buildInitialPackageRegistry(seeds),
      };
    }
  } catch {
    // Static build without DATABASE_URL uses local seeds
  }

  return {
    storeId: "store_room_egypt",
    hasPersistedRecord: false,
    initialRegistry: buildInitialPackageRegistry(DEFAULT_PACKAGE_SEEDS),
  };
}
