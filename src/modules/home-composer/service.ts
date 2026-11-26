/**
 * @file src/modules/home-composer/service.ts
 * @purpose Server bootstrap service for the Isolated Homepage Composer (/admin/home/ and /admin/editor/).
 */

import { buildDefaultElementRegistry } from "@modules/element-organizer";
import { prisma } from "@shared/db/prisma";
import {
  HOME_COMPOSER_PAGE_KEY,
  buildInitialHomepageRegistry,
} from "./helpers";
import { HomepageRegistrySchema, type HomepageRegistry } from "./schema";

export interface HomeComposerBootstrap {
  storeId: string;
  hasPersistedRecord: boolean;
  initialRegistry: HomepageRegistry;
}

export async function getHomeComposerBootstrap(): Promise<HomeComposerBootstrap> {
  try {
    const store = await prisma.storeConfig.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    const storeId = store?.id ?? "store_room_egypt";

    const existing = await prisma.pageSection.findFirst({
      where: { storeId, pageKey: HOME_COMPOSER_PAGE_KEY },
      select: { config: true },
    });

    if (existing) {
      const parsed = HomepageRegistrySchema.safeParse(existing.config);
      if (parsed.success) {
        return {
          storeId,
          hasPersistedRecord: true,
          initialRegistry: parsed.data,
        };
      }
    }

    // Ensure element defaults exist cleanly on static bootstrap
    void buildDefaultElementRegistry();
    return {
      storeId,
      hasPersistedRecord: false,
      initialRegistry: buildInitialHomepageRegistry({
        universeIds: [],
        productIds: [],
        packageIds: [],
      }),
    };
  } catch {
    return {
      storeId: "store_room_egypt",
      hasPersistedRecord: false,
      initialRegistry: buildInitialHomepageRegistry({
        universeIds: [],
        productIds: [],
        packageIds: [],
      }),
    };
  }
}
