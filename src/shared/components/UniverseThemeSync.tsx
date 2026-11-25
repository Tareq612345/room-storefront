/**
 * @file src/shared/components/UniverseThemeSync.tsx
 * @purpose Syncs data-universe and live Supabase Universe/Store accent colors on <html> for all users.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const KNOWN_UNIVERSES = new Set(["cars", "gaming", "anime"]);

export function UniverseThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const match = pathname?.match(/\/universes\/([^/]+)/);
    const slug = match?.[1];

    (async () => {
      if (slug && KNOWN_UNIVERSES.has(slug)) {
        document.documentElement.setAttribute("data-universe", slug);
        try {
          const rows = await sbSelect<{ accentColor: string }>(
            "universes",
            `select=accentColor&slug=eq.${encodeURIComponent(slug)}`
          );
          if (active && rows[0]?.accentColor) {
            document.documentElement.style.setProperty(
              "--color-accent",
              rows[0].accentColor
            );
          }
        } catch {
          document.documentElement.style.removeProperty("--color-accent");
        }
      } else {
        document.documentElement.removeAttribute("data-universe");
        try {
          const stores = await sbSelect<{ defaultAccentColor: string }>(
            "store_configs",
            "select=defaultAccentColor&slug=eq.room-egypt"
          );
          if (active && stores[0]?.defaultAccentColor) {
            document.documentElement.style.setProperty(
              "--color-accent",
              stores[0].defaultAccentColor
            );
            return;
          }
        } catch {
          // Fallback to tokens.css default white
        }
        document.documentElement.style.removeProperty("--color-accent");
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
