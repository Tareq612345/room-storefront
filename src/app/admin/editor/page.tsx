/**
 * @file src/app/admin/editor/page.tsx
 * @purpose Dedicated Shopify-style Visual Drag-and-Drop Editor route (/admin/editor/).
 */

import { listFeaturedLoadouts } from "@modules/bundles";
import { listFreshDrops } from "@modules/catalog";
import { VisualEditorClient } from "@modules/page-builder/components/VisualEditorClient";
import { getActiveStoreConfig } from "@modules/store-config";
import { listStoreUniverses } from "@modules/universes";

export default async function AdminVisualEditorPage() {
  const store = await getActiveStoreConfig();

  const [universes, freshDrops, loadouts] = await Promise.all([
    listStoreUniverses(store.id),
    listFreshDrops(store.id, 4),
    listFeaturedLoadouts(store.id, 3),
  ]);

  return (
    <VisualEditorClient
      storeId={store.id}
      initialUniverses={universes}
      initialFreshDrops={freshDrops}
      initialLoadouts={loadouts}
    />
  );
}
