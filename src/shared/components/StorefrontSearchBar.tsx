/**
 * @file src/shared/components/StorefrontSearchBar.tsx
 * @purpose Standalone Storefront Search Bar ONLY (floating pill opposite MY ROOM that expands into instant live search across active Products, Universes, and Collections/Packages).
 */

"use client";

import { fetchResolvedPackagesForStorefront } from "@modules/package-organizer";
import { fetchResolvedProductsForStorefront } from "@modules/product-organizer";
import { fetchResolvedUniversesForStorefront } from "@modules/universe-organizer";
import { formatEgp } from "@shared/types/common";
import { Layers, Package, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface SearchCatalogItem {
  id: string;
  kind: "PRODUCT" | "UNIVERSE" | "PACKAGE";
  title: string;
  subtitle: string;
  href: string;
  price: number | null;
}

export function StorefrontSearchBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<SearchCatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    (async () => {
      try {
        const [products, universes, packages] = await Promise.all([
          fetchResolvedProductsForStorefront().catch(() => []),
          fetchResolvedUniversesForStorefront().catch(() => []),
          fetchResolvedPackagesForStorefront().catch(() => []),
        ]);
        if (!active) return;

        const items: SearchCatalogItem[] = [
          ...products.map((p) => ({
            id: `prd_${p.id}`,
            kind: "PRODUCT" as const,
            title: p.name,
            subtitle: p.subtitle || p.universeSlug,
            href: `/product/?slug=${encodeURIComponent(p.slug)}`,
            price: p.basePrice,
          })),
          ...universes.map((u) => ({
            id: `unv_${u.id}`,
            kind: "UNIVERSE" as const,
            title: u.name,
            subtitle: u.tagline || u.slug,
            href: `/universe/?slug=${encodeURIComponent(u.slug)}`,
            price: null,
          })),
          ...packages.map((k) => ({
            id: `pkg_${k.id}`,
            kind: "PACKAGE" as const,
            title: k.name,
            subtitle: k.tagline || k.kind,
            href: `/package/?slug=${encodeURIComponent(k.slug)}`,
            price: k.finalPrice,
          })),
        ];

        setCatalog(items);
        setLoaded(true);
      } catch {
        setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, loaded]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 6);
    return catalog
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [catalog, query]);

  if (pathname?.includes("/schema") || pathname?.includes("/admin")) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-xs font-semibold text-white/90 shadow-[0_8px_28px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/45 md:left-6 md:top-6"
        aria-label="Search store"
      >
        <Search className="h-3.5 w-3.5 text-cyan-300" />
        <span className="hidden sm:inline">بحث...</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-16 backdrop-blur-md">
          <div
            className="fixed inset-0"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            dir="auto"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-[#090714] text-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <Search className="h-4 w-4 text-cyan-300" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن منتج، يونيفيرس، أو كوليكشن..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 p-1.5 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {matches.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/50">
                  لا توجد نتائج مطابقة لبحثك.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {matches.map((m) => (
                    <Link
                      key={m.id}
                      href={m.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/50">
                          {m.kind === "PRODUCT" ? (
                            <Package className="h-4 w-4 text-indigo-300" />
                          ) : m.kind === "UNIVERSE" ? (
                            <Sparkles className="h-4 w-4 text-pink-300" />
                          ) : (
                            <Layers className="h-4 w-4 text-amber-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {m.title}
                          </p>
                          <p className="truncate text-[11px] text-white/55">
                            {m.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        {m.price !== null ? (
                          <span className="text-xs font-bold text-emerald-300">
                            {formatEgp(m.price)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                            {m.kind}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
