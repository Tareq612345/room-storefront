/**
 * @file src/modules/analytics/helpers.ts
 * @purpose Isolated Analytics & Future Ops Registry constants and initial builders.
 */

import type { AnalyticsRegistry, FutureOpsRegistry } from "./schema";

export const ANALYTICS_PAGE_KEY = "__isolated_analytics_v1__";
export const ANALYTICS_RECORD_ID = "anorg_isolated_registry_v1";
export const ANALYTICS_LOCAL_STORAGE_KEY = "room_isolated_analytics_v1";

export const FUTURE_OPS_PAGE_KEY = "__isolated_future_ops_v1__";
export const FUTURE_OPS_RECORD_ID = "fops_isolated_registry_v1";
export const FUTURE_OPS_LOCAL_STORAGE_KEY = "room_isolated_future_ops_v1";

export const VISITOR_SESSION_STORAGE_KEY = "room_analytics_session_v1";

export function buildInitialAnalyticsRegistry(): AnalyticsRegistry {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    config: {
      trackPageViews: true,
      trackFunnelEvents: true,
      ga4MeasurementId: "",
      metaPixelId: "",
      dailyRevenueGoal: 5000,
      dailyOrderGoal: 5,
      retentionLimit: 400,
    },
    events: [],
  };
}

export function buildInitialFutureOpsRegistry(): FutureOpsRegistry {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    supportChannels: {
      whatsappEnabled: true,
      telegramWebhookConfigured: false,
      emailReceiptsConfigured: false,
      slaResponseHours: 4,
    },
    paymentTransactions: [],
    shipmentDispatches: [],
    notificationQueue: [],
    customerDirectory: [],
    supportTickets: [],
  };
}
