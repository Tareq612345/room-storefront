/**
 * @file src/modules/analytics/client-api.ts
 * @purpose Non-blocking Analytics Telemetry & Future Operations Recorder: captures live page/product/bag/checkout/purchase events and populates linked Payment/Shipment/Notification/CRM envelopes for upcoming modules.
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { generateClientId } from "@shared/utils/client-auth";
import {
  ANALYTICS_LOCAL_STORAGE_KEY,
  ANALYTICS_PAGE_KEY,
  ANALYTICS_RECORD_ID,
  FUTURE_OPS_LOCAL_STORAGE_KEY,
  FUTURE_OPS_PAGE_KEY,
  FUTURE_OPS_RECORD_ID,
  VISITOR_SESSION_STORAGE_KEY,
  buildInitialAnalyticsRegistry,
  buildInitialFutureOpsRegistry,
} from "./helpers";
import {
  AnalyticsRegistrySchema,
  FutureOpsRegistrySchema,
  type AnalyticsEventRecord,
  type AnalyticsEventType,
  type AnalyticsRegistry,
  type FutureOpsRegistry,
} from "./schema";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = sessionStorage.getItem(VISITOR_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const next = generateClientId("sess");
    sessionStorage.setItem(VISITOR_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return generateClientId("sess");
  }
}

function getUtmParams(): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
} {
  if (typeof window === "undefined") {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}

async function resolveStoreId(): Promise<string> {
  try {
    const rows = await sbSelect<{ id: string }>(
      "store_configs",
      "select=id&slug=eq.room-egypt"
    );
    return rows[0]?.id ?? "store_room_egypt";
  } catch {
    return "store_room_egypt";
  }
}

export async function fetchAnalyticsRegistry(): Promise<{
  storeId: string;
  registry: AnalyticsRegistry;
  existsInDb: boolean;
}> {
  const [storeId, rows] = await Promise.all([
    resolveStoreId(),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(ANALYTICS_PAGE_KEY)}`
    ).catch(() => []),
  ]);

  const parsed = rows[0] ? AnalyticsRegistrySchema.safeParse(rows[0].config) : null;
  if (parsed?.success) {
    return { storeId, registry: parsed.data, existsInDb: true };
  }

  return { storeId, registry: buildInitialAnalyticsRegistry(), existsInDb: false };
}

export async function saveAnalyticsRegistry(params: {
  storeId: string;
  registry: AnalyticsRegistry;
}): Promise<void> {
  const validated = AnalyticsRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ANALYTICS_LOCAL_STORAGE_KEY, JSON.stringify(validated));
    } catch {
      // Ignore
    }
  }

  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(ANALYTICS_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: validated.updatedAt,
    }
  );

  if (patched.length === 0) {
    await sbInsert("page_sections", {
      id: ANALYTICS_RECORD_ID,
      storeId: params.storeId,
      pageKey: ANALYTICS_PAGE_KEY,
      type: "NEW_ARRIVALS",
      title: "Isolated Analytics & Funnel Telemetry",
      subtitle: "Zero-static storefront event telemetry and analytics config",
      sortOrder: 9994,
      isVisible: false,
      config: validated,
      updatedAt: validated.updatedAt,
    });
  }
}

export async function trackStorefrontEvent(input: {
  eventType: AnalyticsEventType;
  path?: string;
  entityType?: string | null;
  entityId?: string | null;
  entitySlug?: string | null;
  revenue?: number | null;
  orderId?: string | null;
  shippingZoneId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const snap = await fetchAnalyticsRegistry();
    if (input.eventType === "PAGE_VIEW" && !snap.registry.config.trackPageViews) return;
    if (input.eventType !== "PAGE_VIEW" && !snap.registry.config.trackFunnelEvents) return;

    const utm = getUtmParams();
    const isMobile =
      typeof window !== "undefined" ? window.innerWidth < 768 : false;

    const record: AnalyticsEventRecord = {
      id: generateClientId("evt"),
      sessionId: getOrCreateSessionId(),
      eventType: input.eventType,
      path:
        input.path ??
        (typeof window !== "undefined" ? window.location.pathname : "/"),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      entitySlug: input.entitySlug ?? null,
      revenue: input.revenue ?? null,
      orderId: input.orderId ?? null,
      shippingZoneId: input.shippingZoneId ?? null,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      deviceType: isMobile ? "mobile" : "desktop",
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    const limit = snap.registry.config.retentionLimit || 400;
    const nextEvents = [record, ...snap.registry.events].slice(0, limit);

    await saveAnalyticsRegistry({
      storeId: snap.storeId,
      registry: {
        ...snap.registry,
        events: nextEvents,
      },
    });
  } catch {
    // Telemetry must never block shopping UX
  }
}

export async function fetchFutureOpsRegistry(): Promise<{
  storeId: string;
  registry: FutureOpsRegistry;
  existsInDb: boolean;
}> {
  const [storeId, rows] = await Promise.all([
    resolveStoreId(),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(FUTURE_OPS_PAGE_KEY)}`
    ).catch(() => []),
  ]);

  const parsed = rows[0] ? FutureOpsRegistrySchema.safeParse(rows[0].config) : null;
  if (parsed?.success) {
    return { storeId, registry: parsed.data, existsInDb: true };
  }

  return { storeId, registry: buildInitialFutureOpsRegistry(), existsInDb: false };
}

export async function saveFutureOpsRegistry(params: {
  storeId: string;
  registry: FutureOpsRegistry;
}): Promise<void> {
  const validated = FutureOpsRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(FUTURE_OPS_LOCAL_STORAGE_KEY, JSON.stringify(validated));
    } catch {
      // Ignore
    }
  }

  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(FUTURE_OPS_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: validated.updatedAt,
    }
  );

  if (patched.length === 0) {
    await sbInsert("page_sections", {
      id: FUTURE_OPS_RECORD_ID,
      storeId: params.storeId,
      pageKey: FUTURE_OPS_PAGE_KEY,
      type: "NEW_ARRIVALS",
      title: "Future Operations Ledger (Payments, Dispatch, Support, CRM)",
      subtitle: "Pre-wired data sinks populated by Checkout for future modules",
      sortOrder: 9993,
      isVisible: false,
      config: validated,
      updatedAt: validated.updatedAt,
    });
  }
}

/**
 * Records linked Payment, Dispatch, Customer CRM, and Notification envelopes whenever an order completes.
 */
export async function recordFutureOrderOpsEnvelope(params: {
  storeId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  city: string;
  shippingZoneId: string;
  zoneName: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentReference: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "COD_COLLECTED";
  total: number;
  merchantWhatsapp: string;
}): Promise<void> {
  const snap = await fetchFutureOpsRegistry();
  const nowIso = new Date().toISOString();

  const existingCust = snap.registry.customerDirectory.find(
    (c) => c.customerPhone === params.customerPhone
  );

  const nextCustomers = existingCust
    ? snap.registry.customerDirectory.map((c) =>
        c.customerPhone === params.customerPhone
          ? {
              ...c,
              customerName: params.customerName,
              customerEmail: params.customerEmail ?? c.customerEmail,
              lastCity: params.city,
              lastZoneId: params.shippingZoneId,
              ordersCount: c.ordersCount + 1,
              totalSpent: Number((c.totalSpent + params.total).toFixed(2)),
              lastOrderNumber: params.orderNumber,
              updatedAt: nowIso,
            }
          : c
      )
    : [
        {
          id: generateClientId("cust"),
          customerPhone: params.customerPhone,
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          lastCity: params.city,
          lastZoneId: params.shippingZoneId,
          ordersCount: 1,
          totalSpent: params.total,
          lastOrderNumber: params.orderNumber,
          updatedAt: nowIso,
        },
        ...snap.registry.customerDirectory,
      ].slice(0, 200);

  const nextRegistry: FutureOpsRegistry = {
    ...snap.registry,
    paymentTransactions: [
      {
        id: generateClientId("ptx"),
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        method: params.paymentMethod,
        providerName: params.paymentProvider,
        providerReference: params.paymentReference,
        amount: params.total,
        status: params.paymentStatus,
        createdAt: nowIso,
      },
      ...snap.registry.paymentTransactions,
    ].slice(0, 200),
    shipmentDispatches: [
      {
        id: generateClientId("shp"),
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        shippingZoneId: params.shippingZoneId,
        zoneName: params.zoneName,
        courierName: "pending-courier-selection",
        trackingNumber: `RM-${params.orderNumber}`,
        dispatchStatus: "PENDING_DISPATCH" as const,
        codAmount: params.paymentMethod === "COD" ? params.total : 0,
        createdAt: nowIso,
      },
      ...snap.registry.shipmentDispatches,
    ].slice(0, 200),
    notificationQueue: [
      {
        id: generateClientId("ntf"),
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        channel: "WHATSAPP_MERCHANT" as const,
        recipient: params.merchantWhatsapp,
        templateKey: "new_order_alert",
        status: "QUEUED_FOR_FUTURE_PROVIDER" as const,
        summary: `New Order #${params.orderNumber} (${params.total} EGP) from ${params.customerName}`,
        createdAt: nowIso,
      },
      ...snap.registry.notificationQueue,
    ].slice(0, 200),
    customerDirectory: nextCustomers,
  };

  await saveFutureOpsRegistry({ storeId: params.storeId || snap.storeId, registry: nextRegistry });
}
