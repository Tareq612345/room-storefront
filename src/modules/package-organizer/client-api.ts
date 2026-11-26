/**
 * @file src/modules/package-organizer/client-api.ts
 * @purpose Isolated Packages & Collections Data Manager public client API: manages outer banner image, inner large hero image, and member products in an isolated Supabase record.
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  DEFAULT_PACKAGE_SEEDS,
  PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY,
  PACKAGE_ORGANIZER_PAGE_KEY,
  PACKAGE_ORGANIZER_RECORD_ID,
  buildInitialPackageRegistry,
} from "./helpers";
import {
  PackageRegistrySchema,
  type OrganizedPackage,
  type PackageRegistry,
} from "./schema";

function cachePackageRegistryLocally(registry: PackageRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY,
      JSON.stringify(registry)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedOrganizerPackages(): OrganizedPackage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = PackageRegistrySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return parsed.data.packages
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return null;
  }
}

export async function saveIsolatedPackageRegistry(params: {
  storeId: string;
  registry: PackageRegistry;
  recordExistsInDb?: boolean;
}): Promise<boolean> {
  const validated = PackageRegistrySchema.parse(params.registry);
  cachePackageRegistryLocally(validated);

  const nowIso = new Date().toISOString();
  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(PACKAGE_ORGANIZER_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: nowIso,
    }
  );
  if (patched.length > 0) {
    return true;
  }

  await sbInsert("page_sections", {
    id: PACKAGE_ORGANIZER_RECORD_ID,
    storeId: params.storeId,
    pageKey: PACKAGE_ORGANIZER_PAGE_KEY,
    type: "FEATURED_BUNDLES",
    title: "Isolated Package & Collection Organizer Data",
    subtitle: "Standalone Package Organizer Registry",
    sortOrder: 9997,
    isVisible: false,
    config: validated,
    updatedAt: nowIso,
  });
  return true;
}

export async function fetchPackageOrganizerSnapshot(): Promise<{
  storeId: string;
  registry: PackageRegistry;
  recordExistsInDb: boolean;
}> {
  const [sbStores, sbIsolated] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(PACKAGE_ORGANIZER_PAGE_KEY)}`
    ),
  ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";

  const isolatedRow = sbIsolated[0];
  if (isolatedRow) {
    const parsed = PackageRegistrySchema.safeParse(isolatedRow.config);
    if (parsed.success) {
      cachePackageRegistryLocally(parsed.data);
      return {
        storeId,
        registry: parsed.data,
        recordExistsInDb: true,
      };
    }
  }

  const seeded = buildInitialPackageRegistry(DEFAULT_PACKAGE_SEEDS);
  cachePackageRegistryLocally(seeded);

  return {
    storeId,
    registry: seeded,
    recordExistsInDb: false,
  };
}

/**
 * Storefront & Consumer Read API: returns active Packages & Collections from the isolated Data Manager.
 */
export async function fetchResolvedPackagesForStorefront(): Promise<OrganizedPackage[]> {
  const snapshot = await fetchPackageOrganizerSnapshot();
  return snapshot.registry.packages
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Storefront & Consumer Read API: returns a single active Package/Collection by slug.
 */
export async function fetchResolvedPackageDetail(
  slug: string
): Promise<OrganizedPackage | null> {
  const snapshot = await fetchPackageOrganizerSnapshot();
  return (
    snapshot.registry.packages.find((p) => p.slug === slug && p.isActive) ?? null
  );
}
