/**
 * @file src/modules/catalog/index.ts
 * @purpose Catalog Public API: Exports Product schemas, services, ProductCard, and FreshDropsSection.
 */

export {
  ProductSummarySchema,
  ProductVariantSchema,
  type ProductSummaryDTO,
  type ProductVariantDTO,
} from "./schema";
export { listFreshDrops, listProductsByUniverse } from "./service";
export { ProductCard } from "./components/ProductCard";
export { FreshDropsSection } from "./components/FreshDropsSection";
