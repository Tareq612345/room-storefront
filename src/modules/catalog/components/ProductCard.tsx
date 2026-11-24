"use client";

import { formatEgp } from "@shared/types/common";
import type { ProductSummaryDTO } from "../schema";

interface ProductCardProps {
  product: ProductSummaryDTO;
}

export function ProductCard({ product }: ProductCardProps) {
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
        <span
          className="rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm"
        >
          {product.universeSlug}
        </span>

        {product.isVaulted ? (
          <span className="rounded-full bg-[var(--color-vaulted)]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Vaulted
          </span>
        ) : product.isNewArrival ? (
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: product.universeAccentColor }}
          >
            Fresh Drop
          </span>
        ) : null}
      </div>

      {/* Info & CTA */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-white">
            {product.name}
          </h3>
          {product.subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
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
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-45"
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
