/**
 * @file src/modules/element-organizer/service.ts
 * @purpose Server bootstrap service for the isolated Reading Text Blocks & Buttons Admin page (/admin/elements/).
 */

import { prisma } from "@shared/db/prisma";
import {
  ELEMENT_ORGANIZER_PAGE_KEY,
  buildDefaultElementRegistry,
} from "./helpers";
import { ElementRegistrySchema, type ElementRegistry } from "./schema";

export interface ElementOrganizerBootstrap {
  storeId: string;
  hasPersistedRecord: boolean;
  initialRegistry: ElementRegistry;
}

export async function getElementOrganizerBootstrap(): Promise<ElementOrganizerBootstrap> {
  try {
    const store = await prisma.storeConfig.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    const storeId = store?.id ?? "store_room_egypt";

    const existing = await prisma.pageSection.findFirst({
      where: { storeId, pageKey: ELEMENT_ORGANIZER_PAGE_KEY },
      select: { config: true },
    });

    if (existing) {
      const parsed = ElementRegistrySchema.safeParse(existing.config);
      if (parsed.success) {
        return {
          storeId,
          hasPersistedRecord: true,
          initialRegistry: parsed.data,
        };
      }
    }

    return {
      storeId,
      hasPersistedRecord: false,
      initialRegistry: buildDefaultElementRegistry(),
    };
  } catch {
    return {
      storeId: "store_room_egypt",
      hasPersistedRecord: false,
      initialRegistry: buildDefaultElementRegistry(),
    };
  }
}
