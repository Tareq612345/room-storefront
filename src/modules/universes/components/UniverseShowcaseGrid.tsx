/**
 * @file src/modules/universes/components/UniverseShowcaseGrid.tsx
 * @purpose 3-card (or dynamic) Universe showcase powered by the isolated Universe Data Manager (@modules/universe-organizer), preventing stale fallback flash on load.
 */

"use client";

import {
  fetchResolvedUniversesForStorefront,
  getCachedOrganizerUniverses,
  getUniverseHref,
  type OrganizedUniverse,
} from "@modules/universe-organizer";
import { getAssetPath } from "@shared/utils/asset-path";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UniverseDTO } from "../schema";

interface UniverseShowcaseGridProps {
  universes: UniverseDTO[];
  disableRemoteSync?: boolean;
}

function buildUniverseGradient(accentColor: string): string {
  return `linear-gradient(180deg, #030305 0%, #0d0818 52%, ${accentColor} 100%)`;
}

function toOrganizedFallback(universes: UniverseDTO[]): OrganizedUniverse[] {
  const now = new Date().toISOString();
  return universes
    .filter((u) => u.isActive)
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      tagline: u.tagline ?? "",
      description: u.description ?? "",
      accentColor: u.accentColor,
      iconPngUrl: null,
      bannerUrl: u.bannerUrl,
      sortOrder: u.sortOrder,
      isActive: u.isActive,
      productIds: [],
      offerIds: [],
      createdAt: now,
      updatedAt: now,
    }));
}

export function UniverseShowcaseGrid({
  universes,
  disableRemoteSync = false,
}: UniverseShowcaseGridProps) {
  const [items, setItems] = useState<OrganizedUniverse[]>(() =>
    disableRemoteSync ? toOrganizedFallback(universes) : []
  );
  const [ready, setReady] = useState(disableRemoteSync);

  useEffect(() => {
    if (disableRemoteSync) {
      setItems(toOrganizedFallback(universes));
      setReady(true);
      return;
    }

    const cached = getCachedOrganizerUniverses();
    if (cached && cached.length > 0) {
      setItems(cached);
      setReady(true);
    }

    let active = true;
    (async () => {
      try {
        const resolved = await fetchResolvedUniversesForStorefront();
        if (!active) return;
        setItems(resolved);
        setReady(true);
      } catch {
        if (!active) return;
        setItems((prev) =>
          prev.length > 0 ? prev : toOrganizedFallback(universes)
        );
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [universes, disableRemoteSync]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="h-[420px] animate-pulse rounded-[22px] border border-[var(--color-border-subtle)] bg-[#0b0815]/75"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {items.map((universe) => {
          const gradient = buildUniverseGradient(universe.accentColor);
          const bannerSrc = universe.bannerUrl
            ? universe.bannerUrl.startsWith("data:") ||
              universe.bannerUrl.startsWith("http")
              ? universe.bannerUrl
              : getAssetPath(universe.bannerUrl)
            : null;

          return (
            <Link
              key={universe.id}
              href={getUniverseHref(universe.slug)}
              className="group relative flex h-[420px] flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--color-border-subtle)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
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
