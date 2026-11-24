import { formatEgp } from "@shared/types/common";
import type { BundleSummaryDTO } from "../schema";

interface LoadoutsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  loadouts: BundleSummaryDTO[];
}

export function LoadoutsSection({
  title = "Signature Loadouts",
  subtitle = "Full room setups bundled for maximum drip & instant savings",
  loadouts,
}: LoadoutsSectionProps) {
  if (loadouts.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Room Bundles
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white md:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {loadouts.map((loadout) => (
          <article
            key={loadout.id}
            className="flex flex-col justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
                  {loadout.itemCount} Pieces
                </span>
                {loadout.savingsAmount > 0 ? (
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: loadout.universeAccentColor }}
                  >
                    Save {formatEgp(loadout.savingsAmount)}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 font-serif text-xl font-semibold text-white">
                {loadout.name}
              </h3>
              {loadout.tagline ? (
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {loadout.tagline}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
              <div>
                <div className="text-lg font-bold text-white">
                  {formatEgp(loadout.finalPrice)}
                </div>
                {loadout.savingsAmount > 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] line-through">
                    {formatEgp(loadout.originalPrice)}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: loadout.universeAccentColor }}
              >
                Add to Room
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
