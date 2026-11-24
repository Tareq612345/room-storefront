/**
 * @file src/modules/universes/components/UniverseShowcaseGrid.tsx
 * @purpose Universe Showcase Grid: 3-card Crimson/Midnight/Orchid display with bedroom mockups, frosted bottom badges, and hover sheen motion.
 */

import { getAssetPath } from "@shared/utils/asset-path";
import Link from "next/link";
import type { UniverseDTO } from "../schema";

interface UniverseShowcaseGridProps {
  universes: UniverseDTO[];
}

function getCardGradient(slug: string, accentColor: string): string {
  if (slug === "cars") return "var(--gradient-universe-crimson)";
  if (slug === "gaming") return "var(--gradient-universe-midnight)";
  if (slug === "anime") return "var(--gradient-universe-orchid)";
  return `linear-gradient(180deg, #030305 0%, #120d21 55%, ${accentColor} 100%)`;
}

export function UniverseShowcaseGrid({ universes }: UniverseShowcaseGridProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {universes.map((universe, idx) => {
          const gradient = getCardGradient(universe.slug, universe.accentColor);

          return (
            <Link
              key={universe.id}
              href={`/universes/${universe.slug}`}
              className="animate-fade-up group relative flex h-[430px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--color-border-subtle)] p-6 transition-all duration-500 hover:-translate-y-2 hover:border-white/35"
              style={{
                background: gradient,
                boxShadow: "var(--shadow-card)",
                animationDelay: `${idx * 120}ms`,
              }}
            >
              {/* Mockup Bedroom Image with Brand Gradient Mask */}
              {universe.bannerUrl ? (
                <img
                  src={getAssetPath(universe.bannerUrl)}
                  alt={universe.name}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity transition-all duration-700 group-hover:scale-110 group-hover:opacity-65"
                />
              ) : null}

              {/* Brand Gradient Overlay to preserve Crimson / Midnight / Orchid identity */}
              <div
                className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-70"
                style={{ background: gradient }}
              />

              {/* Diagonal Light Sheen Sweep on Hover */}
              <div
                className="animate-card-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100"
                aria-hidden="true"
              />

              {/* Hover Accent Rim Glow */}
              <div
                className="pointer-events-none absolute inset-x-6 bottom-0 h-1 rounded-full opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-90"
                style={{ backgroundColor: universe.accentColor }}
              />

              {/* Top pill */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                  <span
                    className="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125"
                    style={{ backgroundColor: universe.accentColor }}
                  />
                  Universe
                </span>
                <span className="text-xs font-medium text-white/70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-white">
                  Enter →
                </span>
              </div>

              {/* Bottom frosted pill matching reference screenshot */}
              <div
                className="relative z-10 mt-auto rounded-xl border border-white/15 px-5 py-4 text-center backdrop-blur-md transition-all duration-300 group-hover:border-white/35 group-hover:bg-black/65"
                style={{ backgroundColor: "var(--color-surface-badge)" }}
              >
                <h2 className="font-serif text-lg font-semibold tracking-wide text-white">
                  {universe.name}
                </h2>
                {universe.tagline ? (
                  <p className="mt-1.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                    {universe.tagline}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
