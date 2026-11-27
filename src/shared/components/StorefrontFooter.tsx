/**
 * @file src/shared/components/StorefrontFooter.tsx
 * @purpose Dynamic Storefront Footer backed by live store_configs, shipping_zones, and cart-checkout config (zero static text hardcoded in layout.tsx).
 */

"use client";

import { useEffect, useState } from "react";
import { sbSelect } from "@shared/db/supabase-rest";

interface FooterData {
  storeName: string;
  tagline: string;
}

export function StorefrontFooter() {
  const [data, setData] = useState<FooterData>({
    storeName: "",
    tagline: "",
  });

  useEffect(() => {
    try {
      const snapRaw = localStorage.getItem("room_theme_snapshot_v1");
      if (snapRaw) {
        const snap = JSON.parse(snapRaw) as {
          storeName?: string;
          footerTagline?: string;
        };
        if (snap.storeName || snap.footerTagline) {
          setData({
            storeName: snap.storeName ?? "",
            tagline: snap.footerTagline ?? "",
          });
        }
      }
    } catch {
      // Ignore cache read issues
    }

    let active = true;
    (async () => {
      try {
        const [stores, zones] = await Promise.all([
          sbSelect<{
            name: string;
            themeTokens: { footerTagline?: string };
          }>("store_configs", "select=name,themeTokens&slug=eq.room-egypt"),
          sbSelect<{ city: string }>(
            "shipping_zones",
            "select=city&isActive=eq.true&order=sortOrder.asc&limit=3"
          ).catch(() => []),
        ]);
        if (!active || !stores[0]) return;
        const cities = Array.from(new Set(zones.map((z) => z.city).filter(Boolean))).join(" • ");
        const resolvedTagline =
          stores[0].themeTokens?.footerTagline?.trim() ||
          (cities ? `${cities} Express Delivery` : "");
        setData({
          storeName: stores[0].name,
          tagline: resolvedTagline,
        });
        if (stores[0].name && typeof document !== "undefined") {
          document.title = `${stores[0].name} — Storefront`;
        }
      } catch {
        // Keep cached footer
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!data.storeName && !data.tagline) {
    return (
      <footer className="relative z-10 border-t border-[var(--color-border-subtle)] bg-black/60 py-8 text-center text-xs text-[var(--color-text-muted)]" />
    );
  }

  return (
    <footer className="relative z-10 border-t border-[var(--color-border-subtle)] bg-black/60 py-8 text-center text-xs text-[var(--color-text-muted)]">
      <div className="mx-auto max-w-6xl px-4">
        {data.storeName ? (
          <p className="font-serif tracking-[0.2em] text-white/80">
            {data.storeName}
          </p>
        ) : null}
        {data.tagline ? <p className="mt-2">{data.tagline}</p> : null}
      </div>
    </footer>
  );
}
