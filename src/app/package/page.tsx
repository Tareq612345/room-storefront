/**
 * @file src/app/package/page.tsx
 * @purpose Dynamic static-export Package / Collection Detail Page (/package/?slug=...) powered by the isolated Package Data Manager.
 */

"use client";

import { PackageDetailClient } from "@modules/package-organizer";
import { UniverseStarHeader } from "@modules/universes";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DynamicPackageView() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";

  return (
    <div className="flex flex-col pb-16">
      <UniverseStarHeader universes={[]} />
      <PackageDetailClient slug={slug} />
    </div>
  );
}

export default function DynamicPackagePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="h-[360px] animate-pulse rounded-3xl border border-white/10 bg-[#0b0815]/75" />
        </div>
      }
    >
      <DynamicPackageView />
    </Suspense>
  );
}
