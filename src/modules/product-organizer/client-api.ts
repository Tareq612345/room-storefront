/**
 * @file src/modules/product-organizer/client-api.ts
 * @purpose Isolated Product Data Manager public client API: manages outer container styling/images and inner product page content in an isolated Supabase record, exposing read APIs for the Storefront.
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  DEFAULT_PRODUCT_SEEDS,
  PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY,
  PRODUCT_ORGANIZER_PAGE_KEY,
  PRODUCT_ORGANIZER_RECORD_ID,
  buildInitialProductRegistry,
  type ProductSeedInput,
} from "./helpers";
import {
  ProductRegistrySchema,
  type OrganizedProduct,
  type ProductRegistry,
} from "./schema";

interface SbProductRow {
  id: string;
  universeId: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  basePrice: number | string;
  compareAtPrice: number | string | null;
  thumbnailUrl: string;
  images: string[] | null;
  isNewArrival: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

interface SbVariantRow {
  productId: string;
  stock: number;
  isActive: boolean;
}

interface SbUniverseRow {
  id: string;
  slug: string;
  accentColor: string;
}

function cacheProductRegistryLocally(registry: ProductRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY,
      JSON.stringify(registry)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedOrganizerProducts(): OrganizedProduct[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = ProductRegistrySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return parsed.data.products
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return null;
  }
}

export async function saveIsolatedProductRegistry(params: {
  storeId: string;
  registry: ProductRegistry;
  recordExistsInDb?: boolean;
}): Promise<boolean> {
  const validated = ProductRegistrySchema.parse(params.registry);
  cacheProductRegistryLocally(validated);

  const nowIso = new Date().toISOString();
  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(PRODUCT_ORGANIZER_PAGE_KEY)}`,
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
    id: PRODUCT_ORGANIZER_RECORD_ID,
    storeId: params.storeId,
    pageKey: PRODUCT_ORGANIZER_PAGE_KEY,
    type: "NEW_ARRIVALS",
    title: "Isolated Product Organizer Data",
    subtitle: "Standalone Product Organizer Registry",
    sortOrder: 9998,
    isVisible: false,
    config: validated,
    updatedAt: nowIso,
  });
  return true;
}

export async function fetchProductOrganizerSnapshot(): Promise<{
  storeId: string;
  registry: ProductRegistry;
  recordExistsInDb: boolean;
}> {
  const [sbStores, sbIsolated, sbProducts, sbVariants, sbUniverses] =
    await Promise.all([
      sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
      sbSelect<{ id: string; config: unknown }>(
        "page_sections",
        `select=id,config&pageKey=eq.${encodeURIComponent(PRODUCT_ORGANIZER_PAGE_KEY)}`
      ),
      sbSelect<SbProductRow>(
        "products",
        "select=id,universeId,slug,name,subtitle,description,basePrice,compareAtPrice,thumbnailUrl,images,isNewArrival,isFeatured,isActive&isActive=eq.true&order=createdAt.desc"
      ),
      sbSelect<SbVariantRow>(
        "product_variants",
        "select=productId,stock,isActive&isActive=eq.true"
      ),
      sbSelect<SbUniverseRow>("universes", "select=id,slug,accentColor"),
    ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";

  const isolatedRow = sbIsolated[0];
  if (isolatedRow) {
    const parsed = ProductRegistrySchema.safeParse(isolatedRow.config);
    if (parsed.success) {
      cacheProductRegistryLocally(parsed.data);
      return {
        storeId,
        registry: parsed.data,
        recordExistsInDb: true,
      };
    }
  }

  const seeds: ProductSeedInput[] =
    sbProducts.length > 0
      ? sbProducts.map((p) => {
          const u = sbUniverses.find((un) => un.id === p.universeId);
          const vars = sbVariants.filter((v) => v.productId === p.id);
          const stock =
            vars.length > 0
              ? vars.reduce((sum, v) => sum + Number(v.stock), 0)
              : 10;
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            subtitle: p.subtitle,
            description: p.description,
            basePrice: Number(p.basePrice),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            thumbnailUrl: p.thumbnailUrl,
            images:
              Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : [p.thumbnailUrl],
            universeSlug: u?.slug ?? "cars",
            accentColor: u?.accentColor ?? "#c94b99",
            isNewArrival: p.isNewArrival,
            isFeatured: p.isFeatured,
            stock,
          };
        })
      : DEFAULT_PRODUCT_SEEDS;

  const seeded = buildInitialProductRegistry(seeds);
  cacheProductRegistryLocally(seeded);

  return {
    storeId,
    registry: seeded,
    recordExistsInDb: false,
  };
}

/**
 * Storefront & Consumer Read API: returns active Products from the isolated Product Data Manager.
 */
export async function fetchResolvedProductsForStorefront(): Promise<OrganizedProduct[]> {
  const snapshot = await fetchProductOrganizerSnapshot();
  return snapshot.registry.products
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Storefront & Consumer Read API: returns a single active Product by slug for the inner Product Page.
 */
export async function fetchResolvedProductDetail(
  slug: string
): Promise<OrganizedProduct | null> {
  const snapshot = await fetchProductOrganizerSnapshot();
  return (
    snapshot.registry.products.find((p) => p.slug === slug && p.isActive) ?? null
  );
}
