/**
 * @file src/shared/components/StorefrontFooter.tsx
 * @purpose Dynamic Storefront Footer backed by live store_configs, shipping_zones, and separated links to Policies, FAQ & Contact.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface FooterData {
  storeName: string;
  tagline: string;
}

const FOOTER_LINKS = [
  { href: "/policies/returns/", label: "الاستبدال والاسترجاع" },
  { href: "/policies/shipping/", label: "سياسة الشحن" },
  { href: "/policies/privacy/", label: "الخصوصية" },
  { href: "/policies/terms/", label: "الشروط والأحكام" },
  { href: "/faq/", label: "الأسئلة الشائعة" },
  { href: "/contact/", label: "من نحن وتواصل معنا" },
];

export function StorefrontFooter() {
  const pathname = usePathname();
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
        const cities = Array.from(
          new Set(zones.map((z) => z.city).filter(Boolean))
        ).join(" • ");
        const resolvedTagline =
          stores[0].themeTokens?.footerTagline?.trim() ||
          (cities ? `${cities} Express Delivery` : "");
        setData({
          storeName: stores[0].name,
          tagline: resolvedTagline,
        });
      } catch {
        // Keep cached footer
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (pathname?.includes("/admin") || pathname?.includes("/schema")) {
    return null;
  }

  return (
    <footer className="relative z-10 border-t border-[var(--color-border-subtle)] bg-black/60 py-8 text-center text-xs text-[var(--color-text-muted)]">
      <div className="mx-auto max-w-6xl space-y-4 px-4">
        {data.storeName ? (
          <p className="font-serif tracking-[0.2em] text-white/80">
            {data.storeName}
          </p>
        ) : null}

        <nav
          dir="rtl"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-white/65"
        >
          {FOOTER_LINKS.map((lnk) => (
            <Link
              key={lnk.href}
              href={lnk.href}
              className="transition-colors hover:text-white"
            >
              {lnk.label}
            </Link>
          ))}
        </nav>

        {data.tagline ? <p>{data.tagline}</p> : null}
      </div>
    </footer>
  );
}
