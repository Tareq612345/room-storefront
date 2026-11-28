/**
 * @file src/app/admin/home/page.tsx
 * @purpose Dedicated Isolated Admin Homepage Composer route (/admin/home/).
 */

import {
  HomeComposerClient,
  getHomeComposerBootstrap,
} from "@modules/home-composer";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default async function AdminHomeComposerPage() {
  const bootstrap = await getHomeComposerBootstrap();

  return (
    <AdminAuthGuard>
      <HomeComposerClient
        initialStoreId={bootstrap.storeId}
        initialRegistry={bootstrap.initialRegistry}
      />
    </AdminAuthGuard>
  );
}
