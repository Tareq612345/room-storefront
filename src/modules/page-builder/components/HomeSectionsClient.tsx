/**
 * @file src/modules/page-builder/components/HomeSectionsClient.tsx
 * @purpose Dynamically renders and reorders Homepage sections synced live from Supabase page_sections table.
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
  visible: boolean;
}

const DEFAULT_SECTION_ORDER: AdminSectionConfig[] = [
  { id: "s1", type: "UNIVERSE_QUICK_BAR", title: "3-Card Universe Showcase", visible: true },
  { id: "s2", type: "NEW_ARRIVALS", title: "Fresh Drops", visible: true },
  { id: "s3", type: "FEATURED_BUNDLES", title: "Signature Loadouts", visible: true },
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
          isVisible: boolean;
          sortOrder: number;
        }>(
          "page_sections",
          "select=id,type,title,isVisible,sortOrder&pageKey=eq.home&order=sortOrder.asc"
        );
        if (!active || rows.length === 0) return;

        setSections(
          rows.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title ?? r.type,
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
            return <FreshDropsSection key={s.id} products={freshDrops} />;
          }
          if (s.type === "FEATURED_BUNDLES") {
            return <LoadoutsSection key={s.id} loadouts={loadouts} />;
          }
          return null;
        })}
    </>
  );
}
