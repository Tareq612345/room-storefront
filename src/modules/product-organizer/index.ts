/**
 * @file src/modules/product-organizer/index.ts
 * @purpose Public barrel for the isolated Product Data Manager module.
 */

export { ProductDetailClient } from "./components/ProductDetailClient";
export { ProductOrganizerClient } from "./components/ProductOrganizerClient";
export { StorefrontProductBannerCard } from "./components/StorefrontProductBannerCard";
export {
  fetchProductOrganizerSnapshot,
  fetchResolvedProductDetail,
  fetchResolvedProductsForStorefront,
  getCachedOrganizerProducts,
  saveIsolatedProductRegistry,
} from "./client-api";
export {
  DEFAULT_PRODUCT_SEEDS,
  PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY,
  PRODUCT_ORGANIZER_PAGE_KEY,
  PRODUCT_ORGANIZER_RECORD_ID,
  buildDefaultSpecs,
  buildInitialProductRegistry,
  getProductHref,
  slugifyProductName,
} from "./helpers";
export {
  OrganizedProductSchema,
  ProductRegistrySchema,
  ProductSpecItemSchema,
  type OrganizedProduct,
  type ProductOrganizerBootstrap,
  type ProductRegistry,
  type ProductSpecItem,
} from "./schema";
export { getProductOrganizerBootstrap } from "./service";
