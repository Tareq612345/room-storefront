/**
 * @file src/modules/element-organizer/index.ts
 * @purpose Public API Barrel for @modules/element-organizer (Isolated Reading Text Cards & Reusable Buttons Data Manager).
 */

export {
  ELEMENT_ORGANIZER_LOCAL_STORAGE_KEY,
  ELEMENT_ORGANIZER_PAGE_KEY,
  ELEMENT_ORGANIZER_RECORD_ID,
  buildDefaultElementRegistry,
} from "./helpers";
export {
  ElementRegistrySchema,
  type ButtonItem,
  type ElementRegistry,
  type ReadingTextLine,
  type TextBlockItem,
} from "./schema";
export {
  fetchElementOrganizerSnapshot,
  fetchResolvedElementsForStorefront,
  getCachedOrganizerElements,
  saveIsolatedElementRegistry,
} from "./client-api";
export {
  getElementOrganizerBootstrap,
  type ElementOrganizerBootstrap,
} from "./service";
export { ActionButtonView } from "./components/ActionButtonView";
export { ReadingTextBlockView } from "./components/ReadingTextBlockView";
export { ElementOrganizerClient } from "./components/ElementOrganizerClient";
