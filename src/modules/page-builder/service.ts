/**
 * @file src/modules/page-builder/service.ts
 * @purpose Page-Builder Service: Fetches store homepage layout sections with default fallback.
 */

import { PageSectionSchema, type PageSectionDTO } from "./schema";
import { findVisiblePageSections } from "./repository";

const FALLBACK_HOME_SECTIONS: PageSectionDTO[] = [
  {
    id: "sec_universe_bar",
    storeId: "store_room_egypt",
    pageKey: "home",
    type: "UNIVERSE_QUICK_BAR",
    title: "Choose Your Universe",
    subtitle: "High-craft themed bedsheets & room loadouts",
    sortOrder: 1,
    isVisible: true,
    config: { layout: "three-card-showcase" },
  },
  {
    id: "sec_fresh_drops",
    storeId: "store_room_egypt",
    pageKey: "home",
    type: "NEW_ARRIVALS",
    title: "Fresh Drops",
    subtitle: "Latest Cairo & New Cairo room essentials",
    sortOrder: 2,
    isVisible: true,
    config: { limit: 4 },
  },
  {
    id: "sec_featured_loadouts",
    storeId: "store_room_egypt",
    pageKey: "home",
    type: "FEATURED_BUNDLES",
    title: "Signature Loadouts",
    subtitle: "Complete bedroom transformations with bundle savings",
    sortOrder: 3,
    isVisible: true,
    config: { limit: 3 },
  },
];

export async function getPageSections(
  storeId: string,
  pageKey = "home"
): Promise<PageSectionDTO[]> {
  try {
    const rows = await findVisiblePageSections(storeId, pageKey);
    if (rows.length === 0) {
      return FALLBACK_HOME_SECTIONS.map((s) => ({ ...s, storeId }));
    }
    return rows.map((row) =>
      PageSectionSchema.parse({
        ...row,
        config:
          typeof row.config === "object" && row.config !== null
            ? row.config
            : {},
      })
    );
  } catch {
    return FALLBACK_HOME_SECTIONS.map((s) => ({ ...s, storeId }));
  }
}
