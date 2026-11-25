/**
 * @file src/app/universes/[slug]/page.tsx
 * @purpose Universe Detail Page: Dynamic static-exported route (/universes/cars, /gaming, /anime) synced live with Supabase.
 */

import { listProductsByUniverse } from "@modules/catalog";
import { getActiveStoreConfig } from "@modules/store-config";
import {
  getUniverseBySlug,
  listStoreUniverses,
  UniverseStarHeader,
} from "@modules/universes";
import { UniverseDetailClient } from "@modules/universes/components/UniverseDetailClient";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const store = await getActiveStoreConfig();
  const universes = await listStoreUniverses(store.id);
  return universes.map((u) => ({ slug: u.slug }));
}

export default async function UniversePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getActiveStoreConfig();

  const [universes, universe, products] = await Promise.all([
    listStoreUniverses(store.id),
    getUniverseBySlug(store.id, slug),
    listProductsByUniverse(store.id, slug),
  ]);

  if (!universe) {
    notFound();
  }

  return (
    <div data-universe={universe.slug} className="flex flex-col pb-16">
      <UniverseStarHeader universes={universes} activeSlug={universe.slug} />
      <UniverseDetailClient
        initialUniverse={universe}
        initialProducts={products}
      />
    </div>
  );
}
