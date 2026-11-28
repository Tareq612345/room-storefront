/**
 * @file src/app/admin/packages/page.tsx
 * @purpose Dedicated isolated Admin Packages & Collections Organizer route (/admin/packages/).
 */

import {
  PackageOrganizerClient,
  getPackageOrganizerBootstrap,
} from "@modules/package-organizer";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default async function AdminPackagesOrganizerPage() {
  const bootstrap = await getPackageOrganizerBootstrap();

  return (
    <AdminAuthGuard>
      <PackageOrganizerClient
        initialStoreId={bootstrap.storeId}
        initialRegistry={bootstrap.initialRegistry}
        initialHasPersistedRecord={bootstrap.hasPersistedRecord}
      />
    </AdminAuthGuard>
  );
}
