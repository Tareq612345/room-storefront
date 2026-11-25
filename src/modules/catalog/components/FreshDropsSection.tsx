/**
 * @file src/modules/catalog/components/FreshDropsSection.tsx
 * @purpose Homepage Fresh Drops grid synced live with Supabase products, variants stock, and Universe accent colors.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { useEffect, useState } from "react";
import type { ProductSummaryDTO } from "../schema";
import { ProductCard } from "./ProductCard";

interface FreshDropsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  products: ProductSummaryDTO[];
}

interface SbProductRow {
  id: string;
  slug: string;
  basePrice: number | string;
}

interface SbVariantRow {
  productId: string;
  stock: number;
}

interface SbUniverseRow {
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
    let active = true;
    (async () => {
      try {
        const [prodRows, varRows, univRows] = await Promise.all([
          sbSelect<SbProductRow>("products", "select=id,slug,basePrice"),
          sbSelect<SbVariantRow>("product_variants", "select=productId,stock"),
          sbSelect<SbUniverseRow>("universes", "select=slug,accentColor"),
        ]);
        if (!active) return;

        setItems(
          products.map((p) => {
            const pRow = prodRows.find((r) => r.slug === p.slug || r.id === p.id);
            const uRow = univRows.find((u) => u.slug === p.universeSlug);
            const pVars = varRows.filter(
              (v) => v.productId === (pRow?.id ?? p.id)
            );
            const totalStock =
              pVars.length > 0
                ? pVars.reduce((sum, v) => sum + Number(v.stock), 0)
                : p.totalStock;

            return {
              ...p,
              basePrice: pRow ? Number(pRow.basePrice) : p.basePrice,
              totalStock,
              isVaulted: totalStock <= 0,
              universeAccentColor: uRow
                ? uRow.accentColor
                : p.universeAccentColor,
            };
          })
        );
      } catch {
        // Keep initial props
      }
    })();
    return () => {
      active = false;
    };
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
