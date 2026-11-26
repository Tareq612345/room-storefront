/**
 * @file src/modules/universes/components/UniverseDetailClient.tsx
 * @purpose Universe Detail View (/universes/[slug]/ and /universe/?slug=): consumes resolved Universe identity, PNG symbol, products (enriched with isolated Product Data Manager outer cards), and offer banners without stale flash or color-filter overrides.
 */

"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import type { ProductSummaryDTO } from "@modules/catalog";
import { ProductCard } from "@modules/catalog";
import {
  fetchResolvedProductsForStorefront,
  type OrganizedProduct,
} from "@modules/product-organizer";
import {
  fetchResolvedUniverseDetail,
  type OrganizedUniverse,
  type SiteOfferBannerSource,
} from "@modules/universe-organizer";
import { formatEgp } from "@shared/types/common";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UniverseDTO } from "../schema";

interface UniverseDetailClientProps {
  initialUniverse: UniverseDTO | null;
  initialProducts: ProductSummaryDTO[];
  dynamicSlug?: string;
}

interface EnrichedProductCardItem {
  dto: ProductSummaryDTO;
  cardImageFit: "cover" | "contain";
  cardImagePosition: "center" | "top" | "bottom";
  badgeLabel?: string;
  addToBagLabel?: string;
}

export function UniverseDetailClient({
  initialUniverse,
  initialProducts,
  dynamicSlug,
}: UniverseDetailClientProps) {
  const addItem = useRoomBagStore((s) => s.addItem);
  const targetSlug = dynamicSlug ?? initialUniverse?.slug ?? "";

  const [ready, setReady] = useState(false);
  const [universe, setUniverse] = useState<OrganizedUniverse | null>(null);
  const [products, setProducts] = useState<EnrichedProductCardItem[]>([]);
  const [offers, setOffers] = useState<SiteOfferBannerSource[]>([]);

  useEffect(() => {
    if (!targetSlug) {
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);

    (async () => {
      try {
        const [detail, organizedProducts] = await Promise.all([
          fetchResolvedUniverseDetail(targetSlug),
          fetchResolvedProductsForStorefront().catch(() => [] as OrganizedProduct[]),
        ]);
        if (!active) return;

        setUniverse(detail.universe);

        if (detail.universe) {
          document.documentElement.style.setProperty(
            "--color-accent",
            detail.universe.accentColor
          );
          document.documentElement.setAttribute("data-universe", detail.universe.slug);
        }

        // Preserve each product's own original color (no universe color filter applied)
        setProducts(
          detail.products.map((p) => {
            const custom = organizedProducts.find(
              (op) => op.id === p.id || op.slug === p.slug
            );
            return {
              dto: {
                id: p.id,
                storeId: "store_room_egypt",
                universeId: p.universeId,
                universeSlug: custom?.universeSlug ?? p.universeSlug,
                universeAccentColor: custom?.accentColor ?? p.originalAccentColor,
                slug: custom?.slug ?? p.slug,
                name: custom?.name ?? p.name,
                subtitle: custom?.subtitle ?? p.subtitle,
                basePrice: custom?.basePrice ?? p.basePrice,
                compareAtPrice:
                  custom !== undefined ? custom.compareAtPrice : p.compareAtPrice,
                thumbnailUrl: custom?.cardImageUrl ?? p.thumbnailUrl,
                isFeatured: true,
                isNewArrival: custom?.isNewArrival ?? p.isNewArrival,
                isBestSeller: false,
                totalStock: custom?.stock ?? p.totalStock,
                isVaulted: custom
                  ? custom.isVaulted || custom.stock <= 0
                  : p.isVaulted,
                defaultVariantId: p.defaultVariantId ?? null,
              },
              cardImageFit: custom?.cardImageFit ?? "cover",
              cardImagePosition: custom?.cardImagePosition ?? "center",
              badgeLabel: custom?.badgeLabel,
              addToBagLabel: custom?.addToBagLabel,
            };
          })
        );

        setOffers(detail.offers);
        setReady(true);
      } catch {
        if (!active) return;
        if (initialUniverse) {
          const now = new Date().toISOString();
          setUniverse({
            id: initialUniverse.id,
            slug: initialUniverse.slug,
            name: initialUniverse.name,
            tagline: initialUniverse.tagline ?? "",
            description: initialUniverse.description ?? "",
            accentColor: initialUniverse.accentColor,
            iconPngUrl: null,
            bannerUrl: initialUniverse.bannerUrl,
            sortOrder: initialUniverse.sortOrder,
            isActive: initialUniverse.isActive,
            productIds: initialProducts.map((p) => p.id),
            offerIds: [],
            createdAt: now,
            updatedAt: now,
          });
          setProducts(
            initialProducts.map((dto) => ({
              dto,
              cardImageFit: "cover",
              cardImagePosition: "center",
            }))
          );
        }
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [targetSlug, initialUniverse, initialProducts]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="h-44 animate-pulse rounded-3xl border border-[var(--color-border-subtle)] bg-[#0b0815]/75" />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => (
            <div
              key={slot}
              className="h-80 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[#0b0815]/75"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!universe) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-white/15 bg-[#0b0815] p-10">
          <h1 className="font-serif text-2xl font-semibold text-white">
            Universe Unavailable
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            This Universe is currently paused or does not exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
          >
            Back to Storefront
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Universe Hero */}
      <div
        className="rounded-3xl border border-[var(--color-border-subtle)] p-8 md:p-10 transition-colors duration-300"
        style={{
          background: `linear-gradient(135deg, #05030a 0%, ${universe.accentColor}2e 100%)`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
            style={{ backgroundColor: universe.accentColor }}
          >
            Universe
          </span>
          {universe.iconPngUrl ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/35 p-2 backdrop-blur-sm">
              <img
                src={universe.iconPngUrl}
                alt={`${universe.name} symbol`}
                className="max-h-full max-w-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]"
              />
            </div>
          ) : null}
        </div>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-white md:text-4xl">
          {universe.name}
        </h1>
        {universe.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {universe.description}
          </p>
        ) : null}
      </div>

      {/* Assigned Products (original product colors preserved) */}
      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
      ) : null}

      {/* Assigned Offer Banners (original offer colors preserved) */}
      {offers.length > 0 ? (
        <div className="mt-12 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Featured Offers
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-white">
              Loadouts &amp; Drops
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {offers.map((offer) => {
              const accent = offer.originalAccentColor;

              if (offer.kind === "PROMO_BANNER") {
                return (
                  <div
                    key={offer.id}
                    className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/15 p-7 md:col-span-3 md:flex-row md:items-center"
                    style={{
                      background: `linear-gradient(135deg, #07050c 0%, ${accent}33 100%)`,
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div>
                      <h3
                        dir="auto"
                        className="font-serif text-xl font-semibold md:text-2xl"
                        style={{ color: offer.textColor || "#ffffff" }}
                      >
                        {offer.title}
                      </h3>
                      {offer.subtitle ? (
                        <p dir="auto" className="mt-1 text-xs text-white/75">
                          {offer.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={offer.ctaUrl || "/"}
                      className="shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accent }}
                    >
                      {offer.ctaLabel || "Claim Yours"}
                    </Link>
                  </div>
                );
              }

              return (
                <article
                  key={offer.id}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
                        {offer.itemCount ?? 3} Pieces
                      </span>
                      {offer.savingsAmount && offer.savingsAmount > 0 ? (
                        <span
                          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: accent }}
                        >
                          Save {formatEgp(offer.savingsAmount)}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 font-serif text-xl font-semibold text-white">
                      {offer.title}
                    </h3>
                    {offer.subtitle ? (
                      <p className="mt-2 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                        {offer.subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
                    <div>
                      {offer.finalPrice !== null ? (
                        <div className="text-lg font-bold text-white">
                          {formatEgp(offer.finalPrice)}
                        </div>
                      ) : null}
                      {offer.savingsAmount &&
                      offer.savingsAmount > 0 &&
                      offer.originalPrice !== null ? (
                        <div className="text-xs text-[var(--color-text-muted)] line-through">
                          {formatEgp(offer.originalPrice)}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: offer.id,
                          itemType: "BUNDLE",
                          title: offer.title,
                          subtitle: offer.subtitle,
                          unitPrice: offer.finalPrice ?? 0,
                          accentColor: accent,
                        })
                      }
                      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accent }}
                    >
                      {offer.ctaLabel || "Add to Room"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
