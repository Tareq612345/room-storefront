/**
 * @file src/modules/package-organizer/components/PackageDetailClient.tsx
 * @purpose Inner Package / Collection Detail Page (/package/?slug=...): renders a large top hero image, package/collection info, specs, Add to Room CTA, and all member products inside it.
 */

"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import { ProductCard, type ProductSummaryDTO } from "@modules/catalog";
import {
  fetchResolvedProductsForStorefront,
  type OrganizedProduct,
} from "@modules/product-organizer";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import { ArrowLeft, Layers, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchResolvedPackageDetail } from "../client-api";
import type { OrganizedPackage } from "../schema";

interface PackageDetailClientProps {
  slug: string;
}

interface MemberProductItem {
  dto: ProductSummaryDTO;
  cardImageFit: "cover" | "contain";
  cardImagePosition: "center" | "top" | "bottom";
  badgeLabel?: string;
  addToBagLabel?: string;
}

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

function toMemberProduct(p: OrganizedProduct): MemberProductItem {
  return {
    dto: {
      id: p.id,
      storeId: "store_room_egypt",
      universeId: p.universeSlug,
      universeSlug: p.universeSlug,
      universeAccentColor: p.accentColor,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      thumbnailUrl: p.cardImageUrl,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestSeller: false,
      totalStock: p.stock,
      isVaulted: p.isVaulted || p.stock <= 0,
      defaultVariantId: null,
    },
    cardImageFit: p.cardImageFit,
    cardImagePosition: p.cardImagePosition,
    badgeLabel: p.badgeLabel,
    addToBagLabel: p.addToBagLabel,
  };
}

export function PackageDetailClient({ slug }: PackageDetailClientProps) {
  const addItem = useRoomBagStore((s) => s.addItem);

  const [ready, setReady] = useState(false);
  const [pkg, setPkg] = useState<OrganizedPackage | null>(null);
  const [products, setProducts] = useState<MemberProductItem[]>([]);

  useEffect(() => {
    if (!slug) {
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);

    (async () => {
      try {
        const [foundPkg, allProducts] = await Promise.all([
          fetchResolvedPackageDetail(slug),
          fetchResolvedProductsForStorefront().catch(() => [] as OrganizedProduct[]),
        ]);
        if (!active) return;

        setPkg(foundPkg);
        if (foundPkg) {
          const members = allProducts
            .filter((p) => foundPkg.productIds.includes(p.id))
            .map(toMemberProduct);
          setProducts(members);
        } else {
          setProducts([]);
        }
        setReady(true);
      } catch {
        if (!active) return;
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="h-[360px] animate-pulse rounded-3xl border border-white/10 bg-[#0b0815]/75" />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => (
            <div
              key={slot}
              className="h-80 animate-pulse rounded-2xl border border-white/10 bg-[#0b0815]/75"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!pkg) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-white/15 bg-[#0b0815] p-10">
          <h1 className="font-serif text-2xl font-semibold text-white">
            Collection Unavailable
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            This Package or Collection is currently paused or does not exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Storefront
          </Link>
        </div>
      </section>
    );
  }

  const heroSrc = resolveImgSrc(pkg.heroImageUrl || pkg.bannerImageUrl);
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
    <section className="mx-auto w-full max-w-6xl px-4 py-8 pb-20">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/35 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Storefront</span>
        </Link>

        {pkg.universeSlug ? (
          <Link
            href={`/universes/${pkg.universeSlug}`}
            className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 hover:border-white/35"
          >
            {pkg.universeSlug} Universe
          </Link>
        ) : null}
      </div>

      {/* LARGE TOP HERO IMAGE & PACKAGE DETAILS */}
      <div
        className="relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[#06040b]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Large Top Banner Image */}
        <div
          className="relative h-72 w-full overflow-hidden md:h-[400px]"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${pkg.accentColor}40 0%, #06040b 85%)`,
          }}
        >
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={pkg.name}
              className="h-full w-full object-cover opacity-85"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06040b] via-[#06040b]/45 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
              style={{ backgroundColor: pkg.accentColor }}
            >
              <Layers className="h-3.5 w-3.5" />
              {pkg.badgeLabel || (pkg.kind === "COLLECTION" ? "Collection" : "Loadout")}
            </span>

            {savings > 0 ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-md">
                Save {formatEgp(savings)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Content Block Over Bottom Edge */}
        <div className="relative z-10 -mt-16 px-6 pb-8 md:px-10">
          <div className="rounded-3xl border border-white/15 bg-[#0b0815]/90 p-6 backdrop-blur-xl md:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: pkg.accentColor }} />
                  <span>
                    {pkg.kind === "COLLECTION" ? "Curated Collection" : "Room Bundle"}
                  </span>
                  <span>•</span>
                  <span>{products.length} Included Products</span>
                </div>

                <h1
                  dir="auto"
                  className="mt-2 font-serif text-3xl font-semibold text-white md:text-4xl"
                >
                  {pkg.name}
                </h1>

                {pkg.tagline ? (
                  <p dir="auto" className="mt-2 text-sm text-white/80">
                    {pkg.tagline}
                  </p>
                ) : null}

                {pkg.description ? (
                  <p
                    dir="auto"
                    className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]"
                  >
                    {pkg.description}
                  </p>
                ) : null}
              </div>

              {hasFixedPrice && pkg.finalPrice !== null ? (
                <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-white">
                      {formatEgp(pkg.finalPrice)}
                    </span>
                    {savings > 0 && pkg.originalPrice !== null ? (
                      <span className="text-sm text-[var(--color-text-muted)] line-through">
                        {formatEgp(pkg.originalPrice)}
                      </span>
                    ) : null}
                  </div>

                  {pkg.showAddPackBtn ? (
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
                      className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                      style={{ backgroundColor: pkg.accentColor }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{pkg.ctaLabel || "Add to Room"}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {pkg.specs.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                {pkg.specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-3.5"
                  >
                    <p dir="auto" className="text-[11px] font-semibold text-white/50">
                      {spec.label}
                    </p>
                    <p dir="auto" className="mt-1 text-xs font-semibold text-white/95">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* PRODUCTS INSIDE THIS COLLECTION / PACKAGE */}
      {pkg.showProductsInside ? (
        <div className="mt-12 space-y-6">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: pkg.accentColor }}
            >
              Inside This {pkg.kind === "COLLECTION" ? "Collection" : "Loadout"}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-white">
              Included Products ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-10 text-center text-sm text-white/60">
              No products assigned to this collection yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((item) => (
                <ProductCard
                  key={item.dto.id}
                  product={item.dto}
                  cardImageFit={item.cardImageFit}
                  cardImagePosition={item.cardImagePosition}
                  badgeLabel={item.badgeLabel}
                  addToBagLabel={item.addToBagLabel}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
