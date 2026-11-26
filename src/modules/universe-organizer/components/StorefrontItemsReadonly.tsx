/**
 * @file src/modules/universe-organizer/components/StorefrontItemsReadonly.tsx
 * @purpose Read-only Storefront Product Card and Offer Banner previews for the isolated Universe Organizer (preserves original item colors without applying any Universe color filters).
 */

"use client";

import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import { Check, Plus } from "lucide-react";
import type { SiteOfferBannerSource, SiteProductSource } from "../schema";

interface ReadonlyProductProps {
  product: SiteProductSource;
  isSelected: boolean;
  otherUniverseNames: string[];
  onToggle: () => void;
  labels: {
    selected: string;
    add: string;
    alsoIn: string;
  };
}

export function ReadonlyStorefrontProductCard({
  product,
  isSelected,
  otherUniverseNames,
  onToggle,
  labels,
}: ReadonlyProductProps) {
  const thumbSrc = product.thumbnailUrl
    ? product.thumbnailUrl.startsWith("data:") || product.thumbnailUrl.startsWith("http")
      ? product.thumbnailUrl
      : getAssetPath(product.thumbnailUrl)
    : null;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
        isSelected
          ? "border-emerald-400/70 ring-1 ring-emerald-400/35"
          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
      } bg-[var(--color-surface-card)]`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Storefront ProductCard Visual Preview (original product accent only — no universe filter) */}
      <div
        className="relative flex h-52 items-end justify-between overflow-hidden p-4"
        style={{
          background: `radial-gradient(circle at 50% 25%, ${product.originalAccentColor}33 0%, #07050c 78%)`,
        }}
      >
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={product.name}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
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
            style={{ backgroundColor: product.originalAccentColor }}
          >
            Fresh Drop
          </span>
        ) : null}
      </div>

      {/* Storefront Product Info (Read-Only) */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-[var(--color-text-primary)]">
            {product.name}
          </h3>
          {product.subtitle ? (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
              {product.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
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

          <span
            className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white"
            style={{
              backgroundColor: product.isVaulted
                ? "var(--color-vaulted)"
                : product.originalAccentColor,
            }}
          >
            {product.isVaulted ? "Vaulted" : "Claim Yours"}
          </span>
        </div>

        {/* Assignment Controls (No Product Editing) */}
        <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
          {otherUniverseNames.length > 0 ? (
            <p className="truncate text-[11px] text-white/55">
              {labels.alsoIn}: {otherUniverseNames.join(" • ")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              isSelected
                ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/15"
            }`}
          >
            {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{isSelected ? labels.selected : labels.add}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReadonlyOfferProps {
  offer: SiteOfferBannerSource;
  isSelected: boolean;
  otherUniverseNames: string[];
  onToggle: () => void;
  labels: {
    selected: string;
    add: string;
    alsoIn: string;
  };
}

export function ReadonlyStorefrontOfferBanner({
  offer,
  isSelected,
  otherUniverseNames,
  onToggle,
  labels,
}: ReadonlyOfferProps) {
  const accent = offer.originalAccentColor;

  if (offer.kind === "PROMO_BANNER") {
    return (
      <div
        className={`flex flex-col justify-between gap-4 rounded-2xl border p-6 transition-all ${
          isSelected
            ? "border-emerald-400/70 ring-1 ring-emerald-400/35"
            : "border-white/15 hover:border-white/30"
        }`}
        style={{
          background: `linear-gradient(135deg, #07050c 0%, ${accent}33 100%)`,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3
              dir="auto"
              className="font-serif text-xl font-semibold md:text-2xl"
              style={{ color: offer.textColor || "#ffffff" }}
            >
              {offer.title}
            </h3>
            {offer.subtitle ? (
              <p dir="auto" className="mt-1 text-xs text-white/75">
                {offer.subtitle}
              </p>
            ) : null}
          </div>
          <span
            className="shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: accent }}
          >
            {offer.ctaLabel || "Claim Yours"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5">
          <div className="min-w-0 flex-1">
            {otherUniverseNames.length > 0 ? (
              <p className="truncate text-[11px] text-white/60">
                {labels.alsoIn}: {otherUniverseNames.join(" • ")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              isSelected
                ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                : "border border-white/15 bg-black/50 text-white/90 hover:bg-white/15"
            }`}
          >
            {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{isSelected ? labels.selected : labels.add}</span>
          </button>
        </div>
      </div>
    );
  }

  // LOADOUT Storefront Banner Appearance (original bundle accent only — no universe filter)
  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 ${
        isSelected
          ? "border-emerald-400/70 ring-1 ring-emerald-400/35"
          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
      } bg-[var(--color-surface-card)]`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
            {offer.itemCount ?? 3} Pieces
          </span>
          {offer.savingsAmount && offer.savingsAmount > 0 ? (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accent }}
            >
              Save {formatEgp(offer.savingsAmount)}
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 font-serif text-xl font-semibold text-white">
          {offer.title}
        </h3>
        {offer.subtitle ? (
          <p className="mt-2 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
            {offer.subtitle}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
        <div>
          {offer.finalPrice !== null ? (
            <div className="text-lg font-bold text-white">
              {formatEgp(offer.finalPrice)}
            </div>
          ) : null}
          {offer.savingsAmount && offer.savingsAmount > 0 && offer.originalPrice !== null ? (
            <div className="text-xs text-[var(--color-text-muted)] line-through">
              {formatEgp(offer.originalPrice)}
            </div>
          ) : null}
        </div>

        <span
          className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: accent }}
        >
          {offer.ctaLabel || "Add to Room"}
        </span>
      </div>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
        {otherUniverseNames.length > 0 ? (
          <p className="truncate text-[11px] text-white/55">
            {labels.alsoIn}: {otherUniverseNames.join(" • ")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            isSelected
              ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
              : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/15"
          }`}
        >
          {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isSelected ? labels.selected : labels.add}</span>
        </button>
      </div>
    </article>
  );
}
