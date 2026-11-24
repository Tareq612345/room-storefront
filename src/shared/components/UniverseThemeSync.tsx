/**
 * @file src/shared/components/UniverseThemeSync.tsx
 * @purpose Syncs data-universe attribute on <html> based on current route (white accent on Home, Universe accent inside /universes/[slug]).
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
    } else {
      document.documentElement.removeAttribute("data-universe");
    }
  }, [pathname]);

  return null;
}
