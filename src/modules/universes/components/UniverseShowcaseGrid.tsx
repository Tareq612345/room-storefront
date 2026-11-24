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
        {universes.map((universe) => {
          const gradient = getCardGradient(universe.slug, universe.accentColor);

          return (
            <Link
              key={universe.id}
              href={`/universes/${universe.slug}`}
              className="group relative flex h-[420px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--color-border-subtle)] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--color-border-strong)]"
              style={{
                background: gradient,
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Mockup Bedroom Image with Brand Gradient Mask */}
              {universe.bannerUrl ? (
                <img
                  src={getAssetPath(universe.bannerUrl)}
                  alt={universe.name}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
                />
              ) : null}

              {/* Brand Gradient Overlay to preserve Crimson / Midnight / Orchid identity */}
              <div
                className="pointer-events-none absolute inset-0 opacity-80"
                style={{ background: gradient }}
              />

              {/* Top pill */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: universe.accentColor }}
                  />
                  Universe
                </span>
                <span className="text-xs font-medium text-white/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
                  Enter →
                </span>
              </div>

              {/* Bottom frosted pill matching reference screenshot */}
              <div
                className="relative z-10 mt-auto rounded-xl border border-white/15 px-5 py-4 text-center backdrop-blur-md transition-colors duration-300 group-hover:border-white/30"
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
