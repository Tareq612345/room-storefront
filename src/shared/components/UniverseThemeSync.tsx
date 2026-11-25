/**
 * @file src/shared/components/UniverseThemeSync.tsx
 * @purpose Syncs data-universe, Admin-saved Universe accent colors, and Admin-saved Home default accent on <html>.
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const KNOWN_UNIVERSES = new Set(["cars", "gaming", "anime"]);

export function UniverseThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const match = pathname?.match(/\/universes\/([^/]+)/);
    const slug = match?.[1];

    if (slug && KNOWN_UNIVERSES.has(slug)) {
      document.documentElement.setAttribute("data-universe", slug);

      try {
        const raw = localStorage.getItem("room_admin_universes_v1");
        if (raw) {
          const list = JSON.parse(raw) as { slug: string; accentColor: string }[];
          const found = list.find((u) => u.slug === slug);
          if (found?.accentColor) {
            document.documentElement.style.setProperty(
              "--color-accent",
              found.accentColor
            );
            return;
          }
        }
      } catch {
        // Ignore storage errors
      }
      document.documentElement.style.removeProperty("--color-accent");
    } else {
      document.documentElement.removeAttribute("data-universe");
      try {
        const rawStore = localStorage.getItem("room_admin_store_v1");
        if (rawStore) {
          const parsed = JSON.parse(rawStore) as { defaultAccent?: string };
          if (parsed.defaultAccent) {
            document.documentElement.style.setProperty(
              "--color-accent",
              parsed.defaultAccent
            );
            return;
          }
        }
      } catch {
        // Ignore storage errors
      }
      document.documentElement.style.removeProperty("--color-accent");
    }
  }, [pathname]);

  return null;
}
