/**
 * @file src/modules/schema-visualizer/components/SchemaExplorerClient.tsx
 * @purpose Futuristic Database & Live Data Flow Visualizer (/schema/): includes both the wide 4-stage Live Data Flow Tracer and the enhanced interactive Schema Graph displaying all 14 Prisma tables + 3 Isolated Organizer Stores with live row counts, zoom controls, relation labels, and live data inspector.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  GitBranch,
  Key,
  Languages,
  Layers,
  Link2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EdgeMeta, ModelMeta, SchemaMeta } from "../schema";
import { LiveDataFlowCanvas } from "./LiveDataFlowCanvas";

interface SchemaExplorerClientProps {
  meta: SchemaMeta;
}

type Lang = "en" | "ar";

const RETIRED_LEGACY_MODELS = new Set([
  "Universe",
  "Product",
  "ProductVariant",
  "ProductStoryBlock",
  "Bundle",
  "BundleItem",
]);

const ACTIVE_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  StoreConfig: { x: 40, y: 40 },
  User: { x: 40, y: 380 },
  AdminInvite: { x: 40, y: 740 },
  SupportTicket: { x: 40, y: 1080 },
  PageSection: { x: 410, y: 40 },
  ShippingZone: { x: 410, y: 380 },
  PromoCode: { x: 410, y: 720 },
  LoyaltyAccount: { x: 410, y: 1060 },
  Order: { x: 780, y: 40 },
  OrderItem: { x: 780, y: 440 },
  PaymentTransaction: { x: 780, y: 800 },
  ShipmentDispatch: { x: 780, y: 1120 },
  AnalyticsSession: { x: 1150, y: 40 },
  AnalyticsEvent: { x: 1150, y: 380 },
  NotificationLog: { x: 1150, y: 760 },
  IsolatedUniverses: { x: 1520, y: 40 },
  IsolatedProducts: { x: 1520, y: 340 },
  IsolatedPackages: { x: 1520, y: 640 },
  IsolatedElements: { x: 1520, y: 940 },
  IsolatedHomeLayout: { x: 1890, y: 180 },
  IsolatedCartCheckout: { x: 1890, y: 520 },
  IsolatedAnalytics: { x: 1890, y: 840 },
  IsolatedFutureOps: { x: 1890, y: 1140 },
};

const DOMAIN_COLORS: Record<string, string> = {
  "Core & Multi-Tenant": "#38bdf8",
  "Dynamic Page Builder": "#a855f7",
  "Orders & Cairo Shipping": "#ef4444",
  "Loyalty & Rewards": "#22c55e",
  "Analytics & Telemetry": "#06b6d4",
  "Future Ops (Payments/Dispatch/Support)": "#f59e0b",
  "Isolated Organizers": "#10b981",
};

const DOMAIN_LABELS_AR: Record<string, string> = {
  ALL: "الكل",
  "Core & Multi-Tenant": "الأساس وتعدد المتاجر",
  "Dynamic Page Builder": "بناء الصفحة الرئيسية",
  "Orders & Cairo Shipping": "الطلبات والشحن والخصم",
  "Loyalty & Rewards": "نقاط الولاء",
  "Analytics & Telemetry": "الإحصائيات وتتبع الزوار",
  "Future Ops (Payments/Dispatch/Support)": "العمليات المستقبلية (دفع/شحن/دعم)",
  "Isolated Organizers": "المخازن المعزولة الفعالة",
};

const MODEL_PURPOSE_AR: Record<string, string> = {
  StoreConfig: "إعدادات المتجر والألوان والعملة وتعدد المتاجر (storeId)",
  User: "بيانات العملاء والموظفين والمديرين",
  AdminInvite: "دعوات المشرفين لمرة واحدة لمدة 48 ساعة",
  PageSection: "أقسام الصفحة الرئيسية + استضافة المخازن المعزولة عبر pageKey",
  ShippingZone: "مناطق الشحن في القاهرة والقاهرة الجديدة وتكلفتها",
  Order: "الطلبات وحالات الدفع (COD / أونلاين) وحالة التوصيل",
  OrderItem: "تفاصيل المنتجات والباقات داخل كل طلب",
  PromoCode: "أكواد الخصم وشروط الحد الأدنى والاستخدام",
  LoyaltyAccount: "حساب نقاط الولاء والمستويات وكود الإحالة",
  AnalyticsSession: "جلسات الزوار ومصادر الزيارات UTM ومؤشرات التحويل",
  AnalyticsEvent: "أحداث التتبع (مشاهدة/سلة/شراء) المربوطة بالطلبات والمناطق",
  PaymentTransaction: "سجل عمليات الدفع وربطها ببوابات الدفع مستقبلاً",
  ShipmentDispatch: "تجهيز بوالص الشحن وربطها بشركات التوصيل مستقبلاً",
  SupportTicket: "تذاكر دعم العملاء والطلبات المربوطة بالطلب والعميل",
  NotificationLog: "سجل إشعارات التاجر والعميل (واتساب / تليجرام / إيميل)",
  IsolatedUniverses: "المخزن المعزول الفعلي لليونيفيرسز (/admin/universes/) — pageKey=__isolated_universe_organizer_v1__",
  IsolatedProducts: "المخزن المعزول الفعلي للمنتجات (/admin/products/) — pageKey=__isolated_product_organizer_v1__",
  IsolatedPackages: "المخزن المعزول الفعلي للباكدجات والكوليكشنز (/admin/packages/) — pageKey=__isolated_package_organizer_v1__",
  IsolatedElements: "المخزن المعزول لبطاقات القراءة والأزرار (/admin/elements/) — pageKey=__isolated_element_organizer_v1__",
  IsolatedHomeLayout: "منسّق الصفحة الرئيسية المعزول (/admin/home/) — البوابة الوحيدة لعرض الرئيسية (/)",
  IsolatedCartCheckout: "مخزن السلة والدفع المعزول (/admin/checkout/) — pageKey=__isolated_cart_checkout_v1__",
  IsolatedAnalytics: "مخزن الإحصائيات الفعلي الحي — pageKey=__isolated_analytics_v1__",
  IsolatedFutureOps: "سجل العمليات المستقبلية الحي (مدفوعات/شحن/إشعارات/عملاء/دعم) — pageKey=__isolated_future_ops_v1__",
};

const VIRTUAL_ISOLATED_MODELS: Array<
  ModelMeta & {
    isolatedPageKey: string;
    isolatedArrayKey:
      | "universes"
      | "products"
      | "packages"
      | "elements"
      | "blocks"
      | "checkout"
      | "analytics"
      | "future_ops";
  }
> = [
  {
    name: "IsolatedUniverses",
    tableName: "page_sections[uorg]",
    domain: "Isolated Organizers",
    position: { x: 1520, y: 220 },
    isolatedPageKey: "__isolated_universe_organizer_v1__",
    isolatedArrayKey: "universes",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_universe_organizer_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.universes", type: "Json", rawType: "OrganizedUniverse[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "productIds", type: "String[]", rawType: "String[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "offerIds", type: "String[]", rawType: "String[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "iconPngUrl", type: "String?", rawType: "String?", isList: false, isOptional: true, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_universe_organizer_v1__"],
    uniques: ["uorg_isolated_registry_v1"],
  },
  {
    name: "IsolatedProducts",
    tableName: "page_sections[porg]",
    domain: "Isolated Organizers",
    position: { x: 1520, y: 540 },
    isolatedPageKey: "__isolated_product_organizer_v1__",
    isolatedArrayKey: "products",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_product_organizer_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.products", type: "Json", rawType: "OrganizedProduct[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "cardImageUrl", type: "String", rawType: "String", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "galleryImages", type: "String[]", rawType: "String[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "specs", type: "Json", rawType: "ProductSpecItem[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_product_organizer_v1__"],
    uniques: ["porg_isolated_registry_v1"],
  },
  {
    name: "IsolatedPackages",
    tableName: "page_sections[korg]",
    domain: "Isolated Organizers",
    position: { x: 1520, y: 860 },
    isolatedPageKey: "__isolated_package_organizer_v1__",
    isolatedArrayKey: "packages",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_package_organizer_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.packages", type: "Json", rawType: "OrganizedPackage[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "bannerImageUrl", type: "String", rawType: "String", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "heroImageUrl", type: "String", rawType: "String", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "productIds", type: "String[]", rawType: "String[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_package_organizer_v1__"],
    uniques: ["korg_isolated_registry_v1"],
  },
  {
    name: "IsolatedElements",
    tableName: "page_sections[eorg]",
    domain: "Isolated Organizers",
    position: { x: 1150, y: 940 },
    isolatedPageKey: "__isolated_element_organizer_v1__",
    isolatedArrayKey: "elements",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_element_organizer_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.textBlocks", type: "Json", rawType: "TextBlockItem[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "config.buttons", type: "Json", rawType: "ButtonItem[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_element_organizer_v1__"],
    uniques: ["eorg_isolated_registry_v1"],
  },
  {
    name: "IsolatedHomeLayout",
    tableName: "page_sections[hcomp]",
    domain: "Isolated Organizers",
    position: { x: 1520, y: 440 },
    isolatedPageKey: "__isolated_home_composer_v1__",
    isolatedArrayKey: "blocks",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_home_composer_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.showStarHeader", type: "Boolean", rawType: "Boolean", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: "true", relationTo: null, relationFields: [] },
      { name: "config.blocks", type: "Json", rawType: "HomeBlock[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_home_composer_v1__"],
    uniques: ["hcomp_isolated_registry_v1"],
  },
  {
    name: "IsolatedCartCheckout",
    tableName: "page_sections[ckorg]",
    domain: "Isolated Organizers",
    position: { x: 1890, y: 520 },
    isolatedPageKey: "__isolated_cart_checkout_v1__",
    isolatedArrayKey: "checkout",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_cart_checkout_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.paymentMethods", type: "Json", rawType: "PaymentMethodOption[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "config.promoCodes", type: "Json", rawType: "PromoCodeItem[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "config.rules", type: "Json", rawType: "CheckoutRules", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_cart_checkout_v1__"],
    uniques: ["ckorg_isolated_registry_v1"],
  },
  {
    name: "IsolatedAnalytics",
    tableName: "page_sections[anorg]",
    domain: "Analytics & Telemetry",
    position: { x: 1890, y: 840 },
    isolatedPageKey: "__isolated_analytics_v1__",
    isolatedArrayKey: "analytics",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_analytics_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "config.config", type: "Json", rawType: "AnalyticsConfig", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "config.events", type: "Json", rawType: "AnalyticsEventRecord[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_analytics_v1__"],
    uniques: ["anorg_isolated_registry_v1"],
  },
  {
    name: "IsolatedFutureOps",
    tableName: "page_sections[fops]",
    domain: "Future Ops (Payments/Dispatch/Support)",
    position: { x: 1890, y: 1140 },
    isolatedPageKey: "__isolated_future_ops_v1__",
    isolatedArrayKey: "future_ops",
    fields: [
      { name: "id", type: "String", rawType: "String", isList: false, isOptional: false, isId: true, isUnique: true, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "pageKey", type: "String", rawType: "__isolated_future_ops_v1__", isList: false, isOptional: false, isId: false, isUnique: false, isForeignKey: true, defaultValue: null, relationTo: "PageSection", relationFields: ["pageKey"] },
      { name: "paymentTransactions", type: "Json", rawType: "PaymentTxRecord[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "shipmentDispatches", type: "Json", rawType: "ShipmentDispatchRecord[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "notificationQueue", type: "Json", rawType: "NotificationQueueRecord[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "customerDirectory", type: "Json", rawType: "CustomerDirectoryRecord[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
      { name: "supportTickets", type: "Json", rawType: "SupportTicketRecord[]", isList: true, isOptional: false, isId: false, isUnique: false, isForeignKey: false, defaultValue: null, relationTo: null, relationFields: [] },
    ],
    indexes: ["pageKey = __isolated_future_ops_v1__"],
    uniques: ["fops_isolated_registry_v1"],
  },
];

const VIRTUAL_EDGES: EdgeMeta[] = [
  {
    id: "IsolatedUniverses->PageSection:isolated_uorg",
    from: "IsolatedUniverses",
    to: "PageSection",
    field: "pageKey=uorg",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedProducts->PageSection:isolated_porg",
    from: "IsolatedProducts",
    to: "PageSection",
    field: "pageKey=porg",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedPackages->PageSection:isolated_korg",
    from: "IsolatedPackages",
    to: "PageSection",
    field: "pageKey=korg",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedElements->PageSection:isolated_eorg",
    from: "IsolatedElements",
    to: "PageSection",
    field: "pageKey=eorg",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedHomeLayout->PageSection:isolated_hcomp",
    from: "IsolatedHomeLayout",
    to: "PageSection",
    field: "pageKey=hcomp",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedUniverses->IsolatedHomeLayout:placed",
    from: "IsolatedUniverses",
    to: "IsolatedHomeLayout",
    field: "UNIVERSE_CARD",
    fkFields: ["refId"],
  },
  {
    id: "IsolatedProducts->IsolatedHomeLayout:placed",
    from: "IsolatedProducts",
    to: "IsolatedHomeLayout",
    field: "PRODUCT_CARD",
    fkFields: ["refId"],
  },
  {
    id: "IsolatedPackages->IsolatedHomeLayout:placed",
    from: "IsolatedPackages",
    to: "IsolatedHomeLayout",
    field: "PACKAGE_CARD",
    fkFields: ["refId"],
  },
  {
    id: "IsolatedElements->IsolatedHomeLayout:placed",
    from: "IsolatedElements",
    to: "IsolatedHomeLayout",
    field: "TEXT_BLOCK/BUTTON",
    fkFields: ["refId"],
  },
  {
    id: "IsolatedUniverses->IsolatedProducts:productIds",
    from: "IsolatedUniverses",
    to: "IsolatedProducts",
    field: "productIds[]",
    fkFields: ["productIds"],
  },
  {
    id: "IsolatedUniverses->IsolatedPackages:offerIds",
    from: "IsolatedUniverses",
    to: "IsolatedPackages",
    field: "offerIds[]",
    fkFields: ["offerIds"],
  },
  {
    id: "IsolatedPackages->IsolatedProducts:productIds",
    from: "IsolatedPackages",
    to: "IsolatedProducts",
    field: "productIds[]",
    fkFields: ["productIds"],
  },
  {
    id: "IsolatedCartCheckout->PageSection:isolated_ckorg",
    from: "IsolatedCartCheckout",
    to: "PageSection",
    field: "pageKey=ckorg",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedCartCheckout->Order:checkout",
    from: "IsolatedCartCheckout",
    to: "Order",
    field: "submits",
    fkFields: ["shippingZoneId", "paymentMethod"],
  },
  {
    id: "IsolatedAnalytics->PageSection:isolated_anorg",
    from: "IsolatedAnalytics",
    to: "PageSection",
    field: "pageKey=anorg",
    fkFields: ["pageKey"],
  },
  {
    id: "IsolatedAnalytics->Order:revenue",
    from: "IsolatedAnalytics",
    to: "Order",
    field: "orderId",
    fkFields: ["orderId"],
  },
  {
    id: "IsolatedAnalytics->ShippingZone:zone",
    from: "IsolatedAnalytics",
    to: "ShippingZone",
    field: "shippingZoneId",
    fkFields: ["shippingZoneId"],
  },
  {
    id: "IsolatedAnalytics->IsolatedProducts:views",
    from: "IsolatedAnalytics",
    to: "IsolatedProducts",
    field: "entityId",
    fkFields: ["entityId"],
  },
  {
    id: "IsolatedAnalytics->IsolatedUniverses:views",
    from: "IsolatedAnalytics",
    to: "IsolatedUniverses",
    field: "entitySlug",
    fkFields: ["entitySlug"],
  },
  {
    id: "IsolatedFutureOps->Order:ops",
    from: "IsolatedFutureOps",
    to: "Order",
    field: "orderId",
    fkFields: ["orderId"],
  },
  {
    id: "IsolatedFutureOps->PageSection:isolated_fops",
    from: "IsolatedFutureOps",
    to: "PageSection",
    field: "pageKey=fops",
    fkFields: ["pageKey"],
  },
];

const COPY = {
  en: {
    title: "ROOM // DB SCHEMA",
    liveSynced: "Live Synced",
    tables: "Tables & Stores",
    relations: "Relations",
    fields: "Fields",
    searchPlaceholder: "Search model, field, table...",
    enums: "Enums",
    reset: "Reset",
    storefront: "Storefront",
    moreFields: (n: number) => `+${n} more fields (click to inspect)`,
    pgTable: "PostgreSQL / Isolated Store",
    columns: "Columns",
    liveDataTab: "Live Data",
    structureTab: "Structure",
    loadingRows: "Fetching live rows from Supabase...",
    emptyTable: "No records in this table yet.",
    relationsTitle: "Relations",
    indexesTitle: "Performance Indexes",
    enumsTitle: "PostgreSQL Enums",
    copyTooltip: "Copy Prisma model snippet",
    rowsBadge: (n: number) => `${n} rows`,
    jumpToFlow: "Trace in Live Flow",
  },
  ar: {
    title: "ROOM // هيكل قاعدة البيانات",
    liveSynced: "مزامنة حية",
    tables: "جدولاً ومخزناً",
    relations: "علاقة",
    fields: "حقل",
    searchPlaceholder: "ابحث عن جدول أو حقل...",
    enums: "التعدادات",
    reset: "إعادة ضبط",
    storefront: "المتجر",
    moreFields: (n: number) => `+${n} حقول إضافية (اضغط للتفاصيل)`,
    pgTable: "الجدول / المخزن في Supabase",
    columns: "الأعمدة",
    liveDataTab: "البيانات الحية",
    structureTab: "الهيكل والأعمدة",
    loadingRows: "جاري تحميل البيانات من Supabase...",
    emptyTable: "لا توجد بيانات مسجلة هنا بعد.",
    relationsTitle: "العلاقات المرتبطة",
    indexesTitle: "فهارس الأداء",
    enumsTitle: "التعدادات (PostgreSQL Enums)",
    copyTooltip: "نسخ كود الجدول",
    rowsBadge: (n: number) => `${n} سجل`,
    jumpToFlow: "تتبع في خريطة التدفق",
  },
} as const;

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] ?? "#38bdf8";
}

export function SchemaExplorerClient({ meta }: SchemaExplorerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];
  const [viewMode, setViewMode] = useState<"flow" | "graph">("flow");
  const [zoom, setZoom] = useState(0.85);

  const activePrismaModels = useMemo(
    () => meta.models.filter((m) => !RETIRED_LEGACY_MODELS.has(m.name)),
    [meta.models]
  );

  const allModels = useMemo(
    () =>
      [...activePrismaModels, ...VIRTUAL_ISOLATED_MODELS].map((m) => ({
        ...m,
        position: ACTIVE_NODE_POSITIONS[m.name] ?? m.position,
      })),
    [activePrismaModels]
  );

  const activeNames = useMemo(
    () => new Set(allModels.map((m) => m.name)),
    [allModels]
  );

  const allEdges = useMemo(
    () =>
      [...meta.edges, ...VIRTUAL_EDGES].filter(
        (e) => activeNames.has(e.from) && activeNames.has(e.to)
      ),
    [meta.edges, activeNames]
  );

  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() =>
    Object.fromEntries(
      [
        ...meta.models.filter((m) => !RETIRED_LEGACY_MODELS.has(m.name)),
        ...VIRTUAL_ISOLATED_MODELS,
      ].map((m) => [m.name, { ...(ACTIVE_NODE_POSITIONS[m.name] ?? m.position) }])
    )
  );

  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    "IsolatedProducts"
  );
  const [flowSourceId, setFlowSourceId] = useState<string | null>(null);
  const [hoveredModelName, setHoveredModelName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState<string>("ALL");
  const [showEnums, setShowEnums] = useState(false);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"data" | "structure">("data");
  const [liveRows, setLiveRows] = useState<Record<string, unknown>[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});

  const dragRef = useRef<{
    modelName: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const domains = useMemo(() => {
    const set = new Set(allModels.map((m) => m.domain));
    return ["ALL", ...Array.from(set)];
  }, [allModels]);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allModels.filter((m) => {
      const matchesDomain = activeDomain === "ALL" || m.domain === activeDomain;
      if (!matchesDomain) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.tableName.toLowerCase().includes(q) ||
        m.fields.some((f) => f.name.toLowerCase().includes(q))
      );
    });
  }, [allModels, activeDomain, searchQuery]);

  const visibleModelNames = useMemo(
    () => new Set(filteredModels.map((m) => m.name)),
    [filteredModels]
  );

  const focusModelName = hoveredModelName ?? selectedModelName;

  const connectedToFocus = useMemo(() => {
    const set = new Set<string>();
    if (!focusModelName) return set;
    set.add(focusModelName);
    for (const edge of allEdges) {
      if (edge.from === focusModelName) set.add(edge.to);
      if (edge.to === focusModelName) set.add(edge.from);
    }
    return set;
  }, [focusModelName, allEdges]);

  const selectedModel = useMemo(
    () => allModels.find((m) => m.name === selectedModelName) ?? null,
    [allModels, selectedModelName]
  );

  const fetchAllRowCounts = useCallback(async () => {
    try {
      const results = await Promise.all(
        activePrismaModels.map(async (m) => {
          try {
            const rows = await sbSelect<{ id: string }>(m.tableName, "select=id");
            return [m.name, rows.length] as const;
          } catch {
            return [m.name, 0] as const;
          }
        })
      );

      const isolatedRows = await sbSelect<{
        pageKey: string;
        config: Record<string, unknown>;
      }>(
        "page_sections",
        "select=pageKey,config&pageKey=in.(__isolated_universe_organizer_v1__,__isolated_product_organizer_v1__,__isolated_package_organizer_v1__,__isolated_element_organizer_v1__,__isolated_home_composer_v1__,__isolated_cart_checkout_v1__,__isolated_analytics_v1__,__isolated_future_ops_v1__)"
      ).catch(() => []);

      const countsMap: Record<string, number> = Object.fromEntries(results);
      for (const v of VIRTUAL_ISOLATED_MODELS) {
        const found = isolatedRows.find((r) => r.pageKey === v.isolatedPageKey);
        if (v.isolatedArrayKey === "elements") {
          const tb = found?.config?.textBlocks;
          const bt = found?.config?.buttons;
          countsMap[v.name] =
            (Array.isArray(tb) ? tb.length : 0) +
            (Array.isArray(bt) ? bt.length : 0);
        } else if (v.isolatedArrayKey === "checkout") {
          const pms = found?.config?.paymentMethods;
          const prs = found?.config?.promoCodes;
          countsMap[v.name] =
            (Array.isArray(pms) ? pms.length : 0) +
            (Array.isArray(prs) ? prs.length : 0);
        } else if (v.isolatedArrayKey === "analytics") {
          const evs = found?.config?.events;
          countsMap[v.name] = Array.isArray(evs) ? evs.length : 0;
        } else if (v.isolatedArrayKey === "future_ops") {
          const keys = [
            "paymentTransactions",
            "shipmentDispatches",
            "notificationQueue",
            "customerDirectory",
            "supportTickets",
          ];
          countsMap[v.name] = keys.reduce((acc, k) => {
            const arr = found?.config?.[k];
            return acc + (Array.isArray(arr) ? arr.length : 0);
          }, 0);
        } else {
          const arr = found?.config?.[v.isolatedArrayKey];
          countsMap[v.name] = Array.isArray(arr) ? arr.length : 0;
        }
      }
      setRowCounts(countsMap);
    } catch {
      // Ignore count fetch failures
    }
  }, [activePrismaModels]);

  const fetchLiveModelData = useCallback(
    async (model: ModelMeta) => {
      setLoadingRows(true);
      try {
        const virtualMeta = VIRTUAL_ISOLATED_MODELS.find(
          (v) => v.name === model.name
        );
        if (virtualMeta) {
          const rows = await sbSelect<{ config: Record<string, unknown> }>(
            "page_sections",
            `select=config&pageKey=eq.${encodeURIComponent(virtualMeta.isolatedPageKey)}`
          );
          let items: Record<string, unknown>[] = [];
          if (virtualMeta.isolatedArrayKey === "elements") {
            const tb = rows[0]?.config?.textBlocks;
            const bt = rows[0]?.config?.buttons;
            items = [
              ...(Array.isArray(tb) ? (tb as Record<string, unknown>[]) : []),
              ...(Array.isArray(bt) ? (bt as Record<string, unknown>[]) : []),
            ];
          } else if (virtualMeta.isolatedArrayKey === "checkout") {
            const pms = rows[0]?.config?.paymentMethods;
            const prs = rows[0]?.config?.promoCodes;
            items = [
              ...(Array.isArray(pms)
                ? (pms as Record<string, unknown>[]).map((x) => ({
                    _kind: "PAYMENT_METHOD",
                    ...x,
                  }))
                : []),
              ...(Array.isArray(prs)
                ? (prs as Record<string, unknown>[]).map((x) => ({
                    _kind: "PROMO_CODE",
                    ...x,
                  }))
                : []),
            ];
          } else if (virtualMeta.isolatedArrayKey === "analytics") {
            const evs = rows[0]?.config?.events;
            items = Array.isArray(evs)
              ? (evs as Record<string, unknown>[])
              : [];
          } else if (virtualMeta.isolatedArrayKey === "future_ops") {
            const c = rows[0]?.config ?? {};
            const tag = (kind: string, arr: unknown) =>
              Array.isArray(arr)
                ? (arr as Record<string, unknown>[]).map((x) => ({
                    _kind: kind,
                    ...x,
                  }))
                : [];
            items = [
              ...tag("PAYMENT_TX", c.paymentTransactions),
              ...tag("SHIPMENT", c.shipmentDispatches),
              ...tag("NOTIFICATION", c.notificationQueue),
              ...tag("CUSTOMER", c.customerDirectory),
              ...tag("SUPPORT_TICKET", c.supportTickets),
            ];
          } else {
            const list = rows[0]?.config?.[virtualMeta.isolatedArrayKey];
            items = Array.isArray(list)
              ? (list as Record<string, unknown>[])
              : [];
          }
          setLiveRows(items);
          setRowCounts((prev) => ({ ...prev, [model.name]: items.length }));
        } else {
          const rows = await sbSelect<Record<string, unknown>>(
            model.tableName,
            "select=*&limit=50"
          );
          setLiveRows(rows);
          setRowCounts((prev) => ({ ...prev, [model.name]: rows.length }));
        }
      } catch {
        setLiveRows([]);
      } finally {
        setLoadingRows(false);
      }
    },
    []
  );

  useEffect(() => {
    if (viewMode === "graph") {
      void fetchAllRowCounts();
    }
  }, [viewMode, fetchAllRowCounts]);

  useEffect(() => {
    if (!selectedModel) {
      setLiveRows([]);
      return;
    }
    void fetchLiveModelData(selectedModel);
  }, [selectedModel, fetchLiveModelData]);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    modelName: string
  ) => {
    e.stopPropagation();
    const pos = positions[modelName] ?? { x: 0, y: 0 };
    dragRef.current = {
      modelName,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    setSelectedModelName(modelName);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { modelName, startX, startY, origX, origY } = dragRef.current;
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    setPositions((prev) => ({
      ...prev,
      [modelName]: {
        x: Math.max(20, origX + dx),
        y: Math.max(20, origY + dy),
      },
    }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleResetLayout = () => {
    setPositions(
      Object.fromEntries(
        allModels.map((m) => [
          m.name,
          { ...(ACTIVE_NODE_POSITIONS[m.name] ?? m.position) },
        ])
      )
    );
    setZoom(0.85);
  };

  const handleCopyModelSummary = (model: ModelMeta) => {
    const summary = [
      `// Table: ${model.tableName} (${model.domain})`,
      `model ${model.name} {`,
      ...model.fields
        .filter((f) => !f.isModelRelation)
        .map((f) => `  ${f.name} ${f.rawType}${f.isId ? " @id" : ""}`),
      `}`,
    ].join("\n");
    navigator.clipboard.writeText(summary);
    setCopiedModel(model.name);
    setTimeout(() => setCopiedModel(null), 1800);
  };

  const formatDomainLabel = (domain: string) =>
    lang === "ar" ? DOMAIN_LABELS_AR[domain] ?? domain : domain;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative flex min-h-screen flex-col bg-[#040308] text-white"
    >
      {/* Top Cyber-Tech HUD Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "لوحة الإدارة" : "Admin"}</span>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <Database className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base font-semibold tracking-[0.12em] text-white">
                  {t.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  {t.liveSynced}
                </span>
              </div>
              <p className="text-[11px] text-white/55">
                {meta.provider} • {allModels.length} {t.tables} •{" "}
                {allEdges.length} {t.relations} •{" "}
                {allModels.reduce((acc, m) => acc + m.fields.length, 0)}{" "}
                {t.fields}
              </p>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-white/15 bg-black/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("flow")}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
                  viewMode === "flow"
                    ? "bg-cyan-400 text-black"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Workflow className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "تتبع حركة الداتا" : "Live Data Flow"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("graph")}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
                  viewMode === "graph"
                    ? "bg-white text-black"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "خريطة الجداول" : "Schema Graph"}</span>
              </button>
            </div>

            {viewMode === "graph" ? (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="h-9 w-48 rounded-full border border-white/15 bg-black/60 pl-9 pr-4 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
                  />
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center rounded-full border border-white/15 bg-white/5 px-1.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.55, +(z - 0.1).toFixed(2)))}
                    className="p-1.5 text-white/75 hover:text-white"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] text-white/80">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))}
                    className="p-1.5 text-white/75 hover:text-white"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEnums((v) => !v)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                    showEnums
                      ? "border-purple-400/60 bg-purple-500/20 text-purple-200"
                      : "border-white/15 bg-white/5 text-white/80 hover:border-white/35"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {t.enums} ({meta.stats.enumsCount})
                </button>

                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/80 transition-colors hover:border-white/35"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.reset}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/25"
            >
              <Languages className="h-3.5 w-3.5" />
              {lang === "ar" ? "English" : "عربي"}
            </button>

            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.storefront}
            </Link>
          </div>
        </div>

        {/* Domain Filter Pills (Schema Graph Mode) */}
        {viewMode === "graph" ? (
          <div className="mx-auto mt-3 flex max-w-[1600px] items-center gap-2 overflow-x-auto pb-1">
            {domains.map((domain) => {
              const active = activeDomain === domain;
              const color =
                domain === "ALL" ? "#ffffff" : getDomainColor(domain);
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setActiveDomain(domain)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                    active
                      ? "border-white/50 bg-white/15 text-white"
                      : "border-white/10 bg-black/40 text-white/60 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span
                    className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {formatDomainLabel(domain)}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {viewMode === "flow" ? (
        <LiveDataFlowCanvas
          lang={lang}
          meta={meta}
          initialSourceId={flowSourceId}
          onOpenSchemaGraph={(modelName) => {
            setSelectedModelName(modelName);
            setViewMode("graph");
          }}
        />
      ) : (
        /* Main Interactive Schema Graph Workspace */
        <div className="relative flex flex-1 overflow-hidden">
          <div
            dir="ltr"
            className="relative flex-1 overflow-auto"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          >
            <div
              className="relative origin-top-left p-6"
              style={{
                width: 1880,
                height: 1240,
                transform: `scale(${zoom})`,
              }}
            >
              {/* Animated SVG Relation Cables + Labels */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                {allEdges.map((edge) => {
                  if (
                    !visibleModelNames.has(edge.from) ||
                    !visibleModelNames.has(edge.to)
                  ) {
                    return null;
                  }
                  const fromPos = positions[edge.from];
                  const toPos = positions[edge.to];
                  if (!fromPos || !toPos) return null;

                  const x1 = fromPos.x + 140;
                  const y1 = fromPos.y + 46;
                  const x2 = toPos.x + 140;
                  const y2 = toPos.y + 46;
                  const cx = (x1 + x2) / 2;
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  const isHighlighted =
                    focusModelName &&
                    (edge.from === focusModelName || edge.to === focusModelName);
                  const strokeColor = isHighlighted
                    ? getDomainColor(
                        allModels.find((m) => m.name === edge.from)?.domain ??
                          ""
                      )
                    : "rgba(255,255,255,0.16)";

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 2.4 : 1.1}
                        strokeDasharray={isHighlighted ? "8 6" : "4 6"}
                        className={
                          isHighlighted ? "animate-schema-cable" : "opacity-60"
                        }
                      />
                      {isHighlighted ? (
                        <>
                          <circle cx={x2} cy={y2} r={4.5} fill={strokeColor} />
                          <rect
                            x={midX - 42}
                            y={midY - 10}
                            width={84}
                            height={18}
                            rx={6}
                            fill="#090714"
                            stroke={strokeColor}
                            strokeWidth={1}
                          />
                          <text
                            x={midX}
                            y={midY + 3}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={10}
                            fontFamily="monospace"
                          >
                            {edge.field}
                          </text>
                        </>
                      ) : null}
                    </g>
                  );
                })}
              </svg>

              {/* Draggable Model & Isolated Store Nodes */}
              {filteredModels.map((model) => {
                const pos = positions[model.name] ?? model.position;
                const domainColor = getDomainColor(model.domain);
                const isSelected = selectedModelName === model.name;
                const isDimmed =
                  focusModelName !== null && !connectedToFocus.has(model.name);
                const scalarFields = model.fields.filter(
                  (f) => !f.isModelRelation
                );
                const count = rowCounts[model.name];

                return (
                  <div
                    key={model.name}
                    onPointerDown={(e) => handlePointerDown(e, model.name)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onMouseEnter={() => setHoveredModelName(model.name)}
                    onMouseLeave={() => setHoveredModelName(null)}
                    style={{
                      transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                      borderColor: isSelected
                        ? domainColor
                        : "rgba(255,255,255,0.16)",
                      boxShadow: isSelected
                        ? `0 0 28px ${domainColor}44`
                        : "0 12px 30px rgba(0,0,0,0.65)",
                    }}
                    className={`absolute left-0 top-0 w-[280px] cursor-grab active:cursor-grabbing select-none rounded-2xl border bg-[#0b0816]/95 backdrop-blur-md transition-opacity duration-300 ${
                      isDimmed ? "opacity-35" : "opacity-100"
                    }`}
                  >
                    {/* Node Header */}
                    <div
                      className="flex items-center justify-between gap-2 rounded-t-2xl border-b border-white/10 px-3.5 py-2.5"
                      style={{
                        background: `linear-gradient(90deg, ${domainColor}28 0%, transparent 100%)`,
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Table2
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: domainColor }}
                        />
                        <span className="truncate text-xs font-bold tracking-wide text-white">
                          {model.name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {typeof count === "number" ? (
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold text-black"
                            style={{ backgroundColor: domainColor }}
                          >
                            {count}
                          </span>
                        ) : null}
                        <span className="rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-white/60">
                          {model.tableName}
                        </span>
                      </div>
                    </div>

                    {/* Preview Top Fields */}
                    <div className="divide-y divide-white/5 px-3.5 py-1.5">
                      {scalarFields.slice(0, 6).map((field) => (
                        <div
                          key={field.name}
                          className="flex items-center justify-between py-1 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {field.isId ? (
                              <Key className="h-3 w-3 shrink-0 text-amber-400" />
                            ) : field.isForeignKey ? (
                              <Link2 className="h-3 w-3 shrink-0 text-cyan-400" />
                            ) : (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" />
                            )}
                            <span className="truncate font-mono text-white/90">
                              {field.name}
                            </span>
                          </div>
                          <span className="ml-2 shrink-0 font-mono text-[10px] text-white/45">
                            {field.rawType}
                          </span>
                        </div>
                      ))}
                      {scalarFields.length > 6 ? (
                        <div className="py-1 text-center text-[10px] font-medium text-white/45">
                          {t.moreFields(scalarFields.length - 6)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right/Left Side Tech Inspector Panel */}
          {selectedModel ? (
            <aside className="z-30 flex w-full max-w-sm shrink-0 flex-col border-s border-white/10 bg-[#080611]/95 backdrop-blur-xl">
              <div className="flex items-start justify-between border-b border-white/10 p-5">
                <div>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
                    style={{
                      backgroundColor: getDomainColor(selectedModel.domain),
                    }}
                  >
                    {formatDomainLabel(selectedModel.domain)}
                  </span>
                  <h2 className="mt-2 font-serif text-xl font-semibold text-white">
                    {selectedModel.name}
                  </h2>
                  {lang === "ar" && MODEL_PURPOSE_AR[selectedModel.name] ? (
                    <p className="mt-1 text-xs leading-relaxed text-white/75">
                      {MODEL_PURPOSE_AR[selectedModel.name]}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-xs text-white/55">
                    {t.pgTable}:{" "}
                    <span className="text-cyan-300">{selectedModel.tableName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyModelSummary(selectedModel)}
                    className="rounded-lg border border-white/15 p-2 text-white/70 hover:border-white/35 hover:text-white"
                    title={t.copyTooltip}
                  >
                    {copiedModel === selectedModel.name ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModelName(null)}
                    className="rounded-lg border border-white/15 p-2 text-white/70 hover:border-white/35 hover:text-white"
                    aria-label="Close Inspector"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => setInspectorTab("data")}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
                    inspectorTab === "data"
                      ? "bg-cyan-400 text-black"
                      : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  {t.liveDataTab} ({liveRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("structure")}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
                    inspectorTab === "structure"
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  {t.structureTab}
                </button>
                <button
                  type="button"
                  onClick={() => void fetchLiveModelData(selectedModel)}
                  className="ms-auto rounded-lg border border-white/15 p-1.5 text-white/65 hover:text-white"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRows ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="border-b border-white/10 px-5 py-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetId =
                      selectedModel.name === "IsolatedUniverses"
                        ? "isolated_universes"
                        : selectedModel.name === "IsolatedProducts"
                        ? "isolated_products"
                        : selectedModel.name === "IsolatedPackages"
                        ? "isolated_packages"
                        : selectedModel.name === "IsolatedElements"
                        ? "isolated_elements"
                        : selectedModel.name === "IsolatedHomeLayout"
                        ? "isolated_home"
                        : selectedModel.tableName;
                    setFlowSourceId(targetId);
                    setViewMode("flow");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                >
                  <Workflow className="h-3.5 w-3.5" />
                  <span>{t.jumpToFlow}</span>
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {inspectorTab === "data" ? (
                  loadingRows ? (
                    <p className="py-10 text-center text-xs text-white/55">
                      {t.loadingRows}
                    </p>
                  ) : liveRows.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-white/55">
                      {t.emptyTable}
                    </div>
                  ) : (
                    <div className="space-y-3" dir="ltr">
                      {liveRows.map((row, idx) => {
                        const titleVal =
                          row.name ??
                          row.orderNumber ??
                          row.email ??
                          row.title ??
                          row.slug ??
                          row.id;
                        const badgeVal =
                          row.pageKey ??
                          row.role ??
                          row.status ??
                          row.slug ??
                          row.type;
                        const colorVal =
                          typeof row.accentColor === "string"
                            ? row.accentColor
                            : typeof row.defaultAccentColor === "string"
                              ? row.defaultAccentColor
                              : null;

                        return (
                          <div
                            key={String(row.id ?? idx)}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
                          >
                            <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                              <div className="flex min-w-0 items-center gap-2">
                                {colorVal ? (
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full border border-white/30"
                                    style={{ backgroundColor: colorVal }}
                                  />
                                ) : null}
                                <span className="truncate text-xs font-bold text-white">
                                  {String(titleVal ?? `Row #${idx + 1}`)}
                                </span>
                              </div>
                              {badgeVal ? (
                                <span className="max-w-[140px] shrink-0 truncate rounded-full bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
                                  {String(badgeVal)}
                                </span>
                              ) : null}
                            </div>

                            <div className="space-y-1 text-[11px]">
                              {Object.entries(row).map(([k, v]) => {
                                if (v === null || v === undefined || v === "") return null;
                                if (k.toLowerCase().includes("password")) {
                                  return (
                                    <div key={k} className="flex items-start justify-between gap-3">
                                      <span className="shrink-0 font-mono text-white/45">{k}</span>
                                      <span className="font-mono text-white/60">•••••••• (Secured)</span>
                                    </div>
                                  );
                                }
                                if (typeof v === "object") {
                                  return (
                                    <details key={k} className="rounded bg-black/40 px-2 py-1">
                                      <summary className="cursor-pointer font-mono text-[10px] text-cyan-300">
                                        {k} ({Array.isArray(v) ? `${v.length} items` : "JSON"})
                                      </summary>
                                      <pre className="mt-1 max-h-40 overflow-auto font-mono text-[10px] text-white/80">
                                        {JSON.stringify(v, null, 2)}
                                      </pre>
                                    </details>
                                  );
                                }
                                const str = String(v);
                                const display = str.length > 72 ? `${str.slice(0, 72)}…` : str;
                                return (
                                  <div
                                    key={k}
                                    className="flex items-start justify-between gap-3"
                                  >
                                    <span className="shrink-0 font-mono text-white/45">
                                      {k}
                                    </span>
                                    <span className="truncate text-right font-mono text-white/85">
                                      {display}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <>
                    {/* All Fields */}
                    <div>
                      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                        {t.columns} (
                        {
                          selectedModel.fields.filter((f) => !f.isModelRelation)
                            .length
                        }
                        )
                      </h3>
                      <div className="space-y-1.5">
                        {selectedModel.fields
                          .filter((f) => !f.isModelRelation)
                          .map((field) => (
                            <div
                              key={field.name}
                              dir="ltr"
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                {field.isId ? (
                                  <Key className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                ) : field.isForeignKey ? (
                                  <Link2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                                ) : (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                                )}
                                <span className="truncate font-mono text-white">
                                  {field.name}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {field.isUnique ? (
                                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                                    UQ
                                  </span>
                                ) : null}
                                <span className="font-mono text-[11px] text-cyan-300/90">
                                  {field.rawType}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Relations */}
                    <div>
                      <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                        <GitBranch className="h-3.5 w-3.5" />
                        {t.relationsTitle}
                      </h3>
                      <div className="flex flex-wrap gap-2" dir="ltr">
                        {allEdges
                          .filter(
                            (e) =>
                              e.from === selectedModel.name ||
                              e.to === selectedModel.name
                          )
                          .map((edge) => {
                            const target =
                              edge.from === selectedModel.name ? edge.to : edge.from;
                            const dir =
                              edge.from === selectedModel.name ? "→" : "←";
                            return (
                              <button
                                key={edge.id}
                                type="button"
                                onClick={() => setSelectedModelName(target)}
                                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-white/85 transition-colors hover:border-cyan-400/60 hover:text-cyan-200"
                              >
                                {dir} {target} ({edge.field})
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Indexes */}
                    {selectedModel.indexes.length > 0 ? (
                      <div>
                        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                          {t.indexesTitle}
                        </h3>
                        <div className="space-y-1" dir="ltr">
                          {selectedModel.indexes.map((idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-white/70"
                            >
                              [{idx}]
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </aside>
          ) : null}

          {/* Enums Vault Overlay Drawer */}
          {showEnums ? (
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto border-t border-purple-400/30 bg-[#080612]/95 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mx-auto max-w-[1500px]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-lg font-semibold text-white">
                    {t.enumsTitle} ({meta.enums.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowEnums(false)}
                    className="rounded-full border border-white/15 p-1.5 text-white/70 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  dir="ltr"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {meta.enums.map((en) => (
                    <div
                      key={en.name}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <h3 className="font-mono text-xs font-bold text-purple-300">
                        enum {en.name}
                      </h3>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {en.values.map((v) => (
                          <span
                            key={v}
                            className="rounded-md border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[10px] text-white/80"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
