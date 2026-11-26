/**
 * @file src/modules/catalog/components/FreshDropsSection.tsx
 * @purpose Homepage Fresh Drops grid powered by the isolated Product Data Manager (@modules/product-organizer) with zero stale Vaulted flash.
 */

"use client";

import {
  fetchResolvedProductsForStorefront,
  getCachedOrganizerProducts,
  type OrganizedProduct,
} from "@modules/product-organizer";
import { useEffect, useState } from "react";
import type { ProductSummaryDTO } from "../schema";
import { ProductCard } from "./ProductCard";

interface FreshDropsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  products: ProductSummaryDTO[];
}

interface DisplayItem {
  dto: ProductSummaryDTO;
  cardImageFit: "cover" | "contain";
  cardImagePosition: "center" | "top" | "bottom";
  badgeLabel: string;
  addToBagLabel: string;
}

function fromOrganized(p: OrganizedProduct): DisplayItem {
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

function fromFallback(p: ProductSummaryDTO): DisplayItem {
  return {
    dto: p,
    cardImageFit: "cover",
    cardImagePosition: "center",
    badgeLabel: p.isNewArrival ? "Fresh Drop" : "",
    addToBagLabel: "Claim Yours",
  };
}

export function FreshDropsSection({
  title = "Fresh Drops",
  subtitle = "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
  products,
}: FreshDropsSectionProps) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = getCachedOrganizerProducts();
    if (cached && cached.length > 0) {
      setItems(cached.map(fromOrganized));
      setReady(true);
    }

    let active = true;
    (async () => {
      try {
        const resolved = await fetchResolvedProductsForStorefront();
        if (!active) return;
        setItems(resolved.map(fromOrganized));
        setReady(true);
      } catch {
        if (!active) return;
        setItems((prev) =>
          prev.length > 0 ? prev : products.map(fromFallback)
        );
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [products]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6 h-12 w-56 animate-pulse rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            New Arrivals
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
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
    </section>
  );
}
