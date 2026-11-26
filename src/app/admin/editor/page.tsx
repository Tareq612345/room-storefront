/**
 * @file src/app/admin/editor/page.tsx
 * @purpose Unified Admin Visual Homepage route (/admin/editor/) now powered by the Isolated Homepage Composer replacing the legacy page-builder editor.
 */

import {
  HomeComposerClient,
  getHomeComposerBootstrap,
} from "@modules/home-composer";

export default async function AdminEditorHomeComposerPage() {
  const bootstrap = await getHomeComposerBootstrap();

  return (
    <HomeComposerClient
      initialStoreId={bootstrap.storeId}
      initialRegistry={bootstrap.initialRegistry}
    />
  );
}
