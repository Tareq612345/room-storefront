/**
 * @file src/app/admin/products/page.tsx
 * @purpose Dedicated isolated Admin Product Organizer route (/admin/products/).
 */

import {
  ProductOrganizerClient,
  getProductOrganizerBootstrap,
} from "@modules/product-organizer";

export default async function AdminProductsOrganizerPage() {
  const bootstrap = await getProductOrganizerBootstrap();

  return (
    <ProductOrganizerClient
      initialStoreId={bootstrap.storeId}
      initialRegistry={bootstrap.initialRegistry}
      initialHasPersistedRecord={bootstrap.hasPersistedRecord}
    />
  );
}
