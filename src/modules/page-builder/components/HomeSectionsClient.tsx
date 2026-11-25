/**
 * @file src/modules/page-builder/components/HomeSectionsClient.tsx
 * @purpose Dynamically renders and reorders Homepage sections (including custom titles & subtitles) synced live from Supabase page_sections table.
 */

"use client";

import type { BundleSummaryDTO } from "@modules/bundles";
import { LoadoutsSection } from "@modules/bundles";
import type { ProductSummaryDTO } from "@modules/catalog";
import { FreshDropsSection } from "@modules/catalog";
import type { UniverseDTO } from "@modules/universes";
import { UniverseShowcaseGrid } from "@modules/universes";
import { sbSelect } from "@shared/db/supabase-rest";
import { useEffect, useState } from "react";

interface HomeSectionsClientProps {
  universes: UniverseDTO[];
  freshDrops: ProductSummaryDTO[];
  loadouts: BundleSummaryDTO[];
}

interface AdminSectionConfig {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  visible: boolean;
}

const DEFAULT_SECTION_ORDER: AdminSectionConfig[] = [
  { id: "s1", type: "UNIVERSE_QUICK_BAR", title: "Choose Your Universe", subtitle: null, visible: true },
  { id: "s2", type: "NEW_ARRIVALS", title: "Fresh Drops", subtitle: "High-craft themed bedsheets engineered for Cairo & New Cairo setups", visible: true },
  { id: "s3", type: "FEATURED_BUNDLES", title: "Signature Loadouts", subtitle: "Full room setups bundled for maximum drip & instant savings", visible: true },
];

export function HomeSectionsClient({
  universes,
  freshDrops,
  loadouts,
}: HomeSectionsClientProps) {
  const [sections, setSections] = useState<AdminSectionConfig[]>(
    DEFAULT_SECTION_ORDER
  );

  useEffect(() => {
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
        }>(
          "page_sections",
          "select=id,type,title,subtitle,isVisible,sortOrder&pageKey=eq.home&order=sortOrder.asc"
        );
        if (!active || rows.length === 0) return;

        setSections(
          rows.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title ?? r.type,
            subtitle: r.subtitle,
            visible: r.isVisible,
          }))
        );
      } catch {
        // Keep default order
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {sections
        .filter((s) => s.visible)
        .map((s) => {
          if (s.type === "UNIVERSE_QUICK_BAR") {
            return <UniverseShowcaseGrid key={s.id} universes={universes} />;
          }
          if (s.type === "NEW_ARRIVALS") {
            return (
              <FreshDropsSection
                key={s.id}
                title={s.title}
                subtitle={s.subtitle}
                products={freshDrops}
              />
            );
          }
          if (s.type === "FEATURED_BUNDLES") {
            return (
              <LoadoutsSection
                key={s.id}
                title={s.title}
                subtitle={s.subtitle}
                loadouts={loadouts}
              />
            );
          }
          return null;
        })}
    </>
  );
}
