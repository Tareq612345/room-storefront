/**
 * @file src/app/admin/universes/page.tsx
 * @purpose Dedicated isolated Admin Universe Organizer route (/admin/universes/).
 */

import {
  UniverseOrganizerClient,
  getUniverseOrganizerBootstrap,
} from "@modules/universe-organizer";

export default async function AdminUniversesOrganizerPage() {
  const bootstrap = await getUniverseOrganizerBootstrap();

  return (
    <UniverseOrganizerClient
      initialStoreId={bootstrap.storeId}
      initialRegistry={bootstrap.initialRegistry}
      initialHasPersistedRecord={bootstrap.hasPersistedRecord}
      initialProducts={bootstrap.initialProducts}
      initialOffers={bootstrap.initialOffers}
    />
  );
}
