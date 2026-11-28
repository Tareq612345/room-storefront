/**
 * @file src/modules/policies/client-api.ts
 * @purpose Isolated Policies API: reads/writes __isolated_policies_v1__ in Supabase + live store/shipping summary for Shipping & Contact pages.
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  POLICIES_LOCAL_STORAGE_KEY,
  POLICIES_PAGE_KEY,
  POLICIES_RECORD_ID,
  buildInitialPoliciesRegistry,
} from "./helpers";
import { PoliciesRegistrySchema, type PoliciesRegistry } from "./schema";

function cachePoliciesLocally(registry: PoliciesRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POLICIES_LOCAL_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore
  }
}

export async function fetchPoliciesSnapshot(): Promise<{
  storeId: string;
  storeName: string;
  whatsapp: string;
  supportEmail: string;
  registry: PoliciesRegistry;
}> {
  const [sbStores, sbRows] = await Promise.all([
    sbSelect<{
      id: string;
      name: string;
      whatsappNumber: string | null;
      supportEmail: string | null;
    }>(
      "store_configs",
      "select=id,name,whatsappNumber,supportEmail&slug=eq.room-egypt"
    ).catch(() => []),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(POLICIES_PAGE_KEY)}`
    ).catch(() => []),
  ]);

  const store = sbStores[0];
  const parsed = sbRows[0]
    ? PoliciesRegistrySchema.safeParse(sbRows[0].config)
    : null;
  const registry = parsed?.success
    ? parsed.data
    : buildInitialPoliciesRegistry();
  cachePoliciesLocally(registry);

  return {
    storeId: store?.id ?? "store_room_egypt",
    storeName: store?.name ?? "ROOM",
    whatsapp: store?.whatsappNumber ?? "",
    supportEmail: store?.supportEmail ?? "",
    registry,
  };
}

export async function saveIsolatedPoliciesRegistry(params: {
  storeId: string;
  registry: PoliciesRegistry;
}): Promise<boolean> {
  const validated = PoliciesRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });
  cachePoliciesLocally(validated);

  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(POLICIES_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: validated.updatedAt,
    }
  );
  if (patched.length > 0) return true;

  await sbInsert("page_sections", {
    id: POLICIES_RECORD_ID,
    storeId: params.storeId,
    pageKey: POLICIES_PAGE_KEY,
    type: "NEW_ARRIVALS",
    title: "Isolated Policies, FAQ & Contact",
    subtitle: "Separated policy documents and support page data",
    sortOrder: 9991,
    isVisible: false,
    config: validated,
    updatedAt: validated.updatedAt,
  });
  return true;
}
