/**
 * @file src/modules/page-builder/index.ts
 * @purpose Page-Builder Public API: Exports PageSection schemas, service, and DynamicPageRenderer.
 */

export {
  PageSectionSchema,
  PageSectionTypeSchema,
  type PageSectionDTO,
  type PageSectionType,
} from "./schema";
export { getPageSections } from "./service";
export { DynamicPageRenderer } from "./components/DynamicPageRenderer";
