/**
 * @file src/modules/home-composer/index.ts
 * @purpose Public API Barrel for @modules/home-composer (Isolated Homepage Composer & Live Homepage Consumer).
 */

export {
  HOME_COMPOSER_LOCAL_STORAGE_KEY,
  HOME_COMPOSER_PAGE_KEY,
  HOME_COMPOSER_RECORD_ID,
} from "./helpers";
export {
  HomepageRegistrySchema,
  type BlockPlacedItem,
  type DividerStyleConfig,
  type HomeBlock,
  type HomepageRegistry,
} from "./schema";
export {
  fetchHomeComposerAdminSnapshot,
  fetchResolvedHomepageForStorefront,
  getCachedHomepageSnapshot,
  saveIsolatedHomepageRegistry,
  type ComposerVaultsData,
  type ResolvedStorefrontHomepage,
} from "./client-api";
export {
  getHomeComposerBootstrap,
  type HomeComposerBootstrap,
} from "./service";
export { HomeComposerBlockRenderer } from "./components/HomeComposerBlockRenderer";
export { HomeComposerClient } from "./components/HomeComposerClient";
export { StorefrontHomeClient } from "./components/StorefrontHomeClient";
