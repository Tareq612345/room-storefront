/**
 * @file src/modules/schema-visualizer/components/LiveDataFlowCanvas.tsx
 * @purpose Full-Database Organized Live Data Flow & Inspector for /schema/: tracks all 14 PostgreSQL/Supabase tables plus the 3 isolated organizer registries grouped by domain, showing live row counts, 4-stage pipeline flow (Writers -> Storage -> Reader APIs -> Storefront Consumers), foreign-key cross-links, searchable live record tables, and raw JSON inspection.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Key,
  Link2,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Store,
  Table2,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SchemaMeta } from "../schema";

type Lang = "en" | "ar";

type DomainKey =
  | "all"
  | "isolated"
  | "core"
  | "builder"
  | "orders"
  | "loyalty";

interface DataSourceDef {
  id: string;
  kind: "isolated" | "table";
  domainKey: Exclude<DomainKey, "all">;
  modelName: string;
  tableName: string;
  isolatedPageKey?: string;
  isolatedArrayKey?: "universes" | "products" | "packages";
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  accentColor: string;
  writers: { label: string; route?: string; detail: string }[];
  storageSummary: string;
  readerApis: { mod: string; fn: string }[];
  consumers: { label: string; href?: string }[];
  relatedSourceIds: string[];
  previewColumns: string[];
}

interface SourceFetchState {
  rows: Record<string, unknown>[];
  ok: boolean;
  error?: string;
}

interface DomainGroupMeta {
  key: Exclude<DomainKey, "all">;
  labelAr: string;
  labelEn: string;
  color: string;
}

const DOMAIN_GROUPS: DomainGroupMeta[] = [
  {
    key: "isolated",
    labelAr: "المخازن المعزولة الحية",
    labelEn: "Isolated Storefront Registries",
    color: "#10b981",
  },
  {
    key: "core",
    labelAr: "الأساس والمستخدمون",
    labelEn: "Core & Multi-Tenant",
    color: "#38bdf8",
  },
  {
    key: "builder",
    labelAr: "بناء الصفحات الديناميكي",
    labelEn: "Dynamic Page Builder",
    color: "#a855f7",
  },
  {
    key: "orders",
    labelAr: "الطلبات وشحن القاهرة",
    labelEn: "Orders & Cairo Shipping",
    color: "#ef4444",
  },
  {
    key: "loyalty",
    labelAr: "نقاط الولاء والمكافآت",
    labelEn: "Loyalty & Rewards",
    color: "#22c55e",
  },
];

const DATA_SOURCE_CATALOG: DataSourceDef[] = [
  // 1. ISOLATED REGISTRIES
  {
    id: "isolated_universes",
    kind: "isolated",
    domainKey: "isolated",
    modelName: "IsolatedUniverses",
    tableName: "page_sections",
    isolatedPageKey: "__isolated_universe_organizer_v1__",
    isolatedArrayKey: "universes",
    labelAr: "اليونيفيرسز المعزولة",
    labelEn: "Isolated Universes",
    descAr: "السجل المعزول الذي يتحكم في أقسام اليونيفيرس وألوانها وأيقوناتها وروابطها بالمنتجات والكوليكشنز.",
    descEn: "Isolated JSON registry controlling storefront universes, accents, PNG icons, and linked items.",
    accentColor: "#c94b99",
    writers: [
      { label: "Universe Organizer UI", route: "/admin/universes/", detail: "saveIsolatedUniverseOrganizer()" },
    ],
    storageSummary:
      "page_sections[id=uorg_isolated_registry_v1, pageKey=__isolated_universe_organizer_v1__] + localStorage",
    readerApis: [
      { mod: "@modules/universe-organizer", fn: "fetchResolvedUniversesForStorefront()" },
      { mod: "@modules/universe-organizer", fn: "fetchResolvedUniverseDetail(slug)" },
    ],
    consumers: [
      { label: "Homepage Star Header & Grid", href: "/" },
      { label: "Dynamic Universe Page (/universe/)", href: "/universe/" },
      { label: "Static Universe Routes (/universes/cars)", href: "/universes/cars" },
    ],
    relatedSourceIds: ["isolated_products", "isolated_packages", "page_sections"],
    previewColumns: ["name", "slug", "accentColor", "isActive", "updatedAt"],
  },
  {
    id: "isolated_products",
    kind: "isolated",
    domainKey: "isolated",
    modelName: "IsolatedProducts",
    tableName: "page_sections",
    isolatedPageKey: "__isolated_product_organizer_v1__",
    isolatedArrayKey: "products",
    labelAr: "المنتجات المعزولة",
    labelEn: "Isolated Products",
    descAr: "السجل المعزول للمنتجات: الأسعار، المخزون، صور البانر، وتصميم صفحة المنتج الداخلية.",
    descEn: "Isolated JSON registry for product cards, prices, stock, gallery images, specs, and detail layouts.",
    accentColor: "#6366f1",
    writers: [
      { label: "Product Organizer UI", route: "/admin/products/", detail: "saveIsolatedProductRegistry()" },
    ],
    storageSummary:
      "page_sections[id=porg_isolated_registry_v1, pageKey=__isolated_product_organizer_v1__] + localStorage",
    readerApis: [
      { mod: "@modules/product-organizer", fn: "fetchResolvedProductsForStorefront()" },
      { mod: "@modules/product-organizer", fn: "fetchResolvedProductDetail(slug)" },
    ],
    consumers: [
      { label: "Homepage Fresh Drops", href: "/" },
      { label: "Product Detail Page (/product/)", href: "/product/" },
      { label: "Universe & Package Pages", href: "/universe/" },
    ],
    relatedSourceIds: ["isolated_universes", "isolated_packages", "page_sections", "order_items"],
    previewColumns: ["name", "slug", "basePrice", "stock", "isActive"],
  },
  {
    id: "isolated_packages",
    kind: "isolated",
    domainKey: "isolated",
    modelName: "IsolatedPackages",
    tableName: "page_sections",
    isolatedPageKey: "__isolated_package_organizer_v1__",
    isolatedArrayKey: "packages",
    labelAr: "الباكدجات والكوليكشنز المعزولة",
    labelEn: "Isolated Packages & Collections",
    descAr: "السجل المعزول للباكدجات والكوليكشنز المرتبطة باليونيفيرسز والمنتجات.",
    descEn: "Isolated JSON registry for bundles/collections, hero/banner artwork, pricing, and member products.",
    accentColor: "#f59e0b",
    writers: [
      { label: "Packages Organizer UI", route: "/admin/packages/", detail: "saveIsolatedPackageRegistry()" },
    ],
    storageSummary:
      "page_sections[id=korg_isolated_registry_v1, pageKey=__isolated_package_organizer_v1__] + localStorage",
    readerApis: [
      { mod: "@modules/package-organizer", fn: "fetchResolvedPackagesForStorefront()" },
      { mod: "@modules/package-organizer", fn: "fetchResolvedPackageDetail(slug)" },
    ],
    consumers: [
      { label: "Homepage Loadouts & Collections", href: "/" },
      { label: "Package Detail Page (/package/)", href: "/package/" },
      { label: "Universe Detail Page", href: "/universe/" },
    ],
    relatedSourceIds: ["isolated_universes", "isolated_products", "page_sections", "order_items"],
    previewColumns: ["name", "slug", "kind", "finalPrice", "isActive"],
  },

  // 2. CORE & MULTI-TENANT
  {
    id: "store_configs",
    kind: "table",
    domainKey: "core",
    modelName: "StoreConfig",
    tableName: "store_configs",
    labelAr: "إعدادات المتجر والثيم",
    labelEn: "Store Configs",
    descAr: "الإعدادات الرئيسية للمتجر: الاسم، العملة، رقم الواتساب، اللون الافتراضي، وتوكنز الثيم.",
    descEn: "Root multi-tenant store settings, currency, defaultAccentColor, themeTokens JSON, and contact info.",
    accentColor: "#38bdf8",
    writers: [
      { label: "Admin Portal Settings", route: "/admin/", detail: "sbPatch('store_configs')" },
      { label: "Visual Page Editor", route: "/admin/editor/", detail: "sbPatch('store_configs')" },
    ],
    storageSummary: "PostgreSQL / Supabase table: store_configs (FK root for all storeId columns)",
    readerApis: [
      { mod: "@modules/store-config", fn: "getActiveStoreConfig()" },
      { mod: "@shared/components", fn: "UniverseThemeSync -> sbSelect('store_configs')" },
    ],
    consumers: [
      { label: "Global Layout & Theme Tokens", href: "/" },
      { label: "Admin Portal", href: "/admin/" },
      { label: "Visual Editor", href: "/admin/editor/" },
    ],
    relatedSourceIds: ["users", "page_sections", "orders", "shipping_zones"],
    previewColumns: ["name", "slug", "currency", "defaultAccentColor", "isActive"],
  },
  {
    id: "users",
    kind: "table",
    domainKey: "core",
    modelName: "User",
    tableName: "users",
    labelAr: "المستخدمون والمشرفون",
    labelEn: "Users & Staff",
    descAr: "حسابات العملاء والموظفين والمديرين وأصحاب المتجر مع الأدوار (CUSTOMER / STAFF / ADMIN / OWNER).",
    descEn: "Storefront users, staff, admins, and owners with credentials and role permissions.",
    accentColor: "#0ea5e9",
    writers: [
      { label: "Admin Invite Redemption", route: "/admin/invite/", detail: "sbInsert('users')" },
      { label: "Admin Portal Users", route: "/admin/", detail: "sbPatch('users')" },
    ],
    storageSummary: "PostgreSQL / Supabase table: users (unique per storeId+email/username/phone)",
    readerApis: [
      { mod: "@modules/admin", fn: "sbSelect('users') & @modules/admin/service" },
    ],
    consumers: [
      { label: "Admin Portal Auth & Team", href: "/admin/" },
      { label: "Invite Acceptance Flow", href: "/admin/invite/" },
    ],
    relatedSourceIds: ["store_configs", "admin_invites", "orders", "loyalty_accounts"],
    previewColumns: ["name", "username", "email", "role", "isActive"],
  },
  {
    id: "admin_invites",
    kind: "table",
    domainKey: "core",
    modelName: "AdminInvite",
    tableName: "admin_invites",
    labelAr: "دعوات الإدارة",
    labelEn: "Admin Invites",
    descAr: "روابط دعوات المشرفين ذات الاستخدام الواحد ومدة الصلاحية 48 ساعة.",
    descEn: "48-hour single-use admin onboarding tokens linked to inviting user and store.",
    accentColor: "#0284c7",
    writers: [
      { label: "Admin Team Inviter", route: "/admin/", detail: "sbInsert('admin_invites')" },
      { label: "Invite Redeem Handler", route: "/admin/invite/", detail: "sbPatch('admin_invites', usedAt)" },
    ],
    storageSummary: "PostgreSQL / Supabase table: admin_invites (unique token)",
    readerApis: [
      { mod: "@modules/admin", fn: "AdminInviteClient -> sbSelect('admin_invites')" },
    ],
    consumers: [
      { label: "Invite Landing Page", href: "/admin/invite/" },
      { label: "Admin Team Tab", href: "/admin/" },
    ],
    relatedSourceIds: ["store_configs", "users"],
    previewColumns: ["email", "role", "expiresAt", "usedAt", "createdAt"],
  },

  // 3. DYNAMIC PAGE BUILDER
  {
    id: "page_sections",
    kind: "table",
    domainKey: "builder",
    modelName: "PageSection",
    tableName: "page_sections",
    labelAr: "أقسام الصفحة والـ Host",
    labelEn: "Page Sections (All Rows)",
    descAr: "يحتوي على بلوكات الصفحة الرئيسية (home) + صفوف الاستضافة الثلاثة للمخازن المعزولة (__isolated_*).",
    descEn: "Dynamic storefront sections (HERO_SLIDER, FLASH_DEALS, etc.) plus isolated JSON registry host rows.",
    accentColor: "#a855f7",
    writers: [
      { label: "Visual Page Editor", route: "/admin/editor/", detail: "sbInsert/Patch/Delete('page_sections')" },
      { label: "Isolated Organizers", route: "/admin/universes/", detail: "uorg / porg / korg registries" },
    ],
    storageSummary: "PostgreSQL / Supabase table: page_sections (indexed by storeId, pageKey, sortOrder)",
    readerApis: [
      { mod: "@modules/page-builder", fn: "HomeSectionsClient -> sbSelect('page_sections')" },
      { mod: "@modules/*-organizer", fn: "sbSelect('page_sections', pageKey=eq.__isolated_*)" },
    ],
    consumers: [
      { label: "Homepage Dynamic Blocks", href: "/" },
      { label: "Visual Editor Canvas", href: "/admin/editor/" },
    ],
    relatedSourceIds: ["store_configs", "isolated_universes", "isolated_products", "isolated_packages"],
    previewColumns: ["pageKey", "type", "title", "sortOrder", "isVisible"],
  },

  // 4. ORDERS & CAIRO SHIPPING
  {
    id: "shipping_zones",
    kind: "table",
    domainKey: "orders",
    modelName: "ShippingZone",
    tableName: "shipping_zones",
    labelAr: "مناطق شحن القاهرة",
    labelEn: "Shipping Zones",
    descAr: "مناطق التوصيل في القاهرة والقاهرة الجديدة، رسوم الشحن، وحد الشحن المجاني، ومدة التوصيل.",
    descEn: "Cairo & New Cairo delivery zones with fees, freeShippingThreshold, and estimatedDays.",
    accentColor: "#f97316",
    writers: [
      { label: "Admin Shipping Manager", route: "/admin/", detail: "sbInsert/Patch('shipping_zones')" },
    ],
    storageSummary: "PostgreSQL / Supabase table: shipping_zones",
    readerApis: [
      { mod: "@modules/cart-checkout", fn: "MyRoomTriggerAndDrawer -> sbSelect('shipping_zones')" },
    ],
    consumers: [
      { label: "Slide-Out Cart & Checkout Drawer", href: "/" },
      { label: "Admin Shipping Tab", href: "/admin/" },
    ],
    relatedSourceIds: ["store_configs", "orders"],
    previewColumns: ["name", "city", "fee", "estimatedDays", "isActive"],
  },
  {
    id: "orders",
    kind: "table",
    domainKey: "orders",
    modelName: "Order",
    tableName: "orders",
    labelAr: "طلبات العملاء",
    labelEn: "Customer Orders",
    descAr: "سجلات الطلبات الكاملة: بيانات العميل، العنوان، وسيلة الدفع، حالة الطلب، والإجمالي.",
    descEn: "Customer checkout orders with status lifecycle, payment method/status, and totals.",
    accentColor: "#ef4444",
    writers: [
      { label: "Checkout Drawer", route: "/", detail: "Order creation flow" },
      { label: "Admin Orders Console", route: "/admin/", detail: "sbPatch('orders', status)" },
    ],
    storageSummary: "PostgreSQL / Supabase table: orders (unique storeId+orderNumber)",
    readerApis: [
      { mod: "@modules/admin", fn: "AdminPortalClient -> sbSelect('orders')" },
    ],
    consumers: [
      { label: "Admin Orders Tab", href: "/admin/" },
    ],
    relatedSourceIds: ["store_configs", "users", "shipping_zones", "order_items"],
    previewColumns: ["orderNumber", "customerName", "status", "paymentStatus", "total"],
  },
  {
    id: "order_items",
    kind: "table",
    domainKey: "orders",
    modelName: "OrderItem",
    tableName: "order_items",
    labelAr: "تفاصيل بنود الطلبات",
    labelEn: "Order Items",
    descAr: "المنتجات والباقات المحفوظة داخل كل طلب كنسخة لحظية (Snapshot) للسعر والاسم.",
    descEn: "Immutable price/title line-item snapshots for products or bundles inside each Order.",
    accentColor: "#dc2626",
    writers: [
      { label: "Checkout Order Processor", detail: "OrderItem rows attached to Order" },
    ],
    storageSummary: "PostgreSQL / Supabase table: order_items (FK -> orders)",
    readerApis: [
      { mod: "@modules/admin", fn: "Order line-item breakdown queries" },
    ],
    consumers: [
      { label: "Admin Order Details", href: "/admin/" },
    ],
    relatedSourceIds: ["orders", "isolated_products", "isolated_packages"],
    previewColumns: ["orderId", "itemType", "titleSnapshot", "quantity", "lineTotal"],
  },

  // 7. LOYALTY & REWARDS
  {
    id: "loyalty_accounts",
    kind: "table",
    domainKey: "loyalty",
    modelName: "LoyaltyAccount",
    tableName: "loyalty_accounts",
    labelAr: "حسابات نقاط الولاء",
    labelEn: "Loyalty Accounts",
    descAr: "رصيد نقاط العملاء ومستوياتهم (ROOKIE / PRO / ELITE / LEGEND) وأكواد الإحالة.",
    descEn: "Customer pointsBalance, lifetimePoints, tier progression, and referral codes.",
    accentColor: "#22c55e",
    writers: [
      { label: "Loyalty & Orders Foundation", detail: "LoyaltyAccount per userId" },
    ],
    storageSummary: "PostgreSQL / Supabase table: loyalty_accounts (1:1 unique userId)",
    readerApis: [
      { mod: "@modules/admin", fn: "Loyalty foundation queries" },
    ],
    consumers: [
      { label: "Customer Rewards Foundation", href: "/" },
    ],
    relatedSourceIds: ["store_configs", "users"],
    previewColumns: ["userId", "pointsBalance", "lifetimePoints", "tier", "referralCode"],
  },
];

const UNIQUE_PRISMA_TABLES = Array.from(
  new Set(
    DATA_SOURCE_CATALOG.filter((d) => d.kind === "table").map((d) => d.tableName)
  )
);

const COPY = {
  ar: {
    heading: "مركز التحكم وتتبع الداتابيز الفعالة (Active Database Explorer)",
    subheading:
      "يعرض فقط الجداول والمخازن المستخدمة فعلياً في الموقع الآن (3 مخازن معزولة + 8 جداول تشغيلية فعالة) بدون الجداول القديمة غير المستخدمة.",
    searchPlaceholder: "ابحث في كل الجداول والسجلات (اسم، إيميل، slug، رقم طلب، ID)...",
    refresh: "تحديث كل الداتابيز",
    lastSync: "آخر مزامنة",
    allDomains: "الكل",
    sourcesCount: "مصدر بيانات",
    liveRowsCount: "سجل حي إجمالاً",
    isolatedBadge: "مخزن معزول",
    tableBadge: "جدول DB",
    pipelineTitle: "مسار حركة البيانات (4 مراحل)",
    stage1: "1. مصادر الكتابة والتعديل (Writers)",
    stage2: "2. مكان الحفظ والهيكل (Storage & Schema)",
    stage3: "3. دوال القراءة الوسيطة (APIs)",
    stage4: "4. الصفحات المستهلكة (Consumers)",
    relatedTitle: "الجداول المرتبطة (اضغط للانتقال الفوري)",
    openInGraph: "فتح الجدول في خريطة العلاقات",
    columnsLabel: "أعمدة الجدول",
    liveRecordsTitle: "السجلات الفعلية الموجودة حالياً",
    filterRowsPlaceholder: "فلتر داخل صفوف هذا الجدول...",
    noRows: "لا توجد صفوف حالياً داخل هذا الجدول في Supabase.",
    noMatches: "لا توجد صفوف مطابقة للبحث الحالي.",
    errorLoad: "تعذر جلب صفوف هذا الجدول:",
    selectedRecordTitle: "معاينة الصف المحدد (Live Record Inspector)",
    clearRecord: "إغلاق الصف",
    rawJson: "كائن الـ JSON الكامل للصف",
    loading: "جاري تحميل كل جداول الداتابيز الحية من Supabase...",
    rowsWord: "صف",
    inspectAction: "فحص",
  },
  en: {
    heading: "Active Database Flow & Live Inspector",
    subheading:
      "Displays only the live active sources powering the site (8 active operational tables + 3 isolated storefront registries) with retired legacy tables removed.",
    searchPlaceholder: "Search across all 11 active sources & live records (name, slug, email, order, id)...",
    refresh: "Refresh Active DB",
    lastSync: "Synced",
    allDomains: "All",
    sourcesCount: "Sources",
    liveRowsCount: "Live Records Total",
    isolatedBadge: "Isolated Store",
    tableBadge: "DB Table",
    pipelineTitle: "End-to-End 4-Stage Pipeline",
    stage1: "1. Writers & Admin Forms",
    stage2: "2. Live Storage & Columns",
    stage3: "3. Reader APIs & Queries",
    stage4: "4. Storefront & UI Consumers",
    relatedTitle: "Connected Tables (click to jump)",
    openInGraph: "View Table in Schema Graph",
    columnsLabel: "Columns",
    liveRecordsTitle: "Live Records Inside Selected Source",
    filterRowsPlaceholder: "Filter rows inside this table...",
    noRows: "This table currently has 0 rows in Supabase.",
    noMatches: "No rows match the current filter.",
    errorLoad: "Could not fetch rows for this table:",
    selectedRecordTitle: "Selected Live Record Inspector",
    clearRecord: "Close Row",
    rawJson: "Full Raw JSON Payload",
    loading: "Syncing all active tables & 3 isolated registries from Supabase...",
    rowsWord: "rows",
    inspectAction: "Inspect",
  },
} as const;

function asString(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return `[${v.length} items]`;
  return "{JSON}";
}

function rowMatchesQuery(row: Record<string, unknown>, q: string): boolean {
  if (!q) return true;
  for (const [k, v] of Object.entries(row)) {
    if (k.toLowerCase().includes("password")) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      try {
        if (JSON.stringify(v).toLowerCase().includes(q)) return true;
      } catch {
        // Ignore unserializable values
      }
    } else if (String(v).toLowerCase().includes(q)) {
      return true;
    }
  }
  return false;
}

export function LiveDataFlowCanvas({
  lang,
  meta,
  initialSourceId,
  onOpenSchemaGraph,
}: {
  lang: Lang;
  meta?: SchemaMeta;
  initialSourceId?: string | null;
  onOpenSchemaGraph?: (modelName: string) => void;
}) {
  const t = COPY[lang];

  const [sourceStates, setSourceStates] = useState<Record<string, SourceFetchState>>({});
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [domainFilter, setDomainFilter] = useState<DomainKey>("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [rowFilter, setRowFilter] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialSourceId ?? "isolated_products"
  );
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialSourceId && DATA_SOURCE_CATALOG.some((s) => s.id === initialSourceId)) {
      setSelectedSourceId(initialSourceId);
      setSelectedRowIdx(null);
      setRowFilter("");
    }
  }, [initialSourceId]);

  const loadFullDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const tableEntries = await Promise.all(
        UNIQUE_PRISMA_TABLES.map(async (tableName) => {
          try {
            const rows = await sbSelect<Record<string, unknown>>(
              tableName,
              "select=*&limit=100"
            );
            return [tableName, { rows, ok: true } as SourceFetchState] as const;
          } catch (err) {
            return [
              tableName,
              {
                rows: [],
                ok: false,
                error: err instanceof Error ? err.message : "Fetch failed",
              } as SourceFetchState,
            ] as const;
          }
        })
      );

      // Also guarantee fetching the 3 isolated registry rows even if page_sections grows > 100 rows
      const isolatedRows = await sbSelect<{
        id: string;
        pageKey: string;
        config: Record<string, unknown>;
      }>(
        "page_sections",
        "select=id,pageKey,config&pageKey=in.(__isolated_universe_organizer_v1__,__isolated_product_organizer_v1__,__isolated_package_organizer_v1__)"
      ).catch(() => []);

      const byTable = Object.fromEntries(tableEntries);
      const nextStates: Record<string, SourceFetchState> = {};

      for (const def of DATA_SOURCE_CATALOG) {
        if (def.kind === "isolated" && def.isolatedPageKey && def.isolatedArrayKey) {
          const found = isolatedRows.find((r) => r.pageKey === def.isolatedPageKey);
          const list = found?.config?.[def.isolatedArrayKey];
          nextStates[def.id] = {
            rows: Array.isArray(list) ? (list as Record<string, unknown>[]) : [],
            ok: true,
          };
        } else {
          nextStates[def.id] = byTable[def.tableName] ?? { rows: [], ok: true };
        }
      }

      setSourceStates(nextStates);
      setFetchedAt(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFullDatabase();
  }, [loadFullDatabase]);

  const qGlobal = globalSearch.trim().toLowerCase();

  // Quick ID -> Human Title map for FK cross-resolution across the whole DB
  const humanLookupById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const def of DATA_SOURCE_CATALOG) {
      const rows = sourceStates[def.id]?.rows ?? [];
      for (const r of rows) {
        const id = typeof r.id === "string" ? r.id : null;
        if (!id) continue;
        const label =
          r.name ??
          r.orderNumber ??
          r.title ??
          r.sku ??
          r.email ??
          r.slug ??
          r.pageKey;
        if (typeof label === "string" && label.trim().length > 0) {
          map[id] = `${def.modelName}: ${label}`;
        }
      }
    }
    return map;
  }, [sourceStates]);

  const totalLiveRows = useMemo(() => {
    let sum = 0;
    for (const def of DATA_SOURCE_CATALOG) {
      sum += sourceStates[def.id]?.rows.length ?? 0;
    }
    return sum;
  }, [sourceStates]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, { sources: number; rows: number }> = {
      all: { sources: DATA_SOURCE_CATALOG.length, rows: totalLiveRows },
    };
    for (const grp of DOMAIN_GROUPS) {
      const defs = DATA_SOURCE_CATALOG.filter((d) => d.domainKey === grp.key);
      const rows = defs.reduce(
        (acc, d) => acc + (sourceStates[d.id]?.rows.length ?? 0),
        0
      );
      counts[grp.key] = { sources: defs.length, rows };
    }
    return counts;
  }, [sourceStates, totalLiveRows]);

  const filteredGroups = useMemo(() => {
    return DOMAIN_GROUPS.filter(
      (grp) => domainFilter === "all" || domainFilter === grp.key
    )
      .map((grp) => {
        const items = DATA_SOURCE_CATALOG.filter((def) => {
          if (def.domainKey !== grp.key) return false;
          if (!qGlobal) return true;
          const metaHit =
            def.labelAr.toLowerCase().includes(qGlobal) ||
            def.labelEn.toLowerCase().includes(qGlobal) ||
            def.tableName.toLowerCase().includes(qGlobal) ||
            def.modelName.toLowerCase().includes(qGlobal);
          if (metaHit) return true;
          const rows = sourceStates[def.id]?.rows ?? [];
          return rows.some((r) => rowMatchesQuery(r, qGlobal));
        });
        return { grp, items };
      })
      .filter((entry) => entry.items.length > 0);
  }, [domainFilter, qGlobal, sourceStates]);

  const activeSource = useMemo(
    () =>
      DATA_SOURCE_CATALOG.find((s) => s.id === selectedSourceId) ??
      DATA_SOURCE_CATALOG[0]!,
    [selectedSourceId]
  );

  const activeState: SourceFetchState = sourceStates[activeSource.id] ?? {
    rows: [],
    ok: true,
  };

  const activeModelSchema = useMemo(
    () => meta?.models.find((m) => m.name === activeSource.modelName) ?? null,
    [meta, activeSource.modelName]
  );

  const activeEdges = useMemo(
    () =>
      meta?.edges.filter(
        (e) =>
          e.from === activeSource.modelName || e.to === activeSource.modelName
      ) ?? [],
    [meta, activeSource.modelName]
  );

  const visibleRows = useMemo(() => {
    const qRow = rowFilter.trim().toLowerCase() || qGlobal;
    return activeState.rows
      .map((row, originalIdx) => ({ row, originalIdx }))
      .filter(({ row }) => rowMatchesQuery(row, qRow));
  }, [activeState.rows, rowFilter, qGlobal]);

  const selectedRecord =
    selectedRowIdx !== null ? activeState.rows[selectedRowIdx] ?? null : null;

  // Dynamic columns: priority previewColumns first, then remaining fields found in rows
  const tableColumns = useMemo(() => {
    const seen = new Set<string>(activeSource.previewColumns);
    const cols = [...activeSource.previewColumns];
    const sample = activeState.rows[0];
    if (sample) {
      for (const k of Object.keys(sample)) {
        if (!seen.has(k) && !k.toLowerCase().includes("password") && cols.length < 7) {
          seen.add(k);
          cols.push(k);
        }
      }
    }
    return cols;
  }, [activeSource.previewColumns, activeState.rows]);

  const toggleDomainCollapse = (key: string) => {
    setCollapsedDomains((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectSource = (id: string) => {
    setSelectedSourceId(id);
    setSelectedRowIdx(null);
    setRowFilter("");
  };

  // Extra cross-entity summary when inspecting a live row inside Isolated Stores
  const isolatedRowContext = useMemo(() => {
    if (!selectedRecord || activeSource.kind !== "isolated") return null;
    const id = typeof selectedRecord.id === "string" ? selectedRecord.id : "";
    const universes = sourceStates.isolated_universes?.rows ?? [];
    const products = sourceStates.isolated_products?.rows ?? [];
    const packages = sourceStates.isolated_packages?.rows ?? [];

    if (activeSource.id === "isolated_products") {
      const parentU = universes.filter(
        (u) => Array.isArray(u.productIds) && u.productIds.includes(id)
      );
      const parentK = packages.filter(
        (k) => Array.isArray(k.productIds) && k.productIds.includes(id)
      );
      return {
        badges: [
          ...parentU.map((u) => ({
            text: `Universe: ${String(u.name ?? u.slug ?? u.id)}`,
            targetId: "isolated_universes",
          })),
          ...parentK.map((k) => ({
            text: `Package: ${String(k.name ?? k.slug ?? k.id)}`,
            targetId: "isolated_packages",
          })),
        ],
      };
    }

    if (activeSource.id === "isolated_universes") {
      const pIds = Array.isArray(selectedRecord.productIds)
        ? (selectedRecord.productIds as unknown[])
        : [];
      const oIds = Array.isArray(selectedRecord.offerIds)
        ? (selectedRecord.offerIds as unknown[])
        : [];
      return {
        badges: [
          {
            text: `${pIds.length} ${lang === "ar" ? "منتج مرتبط" : "linked products"}`,
            targetId: "isolated_products",
          },
          {
            text: `${oIds.length} ${lang === "ar" ? "باكدج/كوليكشن" : "linked packages"}`,
            targetId: "isolated_packages",
          },
        ],
      };
    }

    if (activeSource.id === "isolated_packages") {
      const parentU = universes.filter(
        (u) => Array.isArray(u.offerIds) && u.offerIds.includes(id)
      );
      const pIds = Array.isArray(selectedRecord.productIds)
        ? (selectedRecord.productIds as unknown[])
        : [];
      const linkedNames = products
        .filter((p) => pIds.includes(p.id))
        .map((p) => String(p.name ?? p.id));
      return {
        badges: [
          ...parentU.map((u) => ({
            text: `Universe: ${String(u.name ?? u.id)}`,
            targetId: "isolated_universes",
          })),
          ...linkedNames.map((n) => ({
            text: `Product: ${n}`,
            targetId: "isolated_products",
          })),
        ],
      };
    }

    return null;
  }, [selectedRecord, activeSource.kind, activeSource.id, sourceStates, lang]);

  return (
    <div className="flex-1 space-y-5 overflow-x-hidden bg-[#040308] p-4 md:p-6">
      {/* TOP CONTROL HUD */}
      <div className="mx-auto max-w-[1760px] space-y-4 rounded-2xl border border-cyan-400/20 bg-[#080612]/90 p-4 shadow-[0_0_32px_rgba(56,189,248,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Workflow className="h-4 w-4 text-cyan-300" />
              <h2 className="font-serif text-base font-semibold text-white">
                {t.heading}
              </h2>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
                {DATA_SOURCE_CATALOG.length} {t.sourcesCount}
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                {totalLiveRows} {t.liveRowsCount}
              </span>
              {fetchedAt ? (
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/65">
                  {t.lastSync}: {fetchedAt}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/65">
              {t.subheading}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-9 w-80 max-w-full rounded-full border border-white/15 bg-black/60 pl-9 pr-8 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
              />
              {globalSearch ? (
                <button
                  type="button"
                  onClick={() => setGlobalSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void loadFullDatabase()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{t.refresh}</span>
            </button>
          </div>
        </div>

        {/* DOMAIN FILTER TABS */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setDomainFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
              domainFilter === "all"
                ? "border-white/60 bg-white text-black"
                : "border-white/15 bg-black/50 text-white/75 hover:border-white/35"
            }`}
          >
            <span>{t.allDomains}</span>
            <span className="font-mono text-[10px] opacity-75">
              ({domainCounts.all?.sources ?? 17} • {domainCounts.all?.rows ?? 0})
            </span>
          </button>

          {DOMAIN_GROUPS.map((grp) => {
            const active = domainFilter === grp.key;
            const c = domainCounts[grp.key] ?? { sources: 0, rows: 0 };
            return (
              <button
                key={grp.key}
                type="button"
                onClick={() => setDomainFilter(grp.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                  active
                    ? "border-white/50 bg-white/15 text-white"
                    : "border-white/10 bg-black/40 text-white/65 hover:border-white/30 hover:text-white"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: grp.color }}
                />
                <span>{lang === "ar" ? grp.labelAr : grp.labelEn}</span>
                <span className="font-mono text-[10px] text-white/55">
                  {c.sources} ({c.rows})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && Object.keys(sourceStates).length === 0 ? (
        <div className="mx-auto max-w-[1760px] rounded-3xl border border-white/10 bg-[#080612] p-16 text-center text-sm text-white/60">
          {t.loading}
        </div>
      ) : (
        /* ORGANIZED MASTER-DETAIL WORKSPACE */
        <div className="mx-auto grid max-w-[1760px] grid-cols-1 gap-5 xl:grid-cols-12">
          {/* ==========================================================
              LEFT MASTER NAVIGATOR: ALL 17 SOURCES BY DOMAIN (4 COLS)
             ========================================================== */}
          <aside className="space-y-3 xl:col-span-4">
            {filteredGroups.map(({ grp, items }) => {
              const isCollapsed = Boolean(collapsedDomains[grp.key]);
              const grpRowSum = items.reduce(
                (acc, item) => acc + (sourceStates[item.id]?.rows.length ?? 0),
                0
              );
              return (
                <div
                  key={grp.key}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#080612]/95"
                >
                  <button
                    type="button"
                    onClick={() => toggleDomainCollapse(grp.key)}
                    className="flex w-full items-center justify-between border-b border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: grp.color }}
                      />
                      <span className="text-xs font-bold text-white">
                        {lang === "ar" ? grp.labelAr : grp.labelEn}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-emerald-300">
                        {grpRowSum} {t.rowsWord}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-white/50" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                      )}
                    </div>
                  </button>

                  {!isCollapsed ? (
                    <div className="space-y-1.5 p-2.5">
                      {items.map((def) => {
                        const st = sourceStates[def.id] ?? { rows: [], ok: true };
                        const isSelected = activeSource.id === def.id;
                        const matchingCount = qGlobal
                          ? st.rows.filter((r) => rowMatchesQuery(r, qGlobal)).length
                          : st.rows.length;

                        return (
                          <button
                            key={def.id}
                            type="button"
                            onClick={() => handleSelectSource(def.id)}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                              isSelected
                                ? "bg-white/[0.08]"
                                : "border-white/5 bg-black/40 hover:border-white/25 hover:bg-white/[0.04]"
                            }`}
                            style={{
                              borderColor: isSelected ? def.accentColor : undefined,
                              boxShadow: isSelected
                                ? `0 0 20px ${def.accentColor}26`
                                : undefined,
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: def.accentColor }}
                                />
                                <span className="truncate text-xs font-bold text-white">
                                  {lang === "ar" ? def.labelAr : def.labelEn}
                                </span>
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                                    def.kind === "isolated"
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : "bg-white/10 text-white/65"
                                  }`}
                                >
                                  {def.kind === "isolated"
                                    ? t.isolatedBadge
                                    : t.tableBadge}
                                </span>
                              </div>
                              <p
                                className="mt-0.5 truncate font-mono text-[10px] text-white/50"
                                dir="ltr"
                              >
                                {def.isolatedPageKey
                                  ? `${def.tableName} -> ${def.isolatedPageKey}`
                                  : `${def.tableName} (${def.modelName})`}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                              {!st.ok ? (
                                <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-red-300">
                                  ERR
                                </span>
                              ) : (
                                <span
                                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                                    matchingCount > 0
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : "bg-white/10 text-white/45"
                                  }`}
                                >
                                  {qGlobal && matchingCount !== st.rows.length
                                    ? `${matchingCount}/${st.rows.length}`
                                    : st.rows.length}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </aside>

          {/* ==========================================================
              RIGHT DETAIL STAGE: 4-STEP FLOW + LIVE ROWS + INSPECTOR (8 COLS)
             ========================================================== */}
          <section className="space-y-5 xl:col-span-8">
            {/* SELECTED SOURCE HEADER + PIPELINE */}
            <div
              className="rounded-3xl border bg-[#090714]/95 p-5 shadow-2xl"
              style={{
                borderColor: `${activeSource.accentColor}66`,
                boxShadow: `0 0 36px ${activeSource.accentColor}1a`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: activeSource.accentColor }}
                    />
                    <h3 className="font-serif text-lg font-semibold text-white">
                      {lang === "ar" ? activeSource.labelAr : activeSource.labelEn}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold"
                      style={{
                        backgroundColor: `${activeSource.accentColor}22`,
                        color: activeSource.accentColor,
                      }}
                    >
                      {activeSource.modelName}
                    </span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                      {activeState.rows.length} {t.rowsWord}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/70">
                    {lang === "ar" ? activeSource.descAr : activeSource.descEn}
                  </p>
                </div>

                {onOpenSchemaGraph ? (
                  <button
                    type="button"
                    onClick={() => onOpenSchemaGraph(activeSource.modelName)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/25"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>{t.openInGraph}</span>
                  </button>
                ) : null}
              </div>

              {/* 4-STAGE ARCHITECTURE PIPELINE */}
              <div className="mt-4">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
                  {t.pipelineTitle}
                </p>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4" dir="ltr">
                  {/* STAGE 1: WRITERS */}
                  <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/[0.06] p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
                      <Sparkles className="h-3 w-3" />
                      {t.stage1}
                    </p>
                    <div className="mt-2 space-y-2">
                      {activeSource.writers.map((w) => (
                        <div
                          key={w.label}
                          className="rounded-xl border border-white/10 bg-black/45 p-2.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold text-white">
                              {w.label}
                            </span>
                            {w.route ? (
                              <Link
                                href={w.route}
                                className="inline-flex items-center gap-0.5 rounded bg-fuchsia-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/35"
                              >
                                {w.route}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            ) : null}
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-white/60">
                            {w.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STAGE 2: STORAGE & COLUMNS */}
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <Database className="h-3 w-3" />
                      {t.stage2}
                    </p>
                    <p className="mt-2 rounded-lg bg-black/45 p-2 font-mono text-[10px] leading-relaxed text-emerald-200">
                      {activeSource.storageSummary}
                    </p>
                    {activeModelSchema ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {activeModelSchema.fields
                          .filter((f) => !f.isModelRelation)
                          .slice(0, 10)
                          .map((f) => (
                            <span
                              key={f.name}
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] ${
                                f.isId
                                  ? "bg-amber-500/20 text-amber-200"
                                  : f.isForeignKey
                                  ? "bg-cyan-500/20 text-cyan-200"
                                  : "bg-white/10 text-white/75"
                              }`}
                            >
                              {f.isId ? <Key className="h-2.5 w-2.5" /> : null}
                              {f.isForeignKey ? <Link2 className="h-2.5 w-2.5" /> : null}
                              {f.name}
                            </span>
                          ))}
                      </div>
                    ) : null}
                  </div>

                  {/* STAGE 3: READER APIS */}
                  <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.06] p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      <Server className="h-3 w-3" />
                      {t.stage3}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {activeSource.readerApis.map((api) => (
                        <div
                          key={`${api.mod}:${api.fn}`}
                          className="rounded-xl border border-white/10 bg-black/45 p-2"
                        >
                          <p className="font-mono text-[9px] text-white/50">
                            {api.mod}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] font-semibold text-cyan-200">
                            {api.fn}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STAGE 4: CONSUMERS */}
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      <Store className="h-3 w-3" />
                      {t.stage4}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {activeSource.consumers.map((c) =>
                        c.href ? (
                          <Link
                            key={c.label}
                            href={c.href}
                            className="flex items-center justify-between gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-2 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
                          >
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              {c.label}
                            </span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </Link>
                        ) : (
                          <div
                            key={c.label}
                            className="rounded-xl border border-white/10 bg-black/45 px-2.5 py-2 text-[10px] text-white/80"
                          >
                            {c.label}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONNECTED TABLES & SCHEMA EDGES */}
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="mb-2 text-[11px] font-bold text-white/55">
                  {t.relatedTitle}
                </p>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {activeSource.relatedSourceIds.map((relId) => {
                    const target = DATA_SOURCE_CATALOG.find((s) => s.id === relId);
                    if (!target) return null;
                    const cnt = sourceStates[target.id]?.rows.length ?? 0;
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => handleSelectSource(target.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] text-white/85 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-200"
                      >
                        <ArrowRight className="h-3 w-3 text-cyan-300" />
                        <span>{target.modelName}</span>
                        <span className="text-white/45">({cnt})</span>
                      </button>
                    );
                  })}
                  {activeEdges.slice(0, 6).map((edge) => (
                    <span
                      key={edge.id}
                      className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[10px] text-white/50"
                    >
                      {edge.from === activeSource.modelName
                        ? `→ ${edge.to}.${edge.field}`
                        : `← ${edge.from}.${edge.field}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* SELECTED RECORD DEEP INSPECTOR */}
            {selectedRecord ? (
              <div
                className="rounded-3xl border border-cyan-400/45 bg-[#080b18] p-5 shadow-[0_0_30px_rgba(56,189,248,0.14)]"
                dir="ltr"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                      {t.selectedRecordTitle}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white">
                      {String(
                        selectedRecord.name ??
                          selectedRecord.orderNumber ??
                          selectedRecord.title ??
                          selectedRecord.email ??
                          selectedRecord.slug ??
                          selectedRecord.id ??
                          `Row #${(selectedRowIdx ?? 0) + 1}`
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRowIdx(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/75 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                    <span>{t.clearRecord}</span>
                  </button>
                </div>

                {isolatedRowContext && isolatedRowContext.badges.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {isolatedRowContext.badges.map((b, i) => (
                      <button
                        key={`${b.targetId}-${i}`}
                        type="button"
                        onClick={() => handleSelectSource(b.targetId)}
                        className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/25"
                      >
                        {b.text}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(selectedRecord).map(([k, v]) => {
                    if (k.toLowerCase().includes("password")) {
                      return (
                        <div
                          key={k}
                          className="rounded-xl border border-white/10 bg-black/50 p-2.5"
                        >
                          <p className="font-mono text-[10px] text-white/45">{k}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-amber-200">
                            •••••••• (Secured)
                          </p>
                        </div>
                      );
                    }
                    const strVal = typeof v === "string" ? v : null;
                    const resolvedFk =
                      strVal && k.endsWith("Id") ? humanLookupById[strVal] : undefined;

                    return (
                      <div
                        key={k}
                        className="rounded-xl border border-white/10 bg-black/50 p-2.5"
                      >
                        <p className="font-mono text-[10px] text-white/45">{k}</p>
                        <p className="mt-0.5 break-all font-mono text-[11px] text-white/90">
                          {k.toLowerCase().includes("price") && typeof v === "number"
                            ? formatEgp(v)
                            : asString(v)}
                        </p>
                        {resolvedFk ? (
                          <p className="mt-1 rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200">
                            ↳ {resolvedFk}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <details className="mt-3 rounded-xl border border-white/10 bg-black/60 p-3">
                  <summary className="cursor-pointer font-mono text-[11px] font-bold text-cyan-300">
                    {t.rawJson}
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto font-mono text-[11px] leading-relaxed text-white/80">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </details>
              </div>
            ) : null}

            {/* LIVE RECORDS STRUCTURED TABLE */}
            <div className="rounded-3xl border border-white/10 bg-[#080612]/95 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-emerald-300" />
                  <h4 className="text-sm font-bold text-white">
                    {t.liveRecordsTitle} ({visibleRows.length})
                  </h4>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={rowFilter}
                    onChange={(e) => setRowFilter(e.target.value)}
                    placeholder={t.filterRowsPlaceholder}
                    className="h-8 w-64 rounded-full border border-white/15 bg-black/60 pl-8 pr-4 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
                  />
                </div>
              </div>

              {!activeState.ok ? (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-xs text-red-200">
                  {t.errorLoad} {activeState.error}
                </div>
              ) : activeState.rows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-10 text-center text-xs text-white/55">
                  {t.noRows}
                </div>
              ) : visibleRows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-10 text-center text-xs text-white/55">
                  {t.noMatches}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10" dir="ltr">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.04] font-mono text-[10px] uppercase tracking-wider text-white/60">
                        <th className="px-3 py-2.5">#</th>
                        {tableColumns.map((col) => (
                          <th key={col} className="px-3 py-2.5">
                            {col}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-right">{t.inspectAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {visibleRows.map(({ row, originalIdx }) => {
                        const isSelectedRow = selectedRowIdx === originalIdx;
                        return (
                          <tr
                            key={String(row.id ?? originalIdx)}
                            onClick={() => setSelectedRowIdx(originalIdx)}
                            className={`cursor-pointer transition-colors ${
                              isSelectedRow
                                ? "bg-cyan-500/15"
                                : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <td className="px-3 py-2 font-mono text-[10px] text-white/40">
                              {originalIdx + 1}
                            </td>
                            {tableColumns.map((col) => {
                              const val = row[col];
                              if (col === "accentColor" && typeof val === "string") {
                                return (
                                  <td key={col} className="px-3 py-2 font-mono text-[11px]">
                                    <span className="inline-flex items-center gap-1.5 text-white/85">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full border border-white/30"
                                        style={{ backgroundColor: val }}
                                      />
                                      {val}
                                    </span>
                                  </td>
                                );
                              }
                              if (
                                (col === "isActive" || col === "isVisible") &&
                                typeof val === "boolean"
                              ) {
                                return (
                                  <td key={col} className="px-3 py-2">
                                    {val ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                                        <Eye className="h-3 w-3" />
                                        true
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-200">
                                        <EyeOff className="h-3 w-3" />
                                        false
                                      </span>
                                    )}
                                  </td>
                                );
                              }
                              if (
                                (col === "basePrice" ||
                                  col === "finalPrice" ||
                                  col === "fixedPrice" ||
                                  col === "price" ||
                                  col === "total" ||
                                  col === "fee") &&
                                (typeof val === "number" || typeof val === "string")
                              ) {
                                const num = Number(val);
                                return (
                                  <td
                                    key={col}
                                    className="px-3 py-2 font-mono text-[11px] font-bold text-cyan-200"
                                  >
                                    {Number.isFinite(num) ? formatEgp(num) : asString(val)}
                                  </td>
                                );
                              }
                              const display = asString(val);
                              return (
                                <td
                                  key={col}
                                  className="max-w-[200px] truncate px-3 py-2 font-mono text-[11px] text-white/85"
                                >
                                  {display}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-right">
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-cyan-200">
                                {t.inspectAction}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
