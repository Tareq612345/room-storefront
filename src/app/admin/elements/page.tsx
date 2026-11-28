/**
 * @file src/app/admin/elements/page.tsx
 * @purpose Dedicated isolated Admin route (/admin/elements/) for creating Reading Text Cards and Reusable CTA Buttons.
 */

import {
  ElementOrganizerClient,
  getElementOrganizerBootstrap,
} from "@modules/element-organizer";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default async function AdminElementsOrganizerPage() {
  const bootstrap = await getElementOrganizerBootstrap();

  return (
    <AdminAuthGuard>
      <ElementOrganizerClient
        initialStoreId={bootstrap.storeId}
        initialRegistry={bootstrap.initialRegistry}
        initialHasPersistedRecord={bootstrap.hasPersistedRecord}
      />
    </AdminAuthGuard>
  );
}
