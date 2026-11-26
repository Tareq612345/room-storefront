/**
 * @file src/modules/home-composer/components/StorefrontHomeClient.tsx
 * @purpose Live Storefront Homepage Consumer (/): reads exclusively from @modules/home-composer (fetchResolvedHomepageForStorefront) without touching item vaults directly.
 */

"use client";

import { UniverseStarHeader } from "@modules/universes";
import { useEffect, useState } from "react";
import {
  fetchResolvedHomepageForStorefront,
  getCachedHomepageSnapshot,
  type ResolvedStorefrontHomepage,
} from "../client-api";
import { HomeComposerBlockRenderer } from "./HomeComposerBlockRenderer";

export function StorefrontHomeClient() {
  const [snapshot, setSnapshot] = useState<ResolvedStorefrontHomepage | null>(
    null
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = getCachedHomepageSnapshot();
    if (cached) {
      setSnapshot(cached);
      setReady(true);
    }

    let active = true;
    (async () => {
      try {
        const live = await fetchResolvedHomepageForStorefront();
        if (!active) return;
        setSnapshot(live);
        setReady(true);
      } catch {
        if (!active) return;
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!ready || !snapshot) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
        <div className="mx-auto h-28 max-w-md animate-pulse rounded-full bg-white/5" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="h-[420px] animate-pulse rounded-[22px] border border-[var(--color-border-subtle)] bg-[#0b0815]/75"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-10">
      {snapshot.showStarHeader ? (
        <UniverseStarHeader
          universes={[]}
          disableRemoteSync
          customNodes={snapshot.starUniverses.map((u) => ({
            id: u.id,
            slug: u.slug,
            name: u.name,
            iconPngUrl: u.iconPngUrl,
          }))}
        />
      ) : null}

      {snapshot.blocks.map((block) => (
        <HomeComposerBlockRenderer
          key={block.id}
          block={block}
          vaults={snapshot.vaults}
          interactive
        />
      ))}
    </div>
  );
}
