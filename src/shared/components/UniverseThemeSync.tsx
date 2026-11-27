/**
 * @file src/shared/components/UniverseThemeSync.tsx
 * @purpose Syncs store theme tokens and dynamic Universe accent colors from the isolated Universe Data Manager (@modules/universe-organizer), supporting both static and dynamic Universe routes.
 */

"use client";

import {
  extractSlugFromLocation,
  fetchResolvedUniversesForStorefront,
} from "@modules/universe-organizer";
import { trackStorefrontEvent } from "@modules/analytics";
import { sbSelect } from "@shared/db/supabase-rest";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface StoreThemeJson {
  bgPrimary?: string;
  bgSecondary?: string;
  bgElevated?: string;
  defaultAccent?: string;
  footerTagline?: string;
}

export function UniverseThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const search = typeof window !== "undefined" ? window.location.search : null;
    const slug = extractSlugFromLocation(pathname, search);

    (async () => {
      try {
        const [stores, organizedUniverses] = await Promise.all([
          sbSelect<{
            name: string;
            defaultAccentColor: string;
            themeTokens: StoreThemeJson;
          }>(
            "store_configs",
            "select=name,defaultAccentColor,themeTokens&slug=eq.room-egypt"
          ),
          fetchResolvedUniversesForStorefront(),
        ]);

        if (!active) return;

        const root = document.documentElement;
        const store = stores[0];
        const tokens = store?.themeTokens ?? {};

        const bgPrimary = tokens.bgPrimary ?? "#05030a";
        const bgSecondary = tokens.bgSecondary ?? "#0b0617";
        const bgElevated = tokens.bgElevated ?? "#140b29";
        const defaultAccent = store?.defaultAccentColor ?? "#ffffff";
        const storeName = store?.name ?? "";
        const footerTagline = tokens.footerTagline ?? "";

        root.style.setProperty("--color-bg-primary", bgPrimary);
        root.style.setProperty("--color-bg-secondary", bgSecondary);
        root.style.setProperty("--color-bg-elevated", bgElevated);
        root.style.setProperty(
          "--color-bg-canvas-gradient",
          `linear-gradient(180deg, ${bgPrimary} 0%, ${bgSecondary} 45%, ${bgElevated} 100%)`
        );

        const universeMap: Record<string, string> = {};
        for (const u of organizedUniverses) {
          universeMap[u.slug] = u.accentColor;
        }

        if (slug && universeMap[slug]) {
          root.setAttribute("data-universe", slug);
          root.style.setProperty("--color-accent", universeMap[slug]);
        } else {
          root.removeAttribute("data-universe");
          root.style.setProperty("--color-accent", defaultAccent);
        }

        if (storeName && typeof document !== "undefined" && !pathname?.includes("/admin") && !pathname?.includes("/schema")) {
          document.title = storeName;
        }

        localStorage.setItem(
          "room_theme_snapshot_v1",
          JSON.stringify({
            storeName,
            footerTagline,
            bgPrimary,
            bgSecondary,
            bgElevated,
            defaultAccent,
            universes: universeMap,
          })
        );

        if (
          pathname &&
          !pathname.includes("/admin") &&
          !pathname.includes("/schema")
        ) {
          void trackStorefrontEvent({
            eventType: slug ? "VIEW_UNIVERSE" : "PAGE_VIEW",
            path: pathname,
            entityType: slug ? "UNIVERSE" : "PAGE",
            entitySlug: slug ?? null,
          });
        }
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
