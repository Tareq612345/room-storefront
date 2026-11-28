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
} from "./helpers";
import {
  ProductRegistrySchema,
  type OrganizedProduct,
  type ProductRegistry,
} from "./schema";

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
  const [sbStores, sbIsolated] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(PRODUCT_ORGANIZER_PAGE_KEY)}`
    ),
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

  const seeded = buildInitialProductRegistry(DEFAULT_PRODUCT_SEEDS);
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

/**
 * Isolated Checkout Inventory Hook: decrements ordered product quantities cleanly inside __isolated_product_organizer_v1__.
 */
export async function decrementIsolatedProductsStock(
  lines: Array<{
    productIdOrSlug: string;
    variantId?: string | null;
    quantity: number;
  }>
): Promise<void> {
  if (lines.length === 0) return;
  const snapshot = await fetchProductOrganizerSnapshot();
  let changed = false;

  const nextProducts = snapshot.registry.products.map((prod) => {
    const prodLines = lines.filter(
      (l) =>
        (l.productIdOrSlug === prod.id || l.productIdOrSlug === prod.slug) &&
        l.quantity > 0
    );
    if (prodLines.length === 0) return prod;
    changed = true;

    let nextVariants = [...prod.variants];
    let totalOrdered = 0;

    for (const line of prodLines) {
      totalOrdered += line.quantity;
      if (line.variantId && nextVariants.length > 0) {
        nextVariants = nextVariants.map((v) =>
          v.id === line.variantId
            ? { ...v, stock: Math.max(0, v.stock - line.quantity) }
            : v
        );
      }
    }

    const activeVariantsStock =
      nextVariants.length > 0
        ? nextVariants
            .filter((v) => v.isActive)
            .reduce((s, v) => s + v.stock, 0)
        : null;

    const nextStock =
      activeVariantsStock !== null
        ? activeVariantsStock
        : Math.max(0, prod.stock - totalOrdered);

    return {
      ...prod,
      variants: nextVariants,
      stock: nextStock,
      isVaulted: nextStock <= 0 ? true : prod.isVaulted,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!changed) return;

  await saveIsolatedProductRegistry({
    storeId: snapshot.storeId,
    recordExistsInDb: snapshot.recordExistsInDb,
    registry: {
      ...snapshot.registry,
      updatedAt: new Date().toISOString(),
      products: nextProducts,
    },
  });
}
