/**
 * @file src/modules/home-composer/helpers.ts
 * @purpose Client-safe constants, initial Homepage Composer layout builder, and empty block/divider factories.
 */

import {
  HomepageRegistrySchema,
  type BlockPlacedItem,
  type DividerStyleConfig,
  type HomeBlock,
  type HomepageRegistry,
} from "./schema";

export const HOME_COMPOSER_PAGE_KEY = "__isolated_home_composer_v1__";
export const HOME_COMPOSER_RECORD_ID = "hcomp_isolated_registry_v1";
export const HOME_COMPOSER_LOCAL_STORAGE_KEY = "room_isolated_home_composer_v1";

export const DEFAULT_DIVIDER_CONFIG: DividerStyleConfig = {
  label: "",
  color: "#c94b99",
  thickness: 1,
  width: "full",
  style: "glow",
  align: "center",
};

export function createEmptyHomeBlock(sortOrder: number): HomeBlock {
  return {
    id: `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    internalName: `Section Block #${sortOrder}`,
    eyebrow: "",
    eyebrowColor: "#c94b99",
    title: `New Section #${sortOrder}`,
    titleColor: "#ffffff",
    subtitle: "",
    headerAlign: "left",
    startDirection: "ltr",
    mobileCols: "auto",
    desktopCols: "auto",
    gridAlign: "center",
    gap: "md",
    paddingY: "md",
    containerWidth: "standard",
    bgColor: "transparent",
    borderRadius: "rounded",
    isVisible: true,
    sortOrder,
    items: [],
  };
}

export function buildInitialHomepageRegistry(params: {
  universeIds: string[];
  productIds: string[];
  packageIds: string[];
}): HomepageRegistry {
  const now = new Date().toISOString();

  const universeItems: BlockPlacedItem[] = params.universeIds.map((id, idx) => ({
    id: `pi_u_${idx}_${id.slice(0, 8)}`,
    kind: "UNIVERSE_CARD",
    refId: id,
    width: "auto",
    align: "center",
  }));

  const productItems: BlockPlacedItem[] = params.productIds
    .slice(0, 4)
    .map((id, idx) => ({
      id: `pi_p_${idx}_${id.slice(0, 8)}`,
      kind: "PRODUCT_CARD",
      refId: id,
      width: "auto",
      align: "center",
    }));

  const packageItems: BlockPlacedItem[] = params.packageIds.map((id, idx) => ({
    id: `pi_k_${idx}_${id.slice(0, 8)}`,
    kind: "PACKAGE_CARD",
    refId: id,
    width: "auto",
    align: "center",
  }));

  const blocks: HomeBlock[] = [
    {
      id: "blk_universes_showcase",
      internalName: "Choose Your Universe",
      eyebrow: "",
      eyebrowColor: "#c94b99",
      title: "",
      titleColor: "#ffffff",
      subtitle: "",
      headerAlign: "center",
      startDirection: "ltr",
      mobileCols: 1,
      desktopCols: 3,
      gridAlign: "center",
      gap: "lg",
      paddingY: "md",
      containerWidth: "standard",
      bgColor: "transparent",
      borderRadius: "rounded",
      isVisible: true,
      sortOrder: 1,
      items: universeItems,
    },
    {
      id: "blk_fresh_drops",
      internalName: "Fresh Drops",
      eyebrow: "New Arrivals",
      eyebrowColor: "#c94b99",
      title: "Fresh Drops",
      titleColor: "#ffffff",
      subtitle: "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
      headerAlign: "left",
      startDirection: "ltr",
      mobileCols: 1,
      desktopCols: 4,
      gridAlign: "center",
      gap: "md",
      paddingY: "md",
      containerWidth: "standard",
      bgColor: "transparent",
      borderRadius: "rounded",
      isVisible: true,
      sortOrder: 2,
      items: productItems,
    },
    {
      id: "blk_featured_collections",
      internalName: "Signature Loadouts & Collections",
      eyebrow: "Room Bundles & Collections",
      eyebrowColor: "#c94b99",
      title: "Signature Loadouts",
      titleColor: "#ffffff",
      subtitle: "Full room setups & curated collections bundled for maximum drip",
      headerAlign: "left",
      startDirection: "ltr",
      mobileCols: 1,
      desktopCols: 3,
      gridAlign: "center",
      gap: "md",
      paddingY: "lg",
      containerWidth: "standard",
      bgColor: "transparent",
      borderRadius: "rounded",
      isVisible: true,
      sortOrder: 3,
      items: packageItems,
    },
  ];

  return HomepageRegistrySchema.parse({
    schemaVersion: 1,
    updatedAt: now,
    showStarHeader: true,
    blocks,
  });
}
