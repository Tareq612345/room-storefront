/**
 * @file src/modules/catalog/components/ProductCard.tsx
 * @purpose Product Card UI: Displays product banner (with clean cover/contain image framing), EGP pricing, Vaulted/Fresh Drop badge, links to /product/?slug=..., and triggers 'Claim Yours' My Room action.
 */

"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import Link from "next/link";
import type { ProductSummaryDTO } from "../schema";

interface ProductCardProps {
  product: ProductSummaryDTO;
  cardImageFit?: "cover" | "contain";
  cardImagePosition?: "center" | "top" | "bottom";
  badgeLabel?: string;
  addToBagLabel?: string;
}

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

export function ProductCard({
  product,
  cardImageFit = "cover",
  cardImagePosition = "center",
  badgeLabel,
  addToBagLabel,
}: ProductCardProps) {
  const addItem = useRoomBagStore((s) => s.addItem);
  const productHref = `/product/?slug=${encodeURIComponent(product.slug)}`;
  const imgSrc = resolveImgSrc(product.thumbnailUrl);
  const posClass =
    cardImagePosition === "top"
      ? "object-top"
      : cardImagePosition === "bottom"
        ? "object-bottom"
        : "object-center";

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
      {/* Visual Preview (clickable to inner Product Page) */}
      <Link
        href={productHref}
        className="relative flex h-56 items-start justify-between overflow-hidden p-3.5"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${product.universeAccentColor}30 0%, #07050c 82%)`,
        }}
      >
        {imgSrc ? (
          cardImageFit === "contain" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5 pt-11">
              <img
                src={imgSrc}
                alt={product.name}
                className={`max-h-full max-w-full object-contain ${posClass} drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)] transition-transform duration-500 group-hover:scale-105`}
              />
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={product.name}
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${posClass} opacity-85 transition-transform duration-500 group-hover:scale-105`}
            />
          )
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        <span className="relative z-10 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
          {product.universeSlug}
        </span>

        {product.isVaulted ? (
          <span className="relative z-10 rounded-full bg-[var(--color-vaulted)]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Vaulted
          </span>
        ) : badgeLabel || product.isNewArrival ? (
          <span
            className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: product.universeAccentColor }}
          >
            {badgeLabel || "Fresh Drop"}
          </span>
        ) : null}
      </Link>

      {/* Info & CTA */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <Link href={productHref} className="block">
          <h3 className="line-clamp-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-white">
            {product.name}
          </h3>
          {product.subtitle ? (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
              {product.subtitle}
            </p>
          ) : null}
        </Link>

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
            {product.isVaulted ? "Vaulted" : addToBagLabel || "Claim Yours"}
          </button>
        </div>
      </div>
    </article>
  );
}
