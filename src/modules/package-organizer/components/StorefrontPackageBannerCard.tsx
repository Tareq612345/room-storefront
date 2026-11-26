/**
 * @file src/modules/package-organizer/components/StorefrontPackageBannerCard.tsx
 * @purpose Renders the outer Package / Collection Banner Card with uploaded banner image framing, piece count, savings badge, and Storefront aesthetic.
 */

"use client";

import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import type { OrganizedPackage } from "../schema";

interface StorefrontPackageBannerCardProps {
  pkg: OrganizedPackage;
  pausedLabel?: string;
  onClick?: () => void;
}

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

export function StorefrontPackageBannerCard({
  pkg,
  pausedLabel = "Paused",
  onClick,
}: StorefrontPackageBannerCardProps) {
  const imgSrc = resolveImgSrc(pkg.bannerImageUrl);
  const posClass =
    pkg.bannerImagePosition === "top"
      ? "object-top"
      : pkg.bannerImagePosition === "bottom"
        ? "object-bottom"
        : "object-center";

  const hasFixedPrice =
    pkg.pricingMode === "FIXED_PRICE" && pkg.finalPrice !== null;
  const savings =
    hasFixedPrice &&
    pkg.originalPrice !== null &&
    pkg.finalPrice !== null &&
    pkg.originalPrice > pkg.finalPrice
      ? pkg.originalPrice - pkg.finalPrice
      : 0;

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
      className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-left transition-all duration-300 ${
        onClick
          ? "cursor-pointer hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
          : ""
      } ${!pkg.isActive ? "opacity-60" : ""}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Outer Banner Image Stage */}
      <div
        className="relative flex h-44 items-start justify-between overflow-hidden p-4"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${pkg.accentColor}36 0%, #07050c 82%)`,
        }}
      >
        {imgSrc ? (
          pkg.bannerImageFit === "contain" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 pt-10">
              <img
                src={imgSrc}
                alt={pkg.name}
                className={`max-h-full max-w-full object-contain ${posClass} drop-shadow-[0_10px_24px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105`}
              />
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={pkg.name}
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${posClass} opacity-80 transition-transform duration-500 group-hover:scale-105`}
            />
          )
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45" />

        <div className="relative z-10 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
            {pkg.productIds.length > 0
              ? `${pkg.productIds.length} ${pkg.productIds.length === 1 ? "Item" : "Items"}`
              : pkg.badgeLabel || (pkg.kind === "COLLECTION" ? "Collection" : "Loadout")}
          </span>
          {!pkg.isActive ? (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-sm">
              {pausedLabel}
            </span>
          ) : null}
        </div>

        {savings > 0 ? (
          <span
            className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: pkg.accentColor }}
          >
            Save {formatEgp(savings)}
          </span>
        ) : pkg.badgeLabel ? (
          <span
            className="relative z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: pkg.accentColor }}
          >
            {pkg.badgeLabel}
          </span>
        ) : null}
      </div>

      {/* Info & Footer */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 dir="auto" className="font-serif text-lg font-semibold text-white">
            {pkg.name || "Untitled Collection"}
          </h3>
          {pkg.tagline ? (
            <p
              dir="auto"
              className="mt-1.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]"
            >
              {pkg.tagline}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
          <div>
            {hasFixedPrice && pkg.finalPrice !== null ? (
              <>
                <div className="text-lg font-bold text-white">
                  {formatEgp(pkg.finalPrice)}
                </div>
                {savings > 0 && pkg.originalPrice !== null ? (
                  <div className="text-xs text-[var(--color-text-muted)] line-through">
                    {formatEgp(pkg.originalPrice)}
                  </div>
                ) : null}
              </>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider text-white/65">
                {pkg.kind === "COLLECTION" ? "Curated Collection" : "Room Pack"}
              </span>
            )}
          </div>

          <span
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: pkg.accentColor }}
          >
            {pkg.ctaLabel || (hasFixedPrice ? "Add to Room" : "Explore")}
          </span>
        </div>
      </div>
    </article>
  );
}
