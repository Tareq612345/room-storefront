import { getActiveStoreConfig } from "@modules/store-config";
import {
  listStoreUniverses,
  UniverseShowcaseGrid,
  UniverseStarHeader,
} from "@modules/universes";
import { FreshDropsSection, listFreshDrops } from "@modules/catalog";
import { listFeaturedLoadouts, LoadoutsSection } from "@modules/bundles";

export default async function HomePage() {
  const store = await getActiveStoreConfig();

  const [universes, freshDrops, loadouts] = await Promise.all([
    listStoreUniverses(store.id),
    listFreshDrops(store.id, 4),
    listFeaturedLoadouts(store.id, 3),
  ]);

  return (
    <div className="flex flex-col">
      {/* Signature RM 4-Point Star Header with flanking Universe Nodes */}
      <UniverseStarHeader universes={universes} />

      {/* 3-Card Universe Showcase matching the Midnight-Crimson-Orchid Reference */}
      <UniverseShowcaseGrid universes={universes} />

      {/* Fresh Drops (New Arrivals) */}
      <FreshDropsSection products={freshDrops} />

      {/* Signature Loadouts (Room Bundles) */}
      <LoadoutsSection loadouts={loadouts} />
    </div>
  );
}
