/**
 * @file src/modules/catalog/components/FreshDropsSection.tsx
 * @purpose Homepage Fresh Drops grid synced live with Supabase products (including newly added products in Admin), variants stock, and Universe accent colors.
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
  storeId: string;
  universeId: string;
  slug: string;
  name: string;
  subtitle: string | null;
  basePrice: number | string;
  compareAtPrice: number | string | null;
  thumbnailUrl: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
}

interface SbVariantRow {
  id: string;
  productId: string;
  stock: number;
  isDefault: boolean;
}

interface SbUniverseRow {
  id: string;
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
      const cached = localStorage.getItem("room_live_products_v1");
      if (cached) {
        const parsed = JSON.parse(cached) as ProductSummaryDTO[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore
    }

    let active = true;
    (async () => {
      try {
        const [prodRows, varRows, univRows] = await Promise.all([
          sbSelect<SbProductRow>(
            "products",
            "select=id,storeId,universeId,slug,name,subtitle,basePrice,compareAtPrice,thumbnailUrl,isFeatured,isNewArrival,isBestSeller,isActive&isActive=eq.true&isNewArrival=eq.true&order=createdAt.desc"
          ),
          sbSelect<SbVariantRow>("product_variants", "select=id,productId,stock,isDefault"),
          sbSelect<SbUniverseRow>("universes", "select=id,slug,accentColor"),
        ]);
        if (!active || prodRows.length === 0) return;

        const mapped: ProductSummaryDTO[] = prodRows.map((pRow) => {
          const uRow = univRows.find((u) => u.id === pRow.universeId);
          const pVars = varRows.filter((v) => v.productId === pRow.id);
          const totalStock = pVars.reduce((sum, v) => sum + Number(v.stock), 0);
          const defaultVar = pVars.find((v) => v.isDefault) ?? pVars[0] ?? null;

          return {
            id: pRow.id,
            storeId: pRow.storeId,
            universeId: pRow.universeId,
            universeSlug: uRow?.slug ?? "cars",
            universeAccentColor: uRow?.accentColor ?? "#ffffff",
            slug: pRow.slug,
            name: pRow.name,
            subtitle: pRow.subtitle,
            basePrice: Number(pRow.basePrice),
            compareAtPrice: pRow.compareAtPrice
              ? Number(pRow.compareAtPrice)
              : null,
            thumbnailUrl: pRow.thumbnailUrl,
            isFeatured: pRow.isFeatured,
            isNewArrival: pRow.isNewArrival,
            isBestSeller: pRow.isBestSeller,
            totalStock,
            isVaulted: totalStock <= 0,
            defaultVariantId: defaultVar?.id ?? null,
          };
        });

        setItems(mapped);
        localStorage.setItem("room_live_products_v1", JSON.stringify(mapped));
      } catch {
        // Keep cached/initial props
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
