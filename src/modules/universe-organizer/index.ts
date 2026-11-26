/**
 * @file src/modules/universe-organizer/index.ts
 * @purpose Public barrel for the isolated Admin Universe Organizer module.
 */

export { UniverseOrganizerClient } from "./components/UniverseOrganizerClient";
export {
  ORGANIZER_LOCAL_STORAGE_KEY,
  ORGANIZER_PAGE_KEY,
  ORGANIZER_RECORD_ID,
  buildInitialRegistryFromSources,
  extractPromoOffersFromSectionConfigs,
  slugifyUniverseName,
} from "./helpers";
export {
  OrganizedUniverseSchema,
  OrganizerRegistrySchema,
  SiteOfferBannerSourceSchema,
  SiteProductSourceSchema,
  type OrganizedUniverse,
  type OrganizerRegistry,
  type SiteOfferBannerSource,
  type SiteProductSource,
  type UniverseOrganizerBootstrap,
} from "./schema";
export { getUniverseOrganizerBootstrap } from "./service";
