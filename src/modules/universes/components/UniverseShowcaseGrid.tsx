/**
 * @file src/modules/universes/components/UniverseShowcaseGrid.tsx
 * @purpose 3-card Universe showcase with instant cached hydration + live Supabase PostgreSQL sync (zero refresh flash).
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { getAssetPath } from "@shared/utils/asset-path";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UniverseDTO } from "../schema";

interface UniverseShowcaseGridProps {
  universes: UniverseDTO[];
}

interface SbUniverseRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  accentColor: string;
  isActive: boolean;
  sortOrder: number;
}

function buildUniverseGradient(accentColor: string): string {
  return `linear-gradient(180deg, #030305 0%, #0d0818 52%, ${accentColor} 100%)`;
}

export function UniverseShowcaseGrid({ universes }: UniverseShowcaseGridProps) {
  const [items, setItems] = useState<UniverseDTO[]>(universes);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1. Instant local snapshot read to avoid flash
    try {
      const cached = localStorage.getItem("room_live_universes_v1");
      if (cached) {
        const parsed = JSON.parse(cached) as UniverseDTO[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore
    }
    setReady(true);

    // 2. Live Supabase sync
    let active = true;
    (async () => {
      try {
        const rows = await sbSelect<SbUniverseRow>(
          "universes",
          "select=id,slug,name,tagline,accentColor,isActive,sortOrder&order=sortOrder.asc"
        );
        if (!active || rows.length === 0) return;

        const merged = universes
          .map((u) => {
            const match = rows.find((r) => r.slug === u.slug || r.id === u.id);
            if (!match) return u;
            return {
              ...u,
              name: match.name,
              tagline: match.tagline,
              accentColor: match.accentColor,
              isActive: match.isActive,
            };
          })
          .filter((u) => u.isActive);

        setItems(merged);
        localStorage.setItem("room_live_universes_v1", JSON.stringify(merged));
      } catch {
        // Keep cached/SSR props
      }
    })();
    return () => {
      active = false;
    };
  }, [universes]);

  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-6 md:py-10 transition-opacity duration-200 ${
        ready ? "opacity-100" : "opacity-95"
      }`}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {items.map((universe) => {
          const gradient = buildUniverseGradient(universe.accentColor);

          return (
            <Link
              key={universe.id}
              href={`/universes/${universe.slug}`}
              className="group relative flex h-[420px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--color-border-subtle)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
              style={{
                background: gradient,
                boxShadow: "var(--shadow-card)",
              }}
            >
              {universe.bannerUrl ? (
                <img
                  src={getAssetPath(universe.bannerUrl)}
                  alt={universe.name}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}

              <div
                className="pointer-events-none absolute inset-0 opacity-80"
                style={{ background: gradient }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: universe.accentColor }}
                  />
                  Universe
                </span>
                <span className="text-xs font-medium text-white/70 group-hover:text-white">
                  Enter →
                </span>
              </div>

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
