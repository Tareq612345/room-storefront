/**
 * @file src/modules/package-organizer/index.ts
 * @purpose Public barrel for the isolated Packages & Collections Data Manager module.
 */

export { PackageDetailClient } from "./components/PackageDetailClient";
export { PackageOrganizerClient } from "./components/PackageOrganizerClient";
export { StorefrontPackageBannerCard } from "./components/StorefrontPackageBannerCard";
export {
  fetchPackageOrganizerSnapshot,
  fetchResolvedPackageDetail,
  fetchResolvedPackagesForStorefront,
  getCachedOrganizerPackages,
  saveIsolatedPackageRegistry,
} from "./client-api";
export {
  DEFAULT_PACKAGE_SEEDS,
  PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY,
  PACKAGE_ORGANIZER_PAGE_KEY,
  PACKAGE_ORGANIZER_RECORD_ID,
  buildDefaultPackageSpecs,
  buildInitialPackageRegistry,
  getPackageHref,
  slugifyPackageName,
} from "./helpers";
export {
  OrganizedPackageSchema,
  PackageRegistrySchema,
  PackageSpecItemSchema,
  type OrganizedPackage,
  type PackageOrganizerBootstrap,
  type PackageRegistry,
  type PackageSpecItem,
} from "./schema";
export { getPackageOrganizerBootstrap } from "./service";
