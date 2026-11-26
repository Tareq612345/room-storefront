/**
 * @file src/modules/universe-organizer/components/StorefrontUniverseCard.tsx
 * @purpose Renders a Universe card matching the live Storefront UniverseShowcaseGrid design with optional PNG symbol overlay.
 */

"use client";

import { getAssetPath } from "@shared/utils/asset-path";
import type { OrganizedUniverse } from "../schema";

interface StorefrontUniverseCardProps {
  universe: OrganizedUniverse;
  pausedLabel?: string;
  onClick?: () => void;
}

function buildUniverseGradient(accentColor: string): string {
  return `linear-gradient(180deg, #030305 0%, #0d0818 52%, ${accentColor} 100%)`;
}

export function StorefrontUniverseCard({
  universe,
  pausedLabel = "Paused",
  onClick,
}: StorefrontUniverseCardProps) {
  const gradient = buildUniverseGradient(universe.accentColor);
  const bannerSrc = universe.bannerUrl
    ? universe.bannerUrl.startsWith("data:") || universe.bannerUrl.startsWith("http")
      ? universe.bannerUrl
      : getAssetPath(universe.bannerUrl)
    : null;

  return (
    <div
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
      className={`group relative flex h-[420px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--color-border-subtle)] p-6 text-left transition-all duration-300 ${
        onClick ? "cursor-pointer hover:-translate-y-1 hover:border-[var(--color-border-strong)]" : ""
      } ${!universe.isActive ? "opacity-60" : ""}`}
      style={{
        background: gradient,
        boxShadow: "var(--shadow-card)",
      }}
    >
      {bannerSrc ? (
        <img
          src={bannerSrc}
          alt={universe.name}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: gradient }}
      />

      {/* Top Storefront Pill */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: universe.accentColor }}
          />
          Universe
        </span>
        {!universe.isActive ? (
          <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-md">
            {pausedLabel}
          </span>
        ) : (
          <span className="text-xs font-medium text-white/70 group-hover:text-white">
            Enter →
          </span>
        )}
      </div>

      {/* Optional PNG Symbol Overlay */}
      {universe.iconPngUrl ? (
        <div className="relative z-10 my-auto flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/15 bg-black/35 p-3 backdrop-blur-sm">
            <img
              src={universe.iconPngUrl}
              alt={`${universe.name} symbol`}
              className="max-h-full max-w-full object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.75)]"
            />
          </div>
        </div>
      ) : null}

      {/* Bottom Frosted Name & Tagline Pill */}
      <div
        className="relative z-10 mt-auto rounded-xl border border-white/15 px-5 py-4 text-center backdrop-blur-md transition-colors duration-300 group-hover:border-white/30"
        style={{ backgroundColor: "var(--color-surface-badge)" }}
      >
        <h2 dir="auto" className="font-serif text-lg font-semibold tracking-wide text-white">
          {universe.name || "Untitled Universe"}
        </h2>
        {universe.tagline ? (
          <p
            dir="auto"
            className="mt-1.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]"
          >
            {universe.tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
