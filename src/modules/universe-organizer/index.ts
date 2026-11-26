/**
 * @file src/modules/universe-organizer/index.ts
 * @purpose Public barrel for the isolated Universe Data Manager module (data access functions for Storefront/future consumers + Admin Organizer UI).
 */

export { StorefrontUniverseCard } from "./components/StorefrontUniverseCard";
export { UniverseOrganizerClient } from "./components/UniverseOrganizerClient";
export {
  fetchOrganizerDataSnapshot,
  fetchResolvedUniverseDetail,
  fetchResolvedUniversesForStorefront,
  getCachedOrganizerUniverses,
  saveIsolatedRegistry,
} from "./client-api";
export {
  ORGANIZER_LOCAL_STORAGE_KEY,
  ORGANIZER_PAGE_KEY,
  ORGANIZER_RECORD_ID,
  buildInitialRegistryFromSources,
  extractPromoOffersFromSectionConfigs,
  extractSlugFromLocation,
  getUniverseHref,
  slugifyUniverseName,
} from "./helpers";
export {
  OrganizedUniverseSchema,
  OrganizerRegistrySchema,
  SiteOfferBannerSourceSchema,
  SiteProductSourceSchema,
  type OrganizedUniverse,
  type OrganizerRegistry,
  type ResolvedUniverseDetail,
  type SiteOfferBannerSource,
  type SiteProductSource,
  type UniverseOrganizerBootstrap,
} from "./schema";
export { getUniverseOrganizerBootstrap } from "./service";
