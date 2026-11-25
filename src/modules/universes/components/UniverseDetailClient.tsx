/**
 * @file src/modules/universes/components/UniverseDetailClient.tsx
 * @purpose Client wrapper for /universes/[slug]/ that syncs hero banner, badge, and all product cards with live Supabase colors, prices, and stock.
 */

"use client";

import type { ProductSummaryDTO } from "@modules/catalog";
import { ProductCard } from "@modules/catalog";
import { sbSelect } from "@shared/db/supabase-rest";
import { useEffect, useState } from "react";
import type { UniverseDTO } from "../schema";

interface UniverseDetailClientProps {
  initialUniverse: UniverseDTO;
  initialProducts: ProductSummaryDTO[];
}

interface SbUniverseRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  accentColor: string;
}

interface SbProductRow {
  id: string;
  slug: string;
  name: string;
  basePrice: number | string;
}

interface SbVariantRow {
  productId: string;
  stock: number;
}

export function UniverseDetailClient({
  initialUniverse,
  initialProducts,
}: UniverseDetailClientProps) {
  const [universe, setUniverse] = useState<UniverseDTO>(initialUniverse);
  const [products, setProducts] = useState<ProductSummaryDTO[]>(initialProducts);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [univRows, prodRows, varRows] = await Promise.all([
          sbSelect<SbUniverseRow>(
            "universes",
            `select=id,slug,name,tagline,description,accentColor&slug=eq.${encodeURIComponent(initialUniverse.slug)}`
          ),
          sbSelect<SbProductRow>("products", "select=id,slug,name,basePrice"),
          sbSelect<SbVariantRow>("product_variants", "select=productId,stock"),
        ]);

        if (!active) return;

        const liveUniv = univRows[0];
        if (liveUniv) {
          setUniverse((prev) => ({
            ...prev,
            name: liveUniv.name,
            tagline: liveUniv.tagline,
            description: liveUniv.description,
            accentColor: liveUniv.accentColor,
          }));
          document.documentElement.style.setProperty(
            "--color-accent",
            liveUniv.accentColor
          );
        }

        const nextAccent = liveUniv?.accentColor ?? initialUniverse.accentColor;

        setProducts((prev) =>
          prev.map((p) => {
            const pRow = prodRows.find((r) => r.slug === p.slug || r.id === p.id);
            const pVars = varRows.filter((v) => v.productId === (pRow?.id ?? p.id));
            const totalStock =
              pVars.length > 0
                ? pVars.reduce((sum, v) => sum + Number(v.stock), 0)
                : p.totalStock;

            return {
              ...p,
              basePrice: pRow ? Number(pRow.basePrice) : p.basePrice,
              totalStock,
              isVaulted: totalStock <= 0,
              universeAccentColor: nextAccent,
            };
          })
        );
      } catch {
        // Keep initial SSR props on offline/error
      }
    })();
    return () => {
      active = false;
    };
  }, [initialUniverse.slug, initialUniverse.accentColor]);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div
        className="rounded-3xl border border-[var(--color-border-subtle)] p-8 md:p-10 transition-colors duration-300"
        style={{
          background: `linear-gradient(135deg, #05030a 0%, ${universe.accentColor}2e 100%)`,
        }}
      >
        <span
          className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
          style={{ backgroundColor: universe.accentColor }}
        >
          Universe
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-white md:text-4xl">
          {universe.name}
        </h1>
        {universe.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {universe.description}
          </p>
        ) : null}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
