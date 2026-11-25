/**
 * @file src/modules/page-builder/components/HomeSectionsClient.tsx
 * @purpose Dynamically renders and reorders Homepage sections based on Admin Home Builder settings saved in localStorage.
 */

"use client";

import type { BundleSummaryDTO } from "@modules/bundles";
import { LoadoutsSection } from "@modules/bundles";
import type { ProductSummaryDTO } from "@modules/catalog";
import { FreshDropsSection } from "@modules/catalog";
import type { UniverseDTO } from "@modules/universes";
import { UniverseShowcaseGrid } from "@modules/universes";
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
    try {
      const raw = localStorage.getItem("room_admin_sections_v1");
      if (!raw) return;
      const saved = JSON.parse(raw) as AdminSectionConfig[];
      if (Array.isArray(saved) && saved.length > 0) {
        setSections(saved);
      }
    } catch {
      // Ignore storage errors
    }
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
