/**
 * @file src/modules/universe-organizer/client-api.ts
 * @purpose Isolated Universe Data Manager public client API: reads/writes the isolated Universe registry and resolves products, packages/collections, and promo banners for Storefront and Admin consumers.
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

const ISOLATED_PRODUCT_PAGE_KEY = "__isolated_product_organizer_v1__";
const ISOLATED_PACKAGE_PAGE_KEY = "__isolated_package_organizer_v1__";

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

interface RawIsolatedProductConfig {
  products?: Array<{
    id?: unknown;
    slug?: unknown;
    name?: unknown;
    subtitle?: unknown;
    basePrice?: unknown;
    compareAtPrice?: unknown;
    cardImageUrl?: unknown;
    universeSlug?: unknown;
    accentColor?: unknown;
    isNewArrival?: unknown;
    stock?: unknown;
    isVaulted?: unknown;
    isActive?: unknown;
  }>;
}

interface RawIsolatedPackageConfig {
  packages?: Array<{
    id?: unknown;
    slug?: unknown;
    kind?: unknown;
    name?: unknown;
    tagline?: unknown;
    ctaLabel?: unknown;
    accentColor?: unknown;
    universeSlug?: unknown;
    bannerImageUrl?: unknown;
    bannerImageFit?: unknown;
    bannerImagePosition?: unknown;
    pricingMode?: unknown;
    originalPrice?: unknown;
    finalPrice?: unknown;
    productIds?: unknown;
    isActive?: unknown;
  }>;
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
  const [
    sbStores,
    sbIsolated,
    sbIsolatedProducts,
    sbIsolatedPackages,
    sbUniverses,
    sbProducts,
    sbVariants,
    sbBundles,
    sbHomeSections,
  ] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(ORGANIZER_PAGE_KEY)}`
    ),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(ISOLATED_PRODUCT_PAGE_KEY)}`
    ),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(ISOLATED_PACKAGE_PAGE_KEY)}`
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

  // Prefer active products from the isolated Product Organizer when present
  const rawProdCfg = sbIsolatedProducts[0]?.config as RawIsolatedProductConfig | undefined;
  const isolatedProductList = Array.isArray(rawProdCfg?.products)
    ? rawProdCfg.products
    : null;

  const mappedProducts: SiteProductSource[] =
    isolatedProductList && isolatedProductList.length > 0
      ? isolatedProductList
          .filter((p) => p.isActive !== false && typeof p.id === "string")
          .map((p) => {
            const stock = typeof p.stock === "number" ? p.stock : 10;
            return {
              id: String(p.id),
              slug: typeof p.slug === "string" ? p.slug : String(p.id),
              name: typeof p.name === "string" ? p.name : "Product",
              subtitle: typeof p.subtitle === "string" ? p.subtitle : null,
              basePrice: Number(p.basePrice ?? 0),
              compareAtPrice:
                typeof p.compareAtPrice === "number" ? p.compareAtPrice : null,
              thumbnailUrl:
                typeof p.cardImageUrl === "string" ? p.cardImageUrl : "",
              universeId:
                typeof p.universeSlug === "string" ? p.universeSlug : "cars",
              universeSlug:
                typeof p.universeSlug === "string" ? p.universeSlug : "cars",
              originalAccentColor:
                typeof p.accentColor === "string" ? p.accentColor : "#c94b99",
              isNewArrival: Boolean(p.isNewArrival ?? true),
              totalStock: stock,
              isVaulted: Boolean(p.isVaulted) || stock <= 0,
              defaultVariantId: null,
            };
          })
      : sbProducts.length > 0
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

  // Prefer active Packages & Collections from the isolated Package Organizer when present
  const rawPkgCfg = sbIsolatedPackages[0]?.config as RawIsolatedPackageConfig | undefined;
  const isolatedPkgList = Array.isArray(rawPkgCfg?.packages)
    ? rawPkgCfg.packages
    : null;

  const packageOffers: SiteOfferBannerSource[] =
    isolatedPkgList && isolatedPkgList.length > 0
      ? isolatedPkgList
          .filter((pk) => pk.isActive !== false && typeof pk.id === "string")
          .map((pk) => {
            const slug = typeof pk.slug === "string" ? pk.slug : String(pk.id);
            const kind = pk.kind === "COLLECTION" ? "COLLECTION" : "LOADOUT";
            const pricingMode =
              pk.pricingMode === "COLLECTION_SHOWCASE"
                ? "COLLECTION_SHOWCASE"
                : "FIXED_PRICE";
            const finalPrice =
              pricingMode === "FIXED_PRICE" && typeof pk.finalPrice === "number"
                ? pk.finalPrice
                : null;
            const originalPrice =
              pricingMode === "FIXED_PRICE" && typeof pk.originalPrice === "number"
                ? pk.originalPrice
                : null;
            const savingsAmount =
              finalPrice !== null && originalPrice !== null && originalPrice > finalPrice
                ? originalPrice - finalPrice
                : 0;
            const prodIds = Array.isArray(pk.productIds) ? pk.productIds : [];

            return {
              id: String(pk.id),
              kind,
              slug,
              title: typeof pk.name === "string" ? pk.name : "Collection",
              subtitle: typeof pk.tagline === "string" ? pk.tagline : null,
              itemCount: prodIds.length > 0 ? prodIds.length : 3,
              originalPrice,
              finalPrice,
              savingsAmount,
              ctaLabel:
                typeof pk.ctaLabel === "string"
                  ? pk.ctaLabel
                  : kind === "COLLECTION"
                    ? "Explore"
                    : "Add to Room",
              ctaUrl: `/package/?slug=${encodeURIComponent(slug)}`,
              bannerImageUrl:
                typeof pk.bannerImageUrl === "string" ? pk.bannerImageUrl : null,
              bannerImageFit:
                pk.bannerImageFit === "contain" ? "contain" : "cover",
              bannerImagePosition:
                pk.bannerImagePosition === "top" || pk.bannerImagePosition === "bottom"
                  ? pk.bannerImagePosition
                  : "center",
              originalAccentColor:
                typeof pk.accentColor === "string" ? pk.accentColor : "#c94b99",
              textColor: "#ffffff",
              universeSlug:
                typeof pk.universeSlug === "string" ? pk.universeSlug : null,
            };
          })
      : sbBundles.map((b) => {
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
            ctaUrl: `/package/?slug=${encodeURIComponent(b.slug)}`,
            bannerImageUrl: null,
            originalAccentColor: u?.accentColor ?? "#c94b99",
            textColor: "#ffffff",
            universeSlug: u?.slug ?? null,
          };
        });

  const promoOffers = extractPromoOffersFromSectionConfigs(sbHomeSections);
  const mappedOffers =
    packageOffers.length > 0 || promoOffers.length > 0
      ? [...packageOffers, ...promoOffers]
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
