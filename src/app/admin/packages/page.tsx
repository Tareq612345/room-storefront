/**
 * @file src/app/admin/packages/page.tsx
 * @purpose Dedicated isolated Admin Packages & Collections Organizer route (/admin/packages/).
 */

import {
  PackageOrganizerClient,
  getPackageOrganizerBootstrap,
} from "@modules/package-organizer";

export default async function AdminPackagesOrganizerPage() {
  const bootstrap = await getPackageOrganizerBootstrap();

  return (
    <PackageOrganizerClient
      initialStoreId={bootstrap.storeId}
      initialRegistry={bootstrap.initialRegistry}
      initialHasPersistedRecord={bootstrap.hasPersistedRecord}
    />
  );
}
