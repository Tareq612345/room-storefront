/**
 * @file src/modules/product-organizer/components/StorefrontProductBannerCard.tsx
 * @purpose Renders the outer Product Container / Banner Card with clean image framing (cover/contain + position) matching the ROOM Storefront aesthetic.
 */

"use client";

import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import type { OrganizedProduct } from "../schema";

interface StorefrontProductBannerCardProps {
  product: OrganizedProduct;
  pausedLabel?: string;
  onClick?: () => void;
}

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

export function StorefrontProductBannerCard({
  product,
  pausedLabel = "Paused",
  onClick,
}: StorefrontProductBannerCardProps) {
  const imgSrc = resolveImgSrc(product.cardImageUrl);
  const posClass =
    product.cardImagePosition === "top"
      ? "object-top"
      : product.cardImagePosition === "bottom"
        ? "object-bottom"
        : "object-center";

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-left transition-all duration-300 ${
        onClick
          ? "cursor-pointer hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
          : ""
      } ${!product.isActive ? "opacity-60" : ""}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Well-framed Outer Image Banner */}
      <div
        className="relative flex h-56 items-start justify-between overflow-hidden p-3.5"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${product.accentColor}30 0%, #07050c 82%)`,
        }}
      >
        {imgSrc ? (
          product.cardImageFit === "contain" ? (
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

        {/* Top-anchored Badges so the center/bottom of the image stays clean */}
        <div className="relative z-10 flex items-center gap-1.5">
          <span className="rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
            {product.universeSlug}
          </span>
          {!product.isActive ? (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-sm">
              {pausedLabel}
            </span>
          ) : null}
        </div>

        {product.isVaulted || product.stock <= 0 ? (
          <span className="relative z-10 rounded-full bg-[var(--color-vaulted)]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Vaulted
          </span>
        ) : product.badgeLabel ? (
          <span
            className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: product.accentColor }}
          >
            {product.badgeLabel}
          </span>
        ) : null}
      </div>

      {/* Info & CTA */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3
            dir="auto"
            className="line-clamp-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-white"
          >
            {product.name || "Untitled Product"}
          </h3>
          {product.subtitle ? (
            <p
              dir="auto"
              className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]"
            >
              {product.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-white">
              {formatEgp(product.basePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice ? (
              <span className="text-xs text-[var(--color-text-muted)] line-through">
                {formatEgp(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          <span
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
            style={{
              backgroundColor:
                product.isVaulted || product.stock <= 0
                  ? "var(--color-vaulted)"
                  : product.accentColor,
            }}
          >
            {product.isVaulted || product.stock <= 0
              ? "Vaulted"
              : product.addToBagLabel || "Claim Yours"}
          </span>
        </div>
      </div>
    </article>
  );
}
