"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import type { ProductSummaryDTO } from "../schema";

interface ProductCardProps {
  product: ProductSummaryDTO;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useRoomBagStore((s) => s.addItem);

  const handleClaim = () => {
    if (product.isVaulted) return;
    addItem({
      id: product.defaultVariantId ?? product.id,
      itemType: "PRODUCT",
      title: product.name,
      subtitle: product.subtitle,
      unitPrice: product.basePrice,
      accentColor: product.universeAccentColor,
      imageUrl: product.thumbnailUrl,
    });
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Visual Preview */}
      <div
        className="relative flex h-56 items-end justify-between overflow-hidden p-4"
        style={{
          background: `radial-gradient(circle at 50% 25%, ${product.universeAccentColor}33 0%, #07050c 78%)`,
        }}
      >
        {product.thumbnailUrl ? (
          <img
            src={getAssetPath(product.thumbnailUrl)}
            alt={product.name}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <span className="relative z-10 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
          {product.universeSlug}
        </span>

        {product.isVaulted ? (
          <span className="relative z-10 rounded-full bg-[var(--color-vaulted)]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Vaulted
          </span>
        ) : product.isNewArrival ? (
          <span
            className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: product.universeAccentColor }}
          >
            Fresh Drop
          </span>
        ) : null}
      </div>

      {/* Info & CTA */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-white">
            {product.name}
          </h3>
          {product.subtitle ? (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
              {product.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-white">
              {formatEgp(product.basePrice)}
            </span>
            {product.compareAtPrice ? (
              <span className="text-xs text-[var(--color-text-muted)] line-through">
                {formatEgp(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            disabled={product.isVaulted}
            onClick={handleClaim}
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              backgroundColor: product.isVaulted
                ? "var(--color-vaulted)"
                : product.universeAccentColor,
              color: "#ffffff",
            }}
          >
            {product.isVaulted ? "Vaulted" : "Claim Yours"}
          </button>
        </div>
      </div>
    </article>
  );
}
