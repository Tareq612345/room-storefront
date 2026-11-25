/**
 * @file src/app/page.tsx
 * @purpose Storefront Homepage: Renders the RM 4-point Star Header and Admin-configurable Homepage sections.
 */

import { listFeaturedLoadouts } from "@modules/bundles";
import { listFreshDrops } from "@modules/catalog";
import { HomeSectionsClient } from "@modules/page-builder/components/HomeSectionsClient";
import { getActiveStoreConfig } from "@modules/store-config";
import { listStoreUniverses, UniverseStarHeader } from "@modules/universes";

export default async function HomePage() {
  const store = await getActiveStoreConfig();

  const [universes, freshDrops, loadouts] = await Promise.all([
    listStoreUniverses(store.id),
    listFreshDrops(store.id, 4),
    listFeaturedLoadouts(store.id, 3),
  ]);

  return (
    <div className="flex flex-col">
      <UniverseStarHeader universes={universes} />
      <HomeSectionsClient
        universes={universes}
        freshDrops={freshDrops}
        loadouts={loadouts}
      />
    </div>
  );
}
