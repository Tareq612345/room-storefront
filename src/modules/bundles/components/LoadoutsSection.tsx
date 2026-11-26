/**
 * @file src/modules/bundles/components/LoadoutsSection.tsx
 * @purpose Displays bundled room Loadouts synced live with Supabase bundles table without stale fallback flash on load.
 */

"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import { sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import { useEffect, useState } from "react";
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
  const addItem = useRoomBagStore((s) => s.addItem);
  const [items, setItems] = useState<BundleSummaryDTO[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("room_live_loadouts_v1");
      if (cached) {
        const parsed = JSON.parse(cached) as BundleSummaryDTO[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setReady(true);
        }
      }
    } catch {
      // Ignore
    }

    let active = true;
    (async () => {
      try {
        const [sbBundles, sbUnivs] = await Promise.all([
          sbSelect<{
            id: string;
            universeId: string | null;
            slug: string;
            name: string;
            tagline: string | null;
            fixedPrice: number | string | null;
            isFeatured: boolean;
            isActive: boolean;
          }>(
            "bundles",
            "select=id,universeId,slug,name,tagline,fixedPrice,isFeatured,isActive&isActive=eq.true&isFeatured=eq.true&order=createdAt.desc"
          ),
          sbSelect<{ id: string; slug: string; accentColor: string }>(
            "universes",
            "select=id,slug,accentColor"
          ),
        ]);

        if (!active) return;

        if (sbBundles.length === 0) {
          setItems(loadouts);
          setReady(true);
          return;
        }

        const mapped = sbBundles.map((b) => {
          const existing = loadouts.find(
            (p) => p.slug === b.slug || p.id === b.id
          );
          const u = sbUnivs.find((un) => un.id === b.universeId);
          const finalPrice = b.fixedPrice
            ? Number(b.fixedPrice)
            : existing?.finalPrice ?? 2190;
          const originalPrice = existing?.originalPrice ?? finalPrice + 450;

          return {
            id: b.id,
            storeId: existing?.storeId ?? "store_room_egypt",
            universeSlug: u?.slug ?? existing?.universeSlug ?? null,
            universeAccentColor:
              u?.accentColor ?? existing?.universeAccentColor ?? "#c94b99",
            slug: b.slug,
            name: b.name,
            tagline: b.tagline,
            itemCount: existing?.itemCount ?? 3,
            originalPrice,
            finalPrice,
            savingsAmount: Math.max(0, originalPrice - finalPrice),
          };
        });

        setItems(mapped);
        setReady(true);
        localStorage.setItem("room_live_loadouts_v1", JSON.stringify(mapped));
      } catch {
        if (!active) return;
        setItems((prev) => (prev.length > 0 ? prev : loadouts));
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadouts]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <div className="mb-6 h-12 w-64 animate-pulse rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="h-56 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[#0b0815]/75"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

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
        {items.map((loadout) => (
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
                <p className="mt-2 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
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
                onClick={() =>
                  addItem({
                    id: loadout.id,
                    itemType: "BUNDLE",
                    title: loadout.name,
                    subtitle: loadout.tagline,
                    unitPrice: loadout.finalPrice,
                    accentColor: loadout.universeAccentColor,
                  })
                }
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
