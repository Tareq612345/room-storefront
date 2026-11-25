/**
 * @file src/shared/components/UniverseThemeSync.tsx
 * @purpose Syncs full Supabase theme tokens (background gradient, default accent, and Universe colors) and caches a pre-paint snapshot to prevent refresh flash.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const KNOWN_UNIVERSES = new Set(["cars", "gaming", "anime"]);

interface StoreThemeJson {
  bgPrimary?: string;
  bgSecondary?: string;
  bgElevated?: string;
  defaultAccent?: string;
}

export function UniverseThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const match = pathname?.match(/\/universes\/([^/]+)/);
    const slug = match?.[1];

    (async () => {
      try {
        const [stores, universes] = await Promise.all([
          sbSelect<{ defaultAccentColor: string; themeTokens: StoreThemeJson }>(
            "store_configs",
            "select=defaultAccentColor,themeTokens&slug=eq.room-egypt"
          ),
          sbSelect<{ slug: string; accentColor: string }>(
            "universes",
            "select=slug,accentColor"
          ),
        ]);

        if (!active) return;

        const root = document.documentElement;
        const store = stores[0];
        const tokens = store?.themeTokens ?? {};

        const bgPrimary = tokens.bgPrimary ?? "#05030a";
        const bgSecondary = tokens.bgSecondary ?? "#0b0617";
        const bgElevated = tokens.bgElevated ?? "#140b29";
        const defaultAccent = store?.defaultAccentColor ?? "#ffffff";

        root.style.setProperty("--color-bg-primary", bgPrimary);
        root.style.setProperty("--color-bg-secondary", bgSecondary);
        root.style.setProperty("--color-bg-elevated", bgElevated);
        root.style.setProperty(
          "--color-bg-canvas-gradient",
          `linear-gradient(180deg, ${bgPrimary} 0%, ${bgSecondary} 45%, ${bgElevated} 100%)`
        );

        const universeMap: Record<string, string> = {};
        for (const u of universes) {
          universeMap[u.slug] = u.accentColor;
        }

        if (slug && KNOWN_UNIVERSES.has(slug)) {
          root.setAttribute("data-universe", slug);
          const uColor = universeMap[slug];
          if (uColor) {
            root.style.setProperty("--color-accent", uColor);
          }
        } else {
          root.removeAttribute("data-universe");
          root.style.setProperty("--color-accent", defaultAccent);
        }

        localStorage.setItem(
          "room_theme_snapshot_v1",
          JSON.stringify({
            bgPrimary,
            bgSecondary,
            bgElevated,
            defaultAccent,
            universes: universeMap,
          })
        );
      } catch {
        // Keep pre-paint snapshot or CSS defaults
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
