/**
 * @file src/modules/analytics/schema.ts
 * @purpose Isolated Analytics & Future Operations Telemetry Schemas: zero-static contracts for Storefront Funnel Events, Traffic Sessions, and Future Ops Envelopes (Payments, Dispatch, Support, Notifications, CRM).
 */

import { z } from "zod";

export const AnalyticsEventTypeSchema = z.enum([
  "PAGE_VIEW",
  "VIEW_UNIVERSE",
  "VIEW_PRODUCT",
  "VIEW_PACKAGE",
  "ADD_TO_BAG",
  "BEGIN_CHECKOUT",
  "APPLY_PROMO",
  "PURCHASE",
]);

export type AnalyticsEventType = z.infer<typeof AnalyticsEventTypeSchema>;

export const AnalyticsConfigSchema = z.object({
  trackPageViews: z.boolean().default(true),
  trackFunnelEvents: z.boolean().default(true),
  ga4MeasurementId: z.string().default(""),
  metaPixelId: z.string().default(""),
  dailyRevenueGoal: z.number().nonnegative().default(5000),
  dailyOrderGoal: z.number().int().nonnegative().default(5),
  retentionLimit: z.number().int().min(50).max(1000).default(400),
});

export const AnalyticsEventRecordSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  eventType: AnalyticsEventTypeSchema,
  path: z.string(),
  entityType: z.string().nullable().default(null),
  entityId: z.string().nullable().default(null),
  entitySlug: z.string().nullable().default(null),
  revenue: z.number().nullable().default(null),
  orderId: z.string().nullable().default(null),
  shippingZoneId: z.string().nullable().default(null),
  utmSource: z.string().nullable().default(null),
  utmMedium: z.string().nullable().default(null),
  utmCampaign: z.string().nullable().default(null),
  deviceType: z.enum(["mobile", "desktop"]).default("desktop"),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
});

export type AnalyticsEventRecord = z.infer<typeof AnalyticsEventRecordSchema>;

export const AnalyticsRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  config: AnalyticsConfigSchema,
  events: z.array(AnalyticsEventRecordSchema),
});

export type AnalyticsRegistry = z.infer<typeof AnalyticsRegistrySchema>;

// Future Operations Ready Ledger (Populated live on Checkout/Cart so future modules read real linked records)
export const PaymentTxRecordSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  method: z.string(),
  providerName: z.string(),
  providerReference: z.string(),
  amount: z.number(),
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "COD_COLLECTED"]),
  createdAt: z.string(),
});

export const ShipmentDispatchRecordSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  shippingZoneId: z.string(),
  zoneName: z.string(),
  courierName: z.string(),
  trackingNumber: z.string(),
  dispatchStatus: z.enum([
    "PENDING_DISPATCH",
    "AWB_CREATED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RETURNED",
  ]),
  codAmount: z.number(),
  createdAt: z.string(),
});

export const NotificationQueueRecordSchema = z.object({
  id: z.string(),
  orderId: z.string().nullable(),
  orderNumber: z.string().nullable(),
  channel: z.enum(["WHATSAPP_MERCHANT", "WHATSAPP_CUSTOMER", "TELEGRAM_BOT", "EMAIL"]),
  recipient: z.string(),
  templateKey: z.string(),
  status: z.enum(["QUEUED_FOR_FUTURE_PROVIDER", "DISPATCHED", "FAILED"]),
  summary: z.string(),
  createdAt: z.string(),
});

export const CustomerDirectoryRecordSchema = z.object({
  id: z.string(),
  customerPhone: z.string(),
  customerName: z.string(),
  customerEmail: z.string().nullable(),
  lastCity: z.string(),
  lastZoneId: z.string(),
  ordersCount: z.number().int(),
  totalSpent: z.number(),
  lastOrderNumber: z.string(),
  updatedAt: z.string(),
});

export const SupportTicketRecordSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  orderId: z.string().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  channel: z.string(),
  subject: z.string(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"]),
  createdAt: z.string(),
});

export const FutureOpsRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  supportChannels: z.object({
    whatsappEnabled: z.boolean().default(true),
    telegramWebhookConfigured: z.boolean().default(false),
    emailReceiptsConfigured: z.boolean().default(false),
    slaResponseHours: z.number().int().default(4),
  }),
  paymentTransactions: z.array(PaymentTxRecordSchema).default([]),
  shipmentDispatches: z.array(ShipmentDispatchRecordSchema).default([]),
  notificationQueue: z.array(NotificationQueueRecordSchema).default([]),
  customerDirectory: z.array(CustomerDirectoryRecordSchema).default([]),
  supportTickets: z.array(SupportTicketRecordSchema).default([]),
});

export type FutureOpsRegistry = z.infer<typeof FutureOpsRegistrySchema>;
export type PaymentTxRecord = z.infer<typeof PaymentTxRecordSchema>;
export type ShipmentDispatchRecord = z.infer<typeof ShipmentDispatchRecordSchema>;
export type NotificationQueueRecord = z.infer<typeof NotificationQueueRecordSchema>;
export type CustomerDirectoryRecord = z.infer<typeof CustomerDirectoryRecordSchema>;
export type SupportTicketRecord = z.infer<typeof SupportTicketRecordSchema>;
