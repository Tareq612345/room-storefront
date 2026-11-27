-- Migration: Analytics, Promo Codes & Future Operations Tables (Order Support, Payments, Dispatches, Notifications)
-- Run via Prisma DIRECT_URL or Supabase SQL Editor when promoting isolated JSON registries to native SQL tables.

CREATE TYPE "AnalyticsEventType" AS ENUM (
  'PAGE_VIEW',
  'VIEW_UNIVERSE',
  'VIEW_PRODUCT',
  'VIEW_PACKAGE',
  'ADD_TO_BAG',
  'BEGIN_CHECKOUT',
  'APPLY_PROMO',
  'PURCHASE'
);

CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING_DISPATCH', 'AWB_CREATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED');

CREATE TABLE IF NOT EXISTS "promo_codes" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "code" TEXT NOT NULL,
  "discountType" "PromoDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
  "value" DECIMAL(10,2) NOT NULL,
  "minOrderSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("storeId", "code")
);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promoCodeId" TEXT REFERENCES "promo_codes"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "analytics_sessions" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "sessionKey" TEXT NOT NULL,
  "landingPath" TEXT NOT NULL,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "deviceType" TEXT NOT NULL DEFAULT 'desktop',
  "hasAddedToBag" BOOLEAN NOT NULL DEFAULT false,
  "hasPurchased" BOOLEAN NOT NULL DEFAULT false,
  "convertedOrderId" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("storeId", "sessionKey")
);

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "sessionId" TEXT REFERENCES "analytics_sessions"("id") ON DELETE SET NULL,
  "eventType" "AnalyticsEventType" NOT NULL,
  "path" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "entitySlug" TEXT,
  "revenue" DECIMAL(10,2),
  "utmSource" TEXT,
  "shippingZoneId" TEXT REFERENCES "shipping_zones"("id") ON DELETE SET NULL,
  "orderId" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "orderId" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "method" "PaymentMethod" NOT NULL,
  "providerName" TEXT NOT NULL DEFAULT 'manual-or-cod',
  "providerReference" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "rawPayload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "shipment_dispatches" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "orderId" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "shippingZoneId" TEXT NOT NULL REFERENCES "shipping_zones"("id") ON DELETE RESTRICT,
  "courierName" TEXT NOT NULL DEFAULT 'cairo-express-dispatch',
  "trackingNumber" TEXT,
  "dispatchStatus" "DispatchStatus" NOT NULL DEFAULT 'PENDING_DISPATCH',
  "awbUrl" TEXT,
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "ticketNumber" TEXT NOT NULL,
  "orderId" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
  "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'whatsapp',
  "subject" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("storeId", "ticketNumber")
);

CREATE TABLE IF NOT EXISTS "notification_logs" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "orderId" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
  "channel" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
