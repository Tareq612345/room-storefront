/**
 * @file src/modules/page-builder/components/HomeSectionsClient.tsx
 * @purpose Dynamically renders and reorders Homepage Blocks & Widgets synced live from Supabase page_sections table without stale default flash.
 */

"use client";

import type { BundleSummaryDTO } from "@modules/bundles";
import type { ProductSummaryDTO } from "@modules/catalog";
import type { UniverseDTO } from "@modules/universes";
import { sbSelect } from "@shared/db/supabase-rest";
import { useEffect, useState } from "react";
import {
  BlockWidgetRenderer,
  type BlockConfig,
  type RenderedBlock,
} from "./BlockWidgetRenderer";

interface HomeSectionsClientProps {
  universes: UniverseDTO[];
  freshDrops: ProductSummaryDTO[];
  loadouts: BundleSummaryDTO[];
}

const DEFAULT_BLOCKS: RenderedBlock[] = [
  {
    id: "s1",
    type: "UNIVERSE_QUICK_BAR",
    title: "Choose Your Universe",
    subtitle: "",
    visible: true,
    config: {
      eyebrow: "",
      columns: 3,
      paddingY: "md",
      borderRadius: "rounded",
      widgets: [{ id: "w_univ", kind: "UNIVERSE_CARDS" }],
    },
  },
  {
    id: "s2",
    type: "NEW_ARRIVALS",
    title: "Fresh Drops",
    subtitle: "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
    visible: true,
    config: {
      eyebrow: "New Arrivals",
      columns: 4,
      paddingY: "md",
      borderRadius: "rounded",
      widgets: [{ id: "w_prod", kind: "PRODUCT_CARDS" }],
    },
  },
  {
    id: "s3",
    type: "FEATURED_BUNDLES",
    title: "Signature Loadouts",
    subtitle: "Full room setups bundled for maximum drip & instant savings",
    visible: true,
    config: {
      eyebrow: "Room Bundles",
      columns: 3,
      paddingY: "md",
      borderRadius: "rounded",
      widgets: [{ id: "w_load", kind: "LOADOUT_CARDS" }],
    },
  },
];

export function HomeSectionsClient({
  universes,
  freshDrops,
  loadouts,
}: HomeSectionsClientProps) {
  const [blocks, setBlocks] = useState<RenderedBlock[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("room_live_home_sections_v1");
      if (cached) {
        const parsed = JSON.parse(cached) as RenderedBlock[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlocks(parsed);
          setReady(true);
        }
      }
    } catch {
      // Ignore
    }

    let active = true;
    (async () => {
      try {
        const rows = await sbSelect<{
          id: string;
          type: string;
          title: string | null;
          subtitle: string | null;
          isVisible: boolean;
          sortOrder: number;
          config: BlockConfig | null;
        }>(
          "page_sections",
          "select=id,type,title,subtitle,isVisible,sortOrder,config&pageKey=eq.home&order=sortOrder.asc"
        );
        if (!active) return;

        if (rows.length === 0) {
          setBlocks(DEFAULT_BLOCKS);
          setReady(true);
          return;
        }

        const mapped = rows.map((r) => {
          const cfg =
            r.config && typeof r.config === "object" ? r.config : {};
          const hasWidgets =
            Array.isArray(cfg.widgets) && cfg.widgets.length > 0;
          const fallbackWidgets = hasWidgets
            ? cfg.widgets
            : r.type === "UNIVERSE_QUICK_BAR"
              ? [{ id: `${r.id}_w`, kind: "UNIVERSE_CARDS" as const }]
              : r.type === "NEW_ARRIVALS"
                ? [{ id: `${r.id}_w`, kind: "PRODUCT_CARDS" as const }]
                : r.type === "FEATURED_BUNDLES"
                  ? [{ id: `${r.id}_w`, kind: "LOADOUT_CARDS" as const }]
                  : [];

          return {
            id: r.id,
            type: r.type,
            title: r.title ?? "",
            subtitle: r.subtitle ?? "",
            visible: r.isVisible,
            config: {
              ...cfg,
              widgets: fallbackWidgets,
            },
          };
        });

        setBlocks(mapped);
        setReady(true);
        localStorage.setItem("room_live_home_sections_v1", JSON.stringify(mapped));
      } catch {
        if (!active) return;
        setBlocks((prev) => (prev.length > 0 ? prev : DEFAULT_BLOCKS));
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="h-[420px] animate-pulse rounded-[22px] border border-[var(--color-border-subtle)] bg-[#0b0815]/75"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {blocks
        .filter((b) => b.visible)
        .map((block) => (
          <BlockWidgetRenderer
            key={block.id}
            block={block}
            universes={universes}
            products={freshDrops}
            loadouts={loadouts}
          />
        ))}
    </>
  );
}
