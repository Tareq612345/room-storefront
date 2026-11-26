/**
 * @file src/app/universe/page.tsx
 * @purpose Dynamic static-export Universe route (/universe/?slug=...) so newly created Universes from the isolated Universe Data Manager load live without rebuilding.
 */

"use client";

import { UniverseStarHeader } from "@modules/universes";
import { UniverseDetailClient } from "@modules/universes/components/UniverseDetailClient";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DynamicUniverseView() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";

  return (
    <div data-universe={slug} className="flex flex-col pb-16">
      <UniverseStarHeader universes={[]} activeSlug={slug} />
      <UniverseDetailClient
        initialUniverse={null}
        initialProducts={[]}
        dynamicSlug={slug}
      />
    </div>
  );
}

export default function DynamicUniversePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-[#0b0815]/75" />
        </div>
      }
    >
      <DynamicUniverseView />
    </Suspense>
  );
}
