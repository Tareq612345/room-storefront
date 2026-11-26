/**
 * @file src/modules/home-composer/client-api.ts
 * @purpose Isolated Homepage Composer API: reads the 4 isolated Vaults (Universes, Products, Packages, Elements) for Admin composition and serves a strictly self-contained resolved layout to the Storefront Homepage (/).
 */

import {
  ELEMENT_ORGANIZER_PAGE_KEY,
  ElementRegistrySchema,
  buildDefaultElementRegistry,
  type ButtonItem,
  type ElementRegistry,
  type TextBlockItem,
} from "@modules/element-organizer";
import {
  PACKAGE_ORGANIZER_PAGE_KEY,
  PackageRegistrySchema,
  type OrganizedPackage,
} from "@modules/package-organizer";
import {
  PRODUCT_ORGANIZER_PAGE_KEY,
  ProductRegistrySchema,
  type OrganizedProduct,
} from "@modules/product-organizer";
import {
  ORGANIZER_PAGE_KEY as UNIVERSE_ORGANIZER_PAGE_KEY,
  OrganizerRegistrySchema,
  type OrganizedUniverse,
} from "@modules/universe-organizer";
import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  HOME_COMPOSER_LOCAL_STORAGE_KEY,
  HOME_COMPOSER_PAGE_KEY,
  HOME_COMPOSER_RECORD_ID,
  buildInitialHomepageRegistry,
} from "./helpers";
import { HomepageRegistrySchema, type HomeBlock, type HomepageRegistry } from "./schema";

export interface ComposerVaultsData {
  universes: OrganizedUniverse[];
  products: OrganizedProduct[];
  packages: OrganizedPackage[];
  elements: ElementRegistry;
}

export interface ResolvedStorefrontHomepage {
  showStarHeader: boolean;
  starUniverses: OrganizedUniverse[];
  blocks: HomeBlock[];
  vaults: ComposerVaultsData;
}

function cacheHomepageSnapshotLocally(snapshot: ResolvedStorefrontHomepage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HOME_COMPOSER_LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedHomepageSnapshot(): ResolvedStorefrontHomepage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HOME_COMPOSER_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResolvedStorefrontHomepage;
    if (!parsed || !Array.isArray(parsed.blocks) || !parsed.vaults) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchAllVaultsAndComposer(): Promise<{
  storeId: string;
  composerRow: HomepageRegistry | null;
  vaults: ComposerVaultsData;
}> {
  const [sbStores, rows] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
    sbSelect<{ pageKey: string; config: unknown }>(
      "page_sections",
      `select=pageKey,config&pageKey=in.(${[
        HOME_COMPOSER_PAGE_KEY,
        UNIVERSE_ORGANIZER_PAGE_KEY,
        PRODUCT_ORGANIZER_PAGE_KEY,
        PACKAGE_ORGANIZER_PAGE_KEY,
        ELEMENT_ORGANIZER_PAGE_KEY,
      ]
        .map(encodeURIComponent)
        .join(",")})`
    ),
  ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";

  const findCfg = (key: string) => rows.find((r) => r.pageKey === key)?.config;

  const uParsed = OrganizerRegistrySchema.safeParse(findCfg(UNIVERSE_ORGANIZER_PAGE_KEY));
  const pParsed = ProductRegistrySchema.safeParse(findCfg(PRODUCT_ORGANIZER_PAGE_KEY));
  const kParsed = PackageRegistrySchema.safeParse(findCfg(PACKAGE_ORGANIZER_PAGE_KEY));
  const eParsed = ElementRegistrySchema.safeParse(findCfg(ELEMENT_ORGANIZER_PAGE_KEY));
  const hParsed = HomepageRegistrySchema.safeParse(findCfg(HOME_COMPOSER_PAGE_KEY));

  const vaults: ComposerVaultsData = {
    universes: uParsed.success
      ? [...uParsed.data.universes].sort((a, b) => a.sortOrder - b.sortOrder)
      : [],
    products: pParsed.success
      ? [...pParsed.data.products].sort((a, b) => a.sortOrder - b.sortOrder)
      : [],
    packages: kParsed.success
      ? [...kParsed.data.packages].sort((a, b) => a.sortOrder - b.sortOrder)
      : [],
    elements: eParsed.success ? eParsed.data : buildDefaultElementRegistry(),
  };

  return {
    storeId,
    composerRow: hParsed.success ? hParsed.data : null,
    vaults,
  };
}

export async function saveIsolatedHomepageRegistry(params: {
  storeId: string;
  registry: HomepageRegistry;
}): Promise<boolean> {
  const validated = HomepageRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });

  const nowIso = new Date().toISOString();
  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(HOME_COMPOSER_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: nowIso,
    }
  );
  if (patched.length > 0) {
    // Clear storefront cache so next homepage view reflects latest immediately
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(HOME_COMPOSER_LOCAL_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    return true;
  }

  await sbInsert("page_sections", {
    id: HOME_COMPOSER_RECORD_ID,
    storeId: params.storeId,
    pageKey: HOME_COMPOSER_PAGE_KEY,
    type: "HERO_SLIDER",
    title: "Isolated Homepage Composer Layout",
    subtitle: "Standalone Homepage Composer Registry",
    sortOrder: 9995,
    isVisible: false,
    config: validated,
    updatedAt: nowIso,
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(HOME_COMPOSER_LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return true;
}

export async function fetchHomeComposerAdminSnapshot(): Promise<{
  storeId: string;
  registry: HomepageRegistry;
  recordExistsInDb: boolean;
  vaults: ComposerVaultsData;
}> {
  const { storeId, composerRow, vaults } = await fetchAllVaultsAndComposer();

  if (composerRow) {
    return {
      storeId,
      registry: composerRow,
      recordExistsInDb: true,
      vaults,
    };
  }

  const seeded = buildInitialHomepageRegistry({
    universeIds: vaults.universes.filter((u) => u.isActive).map((u) => u.id),
    productIds: vaults.products.filter((p) => p.isActive).map((p) => p.id),
    packageIds: vaults.packages.filter((k) => k.isActive).map((k) => k.id),
  });

  return {
    storeId,
    registry: seeded,
    recordExistsInDb: false,
    vaults,
  };
}

/**
 * Storefront Homepage Public Consumer API:
 * Strictly the ONLY read path for `/`. Only items intentionally placed inside
 * Homepage Composer blocks render on `/` (unplaced vault items never leak directly).
 */
export async function fetchResolvedHomepageForStorefront(): Promise<ResolvedStorefrontHomepage> {
  const { composerRow, vaults } = await fetchAllVaultsAndComposer();

  const activeRegistry =
    composerRow ??
    buildInitialHomepageRegistry({
      universeIds: vaults.universes.filter((u) => u.isActive).map((u) => u.id),
      productIds: vaults.products.filter((p) => p.isActive).map((p) => p.id),
      packageIds: vaults.packages.filter((k) => k.isActive).map((k) => k.id),
    });

  // Expose only active items in vaults so paused/disabled items never appear on Storefront
  const activeVaults: ComposerVaultsData = {
    universes: vaults.universes.filter((u) => u.isActive),
    products: vaults.products.filter((p) => p.isActive),
    packages: vaults.packages.filter((k) => k.isActive),
    elements: {
      ...vaults.elements,
      textBlocks: vaults.elements.textBlocks.filter((tb: TextBlockItem) => tb.isActive),
      buttons: vaults.elements.buttons.filter((bt: ButtonItem) => bt.isActive),
    },
  };

  // Star header uses only universes that are active and included in the Composer registry
  const placedUniverseIds = new Set(
    activeRegistry.blocks
      .flatMap((b) => b.items)
      .filter((i) => i.kind === "UNIVERSE_CARD")
      .map((i) => i.refId)
  );
  const starUniverses =
    placedUniverseIds.size > 0
      ? activeVaults.universes.filter((u) => placedUniverseIds.has(u.id))
      : activeVaults.universes;

  const snapshot: ResolvedStorefrontHomepage = {
    showStarHeader: activeRegistry.showStarHeader,
    starUniverses,
    blocks: activeRegistry.blocks
      .filter((b) => b.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    vaults: activeVaults,
  };

  cacheHomepageSnapshotLocally(snapshot);
  return snapshot;
}
