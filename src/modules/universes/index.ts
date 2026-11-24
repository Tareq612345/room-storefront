/**
 * @file src/modules/universes/index.ts
 * @purpose Universes Public API: Exports Universe schemas, services, UniverseStarHeader, and UniverseShowcaseGrid.
 */

export { UniverseSchema, type UniverseDTO } from "./schema";
export { getUniverseBySlug, listStoreUniverses } from "./service";
export { UniverseShowcaseGrid } from "./components/UniverseShowcaseGrid";
export { UniverseStarHeader } from "./components/UniverseStarHeader";
