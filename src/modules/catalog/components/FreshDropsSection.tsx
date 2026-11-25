/**
 * @file src/modules/catalog/components/FreshDropsSection.tsx
 * @purpose Homepage Fresh Drops grid synced live with Admin-saved product prices, stock/Vaulted state, and Universe accent colors.
 */

"use client";

import { useEffect, useState } from "react";
import type { ProductSummaryDTO } from "../schema";
import { ProductCard } from "./ProductCard";

interface FreshDropsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  products: ProductSummaryDTO[];
}

interface AdminProductOverride {
  id: string;
  name: string;
  universe: string;
  price: number;
  stock: number;
}

interface AdminUniverseOverride {
  slug: string;
  accentColor: string;
}

export function FreshDropsSection({
  title = "Fresh Drops",
  subtitle = "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
  products,
}: FreshDropsSectionProps) {
  const [items, setItems] = useState<ProductSummaryDTO[]>(products);

  useEffect(() => {
    try {
      const rawProd = localStorage.getItem("room_admin_products_v1");
      const rawUniv = localStorage.getItem("room_admin_universes_v1");
      const prodOverrides: AdminProductOverride[] = rawProd
        ? (JSON.parse(rawProd) as AdminProductOverride[])
        : [];
      const univOverrides: AdminUniverseOverride[] = rawUniv
        ? (JSON.parse(rawUniv) as AdminUniverseOverride[])
        : [];

      if (prodOverrides.length === 0 && univOverrides.length === 0) return;

      setItems(
        products.map((p) => {
          const pMatch = prodOverrides.find(
            (o) => o.name === p.name || o.id === p.id
          );
          const uMatch = univOverrides.find((u) => u.slug === p.universeSlug);

          const nextStock = pMatch ? pMatch.stock : p.totalStock;
          return {
            ...p,
            basePrice: pMatch ? pMatch.price : p.basePrice,
            totalStock: nextStock,
            isVaulted: nextStock <= 0,
            universeAccentColor: uMatch
              ? uMatch.accentColor
              : p.universeAccentColor,
          };
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [products]);

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
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
