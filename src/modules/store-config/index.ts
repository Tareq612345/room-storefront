/**
 * @file src/modules/store-config/index.ts
 * @purpose Store-Config Public API: Exports store configuration types and service.
 */

export {
  StoreConfigSchema,
  StoreThemeTokensSchema,
  type StoreConfigDTO,
  type StoreThemeTokens,
} from "./schema";
export { getActiveStoreConfig } from "./service";
