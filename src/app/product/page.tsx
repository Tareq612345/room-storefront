/**
 * @file src/app/product/page.tsx
 * @purpose Dynamic static-export inner Product Page (/product/?slug=...) powered by the isolated Product Data Manager.
 */

"use client";

import { ProductDetailClient } from "@modules/product-organizer";
import { UniverseStarHeader } from "@modules/universes";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DynamicProductView() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";

  return (
    <div className="flex flex-col pb-16">
      <UniverseStarHeader universes={[]} />
      <ProductDetailClient slug={slug} />
    </div>
  );
}

export default function DynamicProductPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="h-[460px] animate-pulse rounded-3xl border border-white/10 bg-[#0b0815]/75" />
        </div>
      }
    >
      <DynamicProductView />
    </Suspense>
  );
}
