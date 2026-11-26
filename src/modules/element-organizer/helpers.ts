/**
 * @file src/modules/element-organizer/helpers.ts
 * @purpose Client-safe constants and initial default seeds for the isolated Reading Text Blocks & Buttons Data Manager.
 */

import {
  ElementRegistrySchema,
  type ButtonItem,
  type ElementRegistry,
  type TextBlockItem,
} from "./schema";

export const ELEMENT_ORGANIZER_PAGE_KEY = "__isolated_element_organizer_v1__";
export const ELEMENT_ORGANIZER_RECORD_ID = "eorg_isolated_registry_v1";
export const ELEMENT_ORGANIZER_LOCAL_STORAGE_KEY = "room_isolated_element_organizer_v1";

export function buildDefaultElementRegistry(): ElementRegistry {
  const now = new Date().toISOString();

  const buttons: ButtonItem[] = [
    {
      id: "btn_explore_universes",
      name: "Explore Primary CTA",
      label: "Explore Universes",
      href: "/universe/?slug=universe-1",
      variant: "solid",
      bgColor: "#c94b99",
      textColor: "#ffffff",
      borderRadius: "pill",
      size: "md",
      icon: "arrow",
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "btn_cairo_shipping",
      name: "Midnight Drop Glass Button",
      label: "View Collections",
      href: "/package/?slug=collection-for-universe-1",
      variant: "glass",
      bgColor: "#38bdf8",
      textColor: "#ffffff",
      borderRadius: "pill",
      size: "md",
      icon: "sparkles",
      isActive: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const textBlocks: TextBlockItem[] = [
    {
      id: "txt_room_manifesto",
      name: "Cairo Express Banner Card",
      align: "center",
      lines: [
        {
          id: "line_1",
          text: "CAIRO & NEW CAIRO DROP",
          size: "eyebrow",
          color: "#c94b99",
        },
        {
          id: "line_2",
          text: "Engineered Dark-Mode Textiles",
          size: "title",
          color: "#ffffff",
        },
        {
          id: "line_3",
          text: "300TC matte cotton bedsheets & full room collections delivered in 1-2 days.",
          size: "subtitle",
          color: "#c4bfd4",
        },
      ],
      accentColor: "#c94b99",
      bgColor: "rgba(0, 0, 0, 0.55)",
      borderRadius: "rounded",
      paddingMode: "comfortable",
      buttonPlacement: "bottom-center",
      attachedButtonId: "btn_explore_universes",
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return ElementRegistrySchema.parse({
    schemaVersion: 1,
    updatedAt: now,
    textBlocks,
    buttons,
  });
}

export function createEmptyTextBlock(sortOrder: number): TextBlockItem {
  const now = new Date().toISOString();
  return {
    id: `txt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Reading Block #${sortOrder}`,
    align: "center",
    lines: [
      {
        id: `ln_${Date.now().toString(36)}_1`,
        text: "SECTION EYEBROW",
        size: "eyebrow",
        color: "#c94b99",
      },
      {
        id: `ln_${Date.now().toString(36)}_2`,
        text: "Headline Text Here",
        size: "title",
        color: "#ffffff",
      },
      {
        id: `ln_${Date.now().toString(36)}_3`,
        text: "Supporting description line matching storefront typography.",
        size: "subtitle",
        color: "#c4bfd4",
      },
    ],
    accentColor: "#c94b99",
    bgColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: "rounded",
    paddingMode: "comfortable",
    buttonPlacement: "none",
    attachedButtonId: null,
    isActive: true,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyButton(sortOrder: number): ButtonItem {
  const now = new Date().toISOString();
  return {
    id: `btn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Button #${sortOrder}`,
    label: "Claim Yours",
    href: "/",
    variant: "solid",
    bgColor: "#c94b99",
    textColor: "#ffffff",
    borderRadius: "pill",
    size: "md",
    icon: "arrow",
    isActive: true,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}
