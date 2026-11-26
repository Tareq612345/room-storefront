/**
 * @file src/modules/bundles/components/LoadoutsSection.tsx
 * @purpose Displays Storefront Packages & Collections powered by the isolated Package Data Manager (@modules/package-organizer), with outer banner images, links to /package/?slug=..., and zero stale fallback flash.
 */

"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import {
  fetchResolvedPackagesForStorefront,
  getCachedOrganizerPackages,
  getPackageHref,
  type OrganizedPackage,
} from "@modules/package-organizer";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { BundleSummaryDTO } from "../schema";

interface LoadoutsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  loadouts: BundleSummaryDTO[];
}

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

function toOrganizedFallback(list: BundleSummaryDTO[]): OrganizedPackage[] {
  const now = new Date().toISOString();
  return list.map((b, idx) => ({
    id: b.id,
    slug: b.slug,
    kind: "PACKAGE",
    name: b.name,
    tagline: b.tagline ?? "",
    description: b.tagline ?? "",
    badgeLabel: "Loadout",
    ctaLabel: "Add to Room",
    accentColor: b.universeAccentColor,
    universeSlug: b.universeSlug,
    bannerImageUrl: "",
    bannerImageFit: "cover",
    bannerImagePosition: "center",
    heroImageUrl: "",
    pricingMode: "FIXED_PRICE",
    originalPrice: b.originalPrice,
    finalPrice: b.finalPrice,
    productIds: [],
    specs: [],
    showProductsInside: true,
    showAddPackBtn: true,
    isFeatured: true,
    isActive: true,
    sortOrder: idx + 1,
    createdAt: now,
    updatedAt: now,
  }));
}

export function LoadoutsSection({
  title = "Signature Loadouts",
  subtitle = "Full room setups & curated collections bundled for maximum drip",
  loadouts,
}: LoadoutsSectionProps) {
  const addItem = useRoomBagStore((s) => s.addItem);
  const [items, setItems] = useState<OrganizedPackage[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = getCachedOrganizerPackages();
    if (cached && cached.length > 0) {
      setItems(cached);
      setReady(true);
    }

    let active = true;
    (async () => {
      try {
        const resolved = await fetchResolvedPackagesForStorefront();
        if (!active) return;
        setItems(resolved);
        setReady(true);
      } catch {
        if (!active) return;
        setItems((prev) =>
          prev.length > 0 ? prev : toOrganizedFallback(loadouts)
        );
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadouts]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <div className="mb-6 h-12 w-64 animate-pulse rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="h-72 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[#0b0815]/75"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Room Bundles &amp; Collections
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white md:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((pkg) => {
          const href = getPackageHref(pkg.slug);
          const imgSrc = resolveImgSrc(pkg.bannerImageUrl);
          const posClass =
            pkg.bannerImagePosition === "top"
              ? "object-top"
              : pkg.bannerImagePosition === "bottom"
                ? "object-bottom"
                : "object-center";
          const hasFixedPrice =
            pkg.pricingMode === "FIXED_PRICE" && pkg.finalPrice !== null;
          const savings =
            hasFixedPrice &&
            pkg.originalPrice !== null &&
            pkg.finalPrice !== null &&
            pkg.originalPrice > pkg.finalPrice
              ? pkg.originalPrice - pkg.finalPrice
              : 0;

          return (
            <article
              key={pkg.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Clickable Outer Banner Image */}
              <Link
                href={href}
                className="relative flex h-44 items-start justify-between overflow-hidden p-4"
                style={{
                  background: `radial-gradient(circle at 50% 35%, ${pkg.accentColor}36 0%, #07050c 82%)`,
                }}
              >
                {imgSrc ? (
                  pkg.bannerImageFit === "contain" ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 pt-10">
                      <img
                        src={imgSrc}
                        alt={pkg.name}
                        className={`max-h-full max-w-full object-contain ${posClass} drop-shadow-[0_10px_24px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105`}
                      />
                    </div>
                  ) : (
                    <img
                      src={imgSrc}
                      alt={pkg.name}
                      className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${posClass} opacity-80 transition-transform duration-500 group-hover:scale-105`}
                    />
                  )
                ) : null}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45" />

                <span className="relative z-10 rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                  {pkg.productIds.length > 0
                    ? `${pkg.productIds.length} ${pkg.productIds.length === 1 ? "Item" : "Items"}`
                    : pkg.badgeLabel || (pkg.kind === "COLLECTION" ? "Collection" : "Loadout")}
                </span>

                {savings > 0 ? (
                  <span
                    className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: pkg.accentColor }}
                  >
                    Save {formatEgp(savings)}
                  </span>
                ) : pkg.badgeLabel ? (
                  <span
                    className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: pkg.accentColor }}
                  >
                    {pkg.badgeLabel}
                  </span>
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col justify-between p-5">
                <Link href={href} className="block">
                  <h3 className="font-serif text-xl font-semibold text-white group-hover:text-white/90">
                    {pkg.name}
                  </h3>
                  {pkg.tagline ? (
                    <p className="mt-1.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                      {pkg.tagline}
                    </p>
                  ) : null}
                </Link>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
                  <div>
                    {hasFixedPrice && pkg.finalPrice !== null ? (
                      <>
                        <div className="text-lg font-bold text-white">
                          {formatEgp(pkg.finalPrice)}
                        </div>
                        {savings > 0 && pkg.originalPrice !== null ? (
                          <div className="text-xs text-[var(--color-text-muted)] line-through">
                            {formatEgp(pkg.originalPrice)}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/65">
                        {pkg.kind === "COLLECTION" ? "Curated Collection" : "Room Pack"}
                      </span>
                    )}
                  </div>

                  {hasFixedPrice && pkg.finalPrice !== null ? (
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: pkg.id,
                          itemType: "BUNDLE",
                          title: pkg.name,
                          subtitle: pkg.tagline,
                          unitPrice: pkg.finalPrice ?? 0,
                          accentColor: pkg.accentColor,
                          imageUrl: pkg.bannerImageUrl || pkg.heroImageUrl,
                        })
                      }
                      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: pkg.accentColor }}
                    >
                      {pkg.ctaLabel || "Add to Room"}
                    </button>
                  ) : (
                    <Link
                      href={href}
                      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: pkg.accentColor }}
                    >
                      {pkg.ctaLabel || "Explore"}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
