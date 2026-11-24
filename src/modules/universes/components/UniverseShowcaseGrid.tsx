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
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {universes.map((universe) => {
          const gradient = getCardGradient(universe.slug, universe.accentColor);

          return (
            <Link
              key={universe.id}
              href={`/universes/${universe.slug}`}
              className="group relative flex h-[410px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--color-border-subtle)] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--color-border-strong)]"
              style={{
                background: gradient,
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Top subtle ambient sheen */}
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: universe.accentColor }}
                  />
                  Universe
                </span>
                <span className="text-xs font-medium text-white/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
                  Enter →
                </span>
              </div>

              {/* Center subtle watermark / visual depth */}
              <div className="pointer-events-none my-auto flex items-center justify-center opacity-15 transition-opacity duration-300 group-hover:opacity-25">
                <div
                  className="h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: universe.accentColor }}
                />
              </div>

              {/* Bottom frosted pill matching reference screenshot */}
              <div
                className="relative z-10 rounded-xl border border-white/10 px-5 py-4 text-center backdrop-blur-md transition-colors duration-300 group-hover:border-white/25"
                style={{ backgroundColor: "var(--color-surface-badge)" }}
              >
                <h2 className="font-serif text-lg font-semibold tracking-wide text-white">
                  {universe.name}
                </h2>
                {universe.tagline ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
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
