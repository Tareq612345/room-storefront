/**
 * @file src/modules/element-organizer/client-api.ts
 * @purpose Isolated Elements Data Manager public client API: reads/writes Reading Text Blocks and Reusable Buttons to Supabase page_sections[__isolated_element_organizer_v1__].
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  ELEMENT_ORGANIZER_LOCAL_STORAGE_KEY,
  ELEMENT_ORGANIZER_PAGE_KEY,
  ELEMENT_ORGANIZER_RECORD_ID,
  buildDefaultElementRegistry,
} from "./helpers";
import {
  ElementRegistrySchema,
  type ElementRegistry,
} from "./schema";

function cacheElementRegistryLocally(registry: ElementRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ELEMENT_ORGANIZER_LOCAL_STORAGE_KEY,
      JSON.stringify(registry)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedOrganizerElements(): ElementRegistry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ELEMENT_ORGANIZER_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = ElementRegistrySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveIsolatedElementRegistry(params: {
  storeId: string;
  registry: ElementRegistry;
}): Promise<boolean> {
  const validated = ElementRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });
  cacheElementRegistryLocally(validated);

  const nowIso = new Date().toISOString();
  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(ELEMENT_ORGANIZER_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: nowIso,
    }
  );
  if (patched.length > 0) {
    return true;
  }

  await sbInsert("page_sections", {
    id: ELEMENT_ORGANIZER_RECORD_ID,
    storeId: params.storeId,
    pageKey: ELEMENT_ORGANIZER_PAGE_KEY,
    type: "CATEGORY_SPOTLIGHT",
    title: "Isolated Reading Blocks & Buttons Data",
    subtitle: "Standalone Text Block & Button Organizer Registry",
    sortOrder: 9996,
    isVisible: false,
    config: validated,
    updatedAt: nowIso,
  });
  return true;
}

export async function fetchElementOrganizerSnapshot(): Promise<{
  storeId: string;
  registry: ElementRegistry;
  recordExistsInDb: boolean;
}> {
  const [sbStores, sbIsolated] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt"),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(ELEMENT_ORGANIZER_PAGE_KEY)}`
    ),
  ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";
  const isolatedRow = sbIsolated[0];
  if (isolatedRow) {
    const parsed = ElementRegistrySchema.safeParse(isolatedRow.config);
    if (parsed.success) {
      cacheElementRegistryLocally(parsed.data);
      return {
        storeId,
        registry: parsed.data,
        recordExistsInDb: true,
      };
    }
  }

  const seeded = buildDefaultElementRegistry();
  cacheElementRegistryLocally(seeded);
  return {
    storeId,
    registry: seeded,
    recordExistsInDb: false,
  };
}

export async function fetchResolvedElementsForStorefront(): Promise<ElementRegistry> {
  const snap = await fetchElementOrganizerSnapshot();
  return snap.registry;
}
