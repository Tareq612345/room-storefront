/**
 * @file src/modules/universe-organizer/client-api.ts
 * @purpose Isolated Universe Data Manager public client API: reads/writes the isolated Universe registry and provides final resolved Universe lists, products, and offer banners for the Storefront and future consumers.
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  DEFAULT_ORGANIZER_OFFERS,
  DEFAULT_ORGANIZER_PRODUCTS,
  DEFAULT_ORGANIZER_UNIVERSES,
  ORGANIZER_LOCAL_STORAGE_KEY,
  ORGANIZER_PAGE_KEY,
  ORGANIZER_RECORD_ID,
  buildInitialRegistryFromSources,
  extractPromoOffersFromSectionConfigs,
} from "./helpers";
import {
  OrganizerRegistrySchema,
  type OrganizedUniverse,
  type OrganizerRegistry,
  type ResolvedUniverseDetail,
  type SiteOfferBannerSource,
  type SiteProductSource,
} from "./schema";

interface SbUniverseRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  accentColor: string;
  bannerUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface SbProductRow {
  id: string;
  universeId: string;
  slug: string;
  name: string;
  subtitle: string | null;
  basePrice: number | string;
  compareAtPrice: number | string | null;
  thumbnailUrl: string;
  isNewArrival: boolean;
  isActive: boolean;
}

interface SbVariantRow {
  id: string;
  productId: string;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
}

interface SbBundleRow {
  id: string;
  universeId: string | null;
  slug: string;
  name: string;
  tagline: string | null;
  fixedPrice: number | string | null;
  isActive: boolean;
}

interface SbHomeSectionRow {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  config: unknown;
}

export function getCachedOrganizerUniverses(): OrganizedUniverse[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ORGANIZER_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = OrganizerRegistrySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return parsed.data.universes
      .filter((u) => u.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return null;
  }
}

function cacheRegistryLocally(registry: OrganizerRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORGANIZER_LOCAL_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota errors
  }
}

export async function saveIsolatedRegistry(params: {
  storeId: string;
  registry: OrganizerRegistry;
  recordExistsInDb?: boolean;
}): Promise<boolean> {
  const validated = OrganizerRegistrySchema.parse(params.registry);
  cacheRegistryLocally(validated);

  const nowIso = new Date().toISOString();
  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(ORGANIZER_PAGE_KEY)}`,
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
    id: ORGANIZER_RECORD_ID,
    storeId: params.storeId,
    pageKey: ORGANIZER_PAGE_KEY,
    type: "UNIVERSE_QUICK_BAR",
    title: "Isolated Universe Organizer Data",
    subtitle: "Standalone Universe Organizer Registry",
    sortOrder: 9999,
    isVisible: false,
    config: validated,
    updatedAt: nowIso,
  });
  return true;
}

export async function fetchOrganizerDataSnapshot(): Promise<{
  storeId: string;
  registry: OrganizerRegistry;
  recordExistsInDb: boolean;
  products: SiteProductSource[];
  offers: SiteOfferBannerSource[];
}> {
  const [sbStores, sbIsolated, sbUniverses, sbProducts, sbVariants, sbBundles, sbHomeSections] =
    await Promise.all([
      sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
      sbSelect<{ id: string; config: unknown }>(
        "page_sections",
        `select=id,config&pageKey=eq.${encodeURIComponent(ORGANIZER_PAGE_KEY)}`
      ),
      sbSelect<SbUniverseRow>(
        "universes",
        "select=id,slug,name,tagline,description,accentColor,bannerUrl,sortOrder,isActive&order=sortOrder.asc"
      ),
      sbSelect<SbProductRow>(
        "products",
        "select=id,universeId,slug,name,subtitle,basePrice,compareAtPrice,thumbnailUrl,isNewArrival,isActive&isActive=eq.true&order=createdAt.desc"
      ),
      sbSelect<SbVariantRow>(
        "product_variants",
        "select=id,productId,stock,isDefault,isActive&isActive=eq.true"
      ),
      sbSelect<SbBundleRow>(
        "bundles",
        "select=id,universeId,slug,name,tagline,fixedPrice,isActive&isActive=eq.true&order=createdAt.desc"
      ),
      sbSelect<SbHomeSectionRow>(
        "page_sections",
        "select=id,type,title,subtitle,config&pageKey=eq.home&order=sortOrder.asc"
      ),
    ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";

  const mappedProducts: SiteProductSource[] =
    sbProducts.length > 0
      ? sbProducts.map((p) => {
          const u = sbUniverses.find((un) => un.id === p.universeId);
          const vars = sbVariants.filter((v) => v.productId === p.id);
          const totalStock =
            vars.length > 0
              ? vars.reduce((sum, v) => sum + Number(v.stock), 0)
              : 10;
          const defaultVar = vars.find((v) => v.isDefault) ?? vars[0] ?? null;

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            subtitle: p.subtitle,
            basePrice: Number(p.basePrice),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            thumbnailUrl: p.thumbnailUrl,
            universeId: p.universeId,
            universeSlug: u?.slug ?? "cars",
            originalAccentColor: u?.accentColor ?? "#c94b99",
            isNewArrival: p.isNewArrival,
            totalStock,
            isVaulted: totalStock <= 0,
            defaultVariantId: defaultVar?.id ?? null,
          };
        })
      : DEFAULT_ORGANIZER_PRODUCTS;

  const mappedBundles: SiteOfferBannerSource[] = sbBundles.map((b) => {
    const u = sbUniverses.find((un) => un.id === b.universeId);
    const finalPrice = b.fixedPrice ? Number(b.fixedPrice) : 2190;
    const originalPrice = finalPrice + 450;
    return {
      id: b.id,
      kind: "LOADOUT",
      slug: b.slug,
      title: b.name,
      subtitle: b.tagline,
      itemCount: 3,
      originalPrice,
      finalPrice,
      savingsAmount: Math.max(0, originalPrice - finalPrice),
      ctaLabel: "Add to Room",
      ctaUrl: u?.slug ? `/universes/${u.slug}` : "/",
      originalAccentColor: u?.accentColor ?? "#c94b99",
      textColor: "#ffffff",
      universeSlug: u?.slug ?? null,
    };
  });

  const promoOffers = extractPromoOffersFromSectionConfigs(sbHomeSections);
  const mappedOffers =
    mappedBundles.length > 0 || promoOffers.length > 0
      ? [...mappedBundles, ...promoOffers]
      : DEFAULT_ORGANIZER_OFFERS;

  const isolatedRow = sbIsolated[0];
  if (isolatedRow) {
    const parsed = OrganizerRegistrySchema.safeParse(isolatedRow.config);
    if (parsed.success) {
      cacheRegistryLocally(parsed.data);
      return {
        storeId,
        registry: parsed.data,
        recordExistsInDb: true,
        products: mappedProducts,
        offers: mappedOffers,
      };
    }
  }

  const seeded = buildInitialRegistryFromSources({
    universes: sbUniverses.length > 0 ? sbUniverses : DEFAULT_ORGANIZER_UNIVERSES,
    products: mappedProducts,
    offers: mappedOffers,
  });
  cacheRegistryLocally(seeded);

  return {
    storeId,
    registry: seeded,
    recordExistsInDb: false,
    products: mappedProducts,
    offers: mappedOffers,
  };
}

/**
 * Storefront & Consumer Read API: returns active Universes from the isolated Universe Data Manager.
 */
export async function fetchResolvedUniversesForStorefront(): Promise<OrganizedUniverse[]> {
  const snapshot = await fetchOrganizerDataSnapshot();
  return snapshot.registry.universes
    .filter((u) => u.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Storefront & Consumer Read API: returns a single active Universe by slug along with its assigned site products and offer banners (preserving original item colors).
 */
export async function fetchResolvedUniverseDetail(
  slug: string
): Promise<ResolvedUniverseDetail> {
  const snapshot = await fetchOrganizerDataSnapshot();
  const universe =
    snapshot.registry.universes.find((u) => u.slug === slug && u.isActive) ?? null;

  if (!universe) {
    return { universe: null, products: [], offers: [] };
  }

  const products = snapshot.products.filter((p) => universe.productIds.includes(p.id));
  const offers = snapshot.offers.filter((o) => universe.offerIds.includes(o.id));

  return { universe, products, offers };
}
