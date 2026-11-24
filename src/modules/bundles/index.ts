/**
 * @file src/modules/bundles/index.ts
 * @purpose Bundles (Loadouts) Public API: Exports Bundle schemas, pricing calculator, service, and LoadoutsSection.
 */

export {
  BundlePricingTypeSchema,
  BundleSummarySchema,
  type BundleSummaryDTO,
} from "./schema";
export { computeBundleFinalPrice, listFeaturedLoadouts } from "./service";
export { LoadoutsSection } from "./components/LoadoutsSection";
