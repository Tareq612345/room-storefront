/**
 * @file src/modules/admin/components/AdminPortalClient.tsx
 * @purpose Restructured ROOM Command Center (/admin/): practical operational hub with live search, advanced Orders+OrderItems CRM, full Shipping Zones CRUD, Analytics Prep & Live Funnel readout, Store Identity & Theme Presets synced to __isolated_universe_organizer_v1__, RBAC Team/Invites, and direct Studio links.
 */

"use client";

import {
  AnalyticsDashboardPanel,
  buildInitialAnalyticsRegistry,
  buildInitialFutureOpsRegistry,
  fetchAnalyticsRegistry,
  fetchFutureOpsRegistry,
  saveAnalyticsRegistry,
  type AnalyticsRegistry,
  type FutureOpsRegistry,
} from "@modules/analytics";
import { sbDelete, sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import {
  generateClientId,
  hashPasswordWeb,
  verifyPasswordWeb,
} from "@shared/utils/client-auth";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  CreditCard,
  Database,
  ExternalLink,
  FileText,
  Info,
  KeyRound,
  Languages,
  LayoutDashboard,
  Layers,
  LogOut,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  Type,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Lang = "ar" | "en";

type AdminTab =
  | "overview"
  | "orders"
  | "shipping"
  | "analytics"
  | "store"
  | "team"
  | "profile";

interface LocalAdminAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
  passwordHash: string;
}

interface LocalInvite {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  token: string;
  expiresAt: string;
  usedAt: string | null;
}

interface ThemePreset {
  id: string;
  name: string;
  isDefault?: boolean;
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  defaultAccent: string;
  universeColors: Record<string, string>;
}

interface AdminOrderItemRow {
  id: string;
  orderId: string;
  itemType: string;
  titleSnapshot: string;
  variantSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface AdminOrderRow {
  id: string;
  orderNumber: string;
  shippingZoneId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string | null;
  customerEmail: string | null;
  shippingAddress: string;
  city: string;
  notes: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  createdAt: string;
}

interface ShippingZoneRow {
  id: string;
  name: string;
  city: string;
  fee: number;
  freeThreshold: number;
  days: string;
  active: boolean;
}

const SESSION_KEY = "room_admin_session_v1";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "COD_COLLECTED",
  "FAILED",
  "REFUNDED",
] as const;

const I18N = {
  en: {
    brand: "ROOM COMMAND",
    supabaseLive: "Supabase Live",
    loginSub: "Sign in with Username or Email",
    identifierLabel: "Username or Email",
    identifierPlaceholder: "username or email@domain.com",
    passwordLabel: "Password",
    loginBtn: "Enter Command Center",
    loginErr: "Invalid credentials or deactivated account",
    searchPlaceholder: "Search orders, products, zones...",
    tabs: {
      overview: "Command Hub",
      orders: "Orders & CRM",
      shipping: "Shipping Zones",
      analytics: "Analytics Prep",
      store: "Store & Themes",
      team: "Team & Invites",
      profile: "My Profile",
    },
    viewStore: "Storefront",
    viewSchema: "DB Map",
    signOut: "Sign Out",
    saveBtn: "Save Changes",
    savedBtn: "Saved!",
    studiosHubTitle: "Isolated Feature Studios (Strict Boundaries)",
    lowStockTitle: "Low Stock Alerts (<= 5)",
    allHealthy: "All active products have healthy stock (> 5).",
    noOrders: "No orders placed yet. Test Checkout from My Room bag to see live orders here.",
    whatsappBtn: "WhatsApp",
    teamSub: "Invite admins with a 48h single-use link, or manage existing access roles.",
  },
  ar: {
    brand: "مركز تحكم ROOM",
    supabaseLive: "متصل بـ Supabase",
    loginSub: "سجّل الدخول باسم المستخدم أو البريد الإلكتروني",
    identifierLabel: "اسم المستخدم أو البريد الإلكتروني",
    identifierPlaceholder: "اسم المستخدم أو البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    loginBtn: "دخول مركز التحكم",
    loginErr: "بيانات الدخول غير صحيحة أو الحساب معطّل",
    searchPlaceholder: "بحث في الطلبات والمنتجات والمناطق...",
    tabs: {
      overview: "مركز القيادة",
      orders: "الطلبات والعملاء",
      shipping: "مناطق الشحن",
      analytics: "الإحصائيات والبيانات",
      store: "هوية المتجر والثيمات",
      team: "الفريق والصلاحيات",
      profile: "ملفي الشخصي",
    },
    viewStore: "المتجر",
    viewSchema: "خريطة الداتا بيز",
    signOut: "خروج",
    saveBtn: "حفظ التغييرات",
    savedBtn: "تم الحفظ!",
    studiosHubTitle: "الاستوديوهات المعزولة (كل نظام يُدار من مكانه المستقل فقط)",
    lowStockTitle: "تنبيهات نقص المخزون (5 أو أقل)",
    allHealthy: "كل المنتجات النشطة بمخزون آمن.",
    noOrders: "لا توجد طلبات مسجلة بعد. جرّب إتمام طلب من سلة المتجر ليظهر هنا فوراً بكل تفاصيله.",
    whatsappBtn: "تحديث واتساب",
    teamSub: "أنشئ روابط دعوة لمدة 48 ساعة أو تحكم في صلاحيات وتفعيل أعضاء الفريق.",
  },
} as const;

export function AdminPortalClient() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = I18N[lang];

  const [storeId, setStoreId] = useState<string>("store_room_egypt");
  const [accounts, setAccounts] = useState<LocalAdminAccount[]>([]);
  const [invites, setInvites] = useState<LocalInvite[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [savedSection, setSavedSection] = useState<AdminTab | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Store & Theme state (DB-driven footer + identity + colors)
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [footerTagline, setFooterTagline] = useState("");
  const [defaultAccent, setDefaultAccent] = useState("#ffffff");
  const [bgPrimary, setBgPrimary] = useState("#05030a");
  const [bgSecondary, setBgSecondary] = useState("#0b0617");
  const [bgElevated, setBgElevated] = useState("#140b29");
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");

  // Live Isolated Vault summaries + Operational tables
  const [universes, setUniverses] = useState<
    Array<{ id: string; slug: string; name: string; accentColor: string; isActive: boolean }>
  >([]);
  const [products, setProducts] = useState<
    Array<{ id: string; slug: string; name: string; stock: number; isActive: boolean }>
  >([]);
  const [packagesCount, setPackagesCount] = useState(0);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [orderItemsByOrder, setOrderItemsByOrder] = useState<
    Record<string, AdminOrderItemRow[]>
  >({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");

  // Shipping CRUD state
  const [zones, setZones] = useState<ShippingZoneRow[]>([]);
  const [confirmDeleteZoneId, setConfirmDeleteZoneId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCity, setNewZoneCity] = useState("Cairo");
  const [newZoneFee, setNewZoneFee] = useState(65);
  const [newZoneThreshold, setNewZoneThreshold] = useState(2500);
  const [newZoneDays, setNewZoneDays] = useState("1-2 Days");

  // Analytics Prep & Future Ops telemetry state
  const [analyticsRegistry, setAnalyticsRegistry] = useState<AnalyticsRegistry>(() =>
    buildInitialAnalyticsRegistry()
  );
  const [futureOps, setFutureOps] = useState<FutureOpsRegistry>(() =>
    buildInitialFutureOpsRegistry()
  );

  // Invite & Profile
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "STAFF">("ADMIN");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadPortalData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        sbStores,
        sbIsolated,
        sbZones,
        sbUsers,
        sbInvites,
        sbOrders,
        sbOrderItems,
        anSnap,
        fopsSnap,
      ] = await Promise.all([
        sbSelect<{
          id: string;
          name: string;
          whatsappNumber: string | null;
          supportEmail: string | null;
          defaultAccentColor: string;
          themeTokens: {
            bgPrimary?: string;
            bgSecondary?: string;
            bgElevated?: string;
            footerTagline?: string;
            presets?: ThemePreset[];
          };
        }>(
          "store_configs",
          "select=id,name,whatsappNumber,supportEmail,defaultAccentColor,themeTokens&slug=eq.room-egypt"
        ),
        sbSelect<{
          pageKey: string;
          config: Record<string, unknown>;
        }>(
          "page_sections",
          "select=pageKey,config&pageKey=in.(__isolated_universe_organizer_v1__,__isolated_product_organizer_v1__,__isolated_package_organizer_v1__)"
        ),
        sbSelect<{
          id: string;
          name: string;
          city: string;
          fee: number | string;
          freeShippingThreshold: number | string | null;
          estimatedDays: string;
          isActive: boolean;
        }>(
          "shipping_zones",
          "select=id,name,city,fee,freeShippingThreshold,estimatedDays,isActive&order=sortOrder.asc"
        ),
        sbSelect<{
          id: string;
          email: string | null;
          username: string | null;
          name: string;
          role: "OWNER" | "ADMIN" | "STAFF";
          isActive: boolean;
        }>(
          "users",
          "select=id,email,username,name,role,isActive&role=in.(OWNER,ADMIN,STAFF)&order=createdAt.asc"
        ),
        sbSelect<LocalInvite>(
          "admin_invites",
          "select=id,email,role,token,expiresAt,usedAt&order=createdAt.desc"
        ),
        sbSelect<AdminOrderRow>(
          "orders",
          "select=id,orderNumber,shippingZoneId,customerName,customerPhone,customerWhatsapp,customerEmail,shippingAddress,city,notes,status,paymentMethod,paymentStatus,paymentReference,subtotal,shippingFee,discountAmount,total,createdAt&order=createdAt.desc&limit=100"
        ),
        sbSelect<AdminOrderItemRow>(
          "order_items",
          "select=id,orderId,itemType,titleSnapshot,variantSnapshot,unitPrice,quantity,lineTotal&limit=300"
        ),
        fetchAnalyticsRegistry(),
        fetchFutureOpsRegistry(),
      ]);

      let parsedUnivs: Array<{
        id: string;
        slug: string;
        name: string;
        accentColor: string;
        isActive: boolean;
      }> = [];

      const uRow = sbIsolated.find(
        (r) => r.pageKey === "__isolated_universe_organizer_v1__"
      );
      if (Array.isArray(uRow?.config?.universes)) {
        parsedUnivs = uRow.config.universes.map((u: Record<string, unknown>) => ({
          id: String(u.id ?? ""),
          slug: String(u.slug ?? ""),
          name: String(u.name ?? ""),
          accentColor: String(u.accentColor ?? "#c94b99"),
          isActive: u.isActive !== false,
        }));
        setUniverses(parsedUnivs);
      }

      const pRow = sbIsolated.find(
        (r) => r.pageKey === "__isolated_product_organizer_v1__"
      );
      if (Array.isArray(pRow?.config?.products)) {
        setProducts(
          pRow.config.products.map((p: Record<string, unknown>) => ({
            id: String(p.id ?? ""),
            slug: String(p.slug ?? ""),
            name: String(p.name ?? ""),
            stock: typeof p.stock === "number" ? p.stock : 0,
            isActive: p.isActive !== false,
          }))
        );
      }

      const kRow = sbIsolated.find(
        (r) => r.pageKey === "__isolated_package_organizer_v1__"
      );
      if (Array.isArray(kRow?.config?.packages)) {
        setPackagesCount(kRow.config.packages.length);
      }

      if (sbStores[0]) {
        const st = sbStores[0];
        setStoreId(st.id);
        setStoreName(st.name);
        setWhatsapp(st.whatsappNumber ?? "");
        setSupportEmail(st.supportEmail ?? "");
        setFooterTagline(st.themeTokens?.footerTagline ?? "");
        setDefaultAccent(st.defaultAccentColor);
        if (st.themeTokens?.bgPrimary) setBgPrimary(st.themeTokens.bgPrimary);
        if (st.themeTokens?.bgSecondary) setBgSecondary(st.themeTokens.bgSecondary);
        if (st.themeTokens?.bgElevated) setBgElevated(st.themeTokens.bgElevated);

        const dynamicBaselineColors: Record<string, string> = {};
        for (const u of parsedUnivs) {
          dynamicBaselineColors[u.slug] = u.accentColor;
        }
        const defaultBaseline: ThemePreset = {
          id: "preset_store_baseline",
          name: `${st.name} Baseline`,
          isDefault: true,
          bgPrimary: "#05030a",
          bgSecondary: "#0b0617",
          bgElevated: "#140b29",
          defaultAccent: "#ffffff",
          universeColors: dynamicBaselineColors,
        };
        const savedPresets = st.themeTokens?.presets ?? [];
        setPresets([
          defaultBaseline,
          ...savedPresets.filter((p) => p.id !== defaultBaseline.id),
        ]);
      }

      setZones(
        sbZones.map((z) => ({
          id: z.id,
          name: z.name,
          city: z.city || "Cairo",
          fee: Number(z.fee),
          freeThreshold: z.freeShippingThreshold
            ? Number(z.freeShippingThreshold)
            : 2500,
          days: z.estimatedDays || "1-2 Days",
          active: z.isActive,
        }))
      );

      setAccounts(
        sbUsers.map((u) => ({
          id: u.id,
          email: u.email ?? "",
          username: u.username ?? "",
          name: u.name,
          role: u.role,
          isActive: u.isActive !== false,
          passwordHash: "",
        }))
      );

      setInvites(sbInvites);

      setOrders(
        sbOrders.map((o) => ({
          ...o,
          subtotal: Number(o.subtotal),
          shippingFee: Number(o.shippingFee),
          discountAmount: Number(o.discountAmount),
          total: Number(o.total),
        }))
      );

      const groupedItems: Record<string, AdminOrderItemRow[]> = {};
      for (const item of sbOrderItems) {
        const normalized: AdminOrderItemRow = {
          ...item,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        };
        if (!groupedItems[item.orderId]) groupedItems[item.orderId] = [];
        groupedItems[item.orderId]!.push(normalized);
      }
      setOrderItemsByOrder(groupedItems);

      setAnalyticsRegistry(anSnap.registry);
      setFutureOps(fopsSnap.registry);
    } catch {
      // Preserve loaded state on transient network failure
    } finally {
      setRefreshing(false);
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) setCurrentUserId(savedSession);
    } catch {
      // Ignore
    }
    void loadPortalData();
  }, [loadPortalData]);

  const currentUser = accounts.find(
    (a) => a.id === currentUserId && a.isActive
  ) ?? null;

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileUsername(currentUser.username);
      setProfileEmail(currentUser.email);
    }
  }, [currentUser]);

  const isOwner = currentUser?.role === "OWNER";
  const isStaffOnly = currentUser?.role === "STAFF";

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.isActive && p.stock <= 5),
    [products]
  );

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "PENDING").length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((ord) => {
      if (orderStatusFilter !== "ALL" && ord.status !== orderStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerPhone.toLowerCase().includes(q) ||
        ord.city.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const quickSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      id: string;
      kindLabel: string;
      title: string;
      sub: string;
      onSelect: () => void;
    }> = [];

    for (const o of orders) {
      if (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q)
      ) {
        results.push({
          id: `ord-${o.id}`,
          kindLabel: lang === "ar" ? "طلب" : "Order",
          title: `#${o.orderNumber} — ${o.customerName}`,
          sub: `${formatEgp(o.total)} • ${o.status}`,
          onSelect: () => {
            setActiveTab("orders");
            setOrderSearch(o.orderNumber);
            setExpandedOrderId(o.id);
            setSearchQuery("");
          },
        });
      }
    }

    for (const p of products) {
      if (p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)) {
        results.push({
          id: `prd-${p.id}`,
          kindLabel: lang === "ar" ? "منتج" : "Product",
          title: p.name,
          sub: `Stock: ${p.stock}`,
          onSelect: () => {
            setActiveTab("overview");
            setSearchQuery("");
          },
        });
      }
    }

    for (const z of zones) {
      if (z.name.toLowerCase().includes(q) || z.city.toLowerCase().includes(q)) {
        results.push({
          id: `zn-${z.id}`,
          kindLabel: lang === "ar" ? "شحن" : "Zone",
          title: z.name,
          sub: `${z.city} • ${formatEgp(z.fee)}`,
          onSelect: () => {
            setActiveTab("shipping");
            setSearchQuery("");
          },
        });
      }
    }

    return results.slice(0, 8);
  }, [searchQuery, orders, products, zones, lang]);

  const markSaved = (tab: AdminTab) => {
    setSavedSection(tab);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const syncThemeSnapshotLocally = (
    p: string,
    s: string,
    e: string,
    acc: string,
    univList: typeof universes,
    nameOverride?: string,
    taglineOverride?: string
  ) => {
    const univMap: Record<string, string> = {};
    for (const u of univList) univMap[u.slug] = u.accentColor;
    localStorage.setItem(
      "room_theme_snapshot_v1",
      JSON.stringify({
        storeName: nameOverride ?? storeName,
        footerTagline: taglineOverride ?? footerTagline,
        bgPrimary: p,
        bgSecondary: s,
        bgElevated: e,
        defaultAccent: acc,
        universes: univMap,
      })
    );
  };

  const handleSaveStore = async (nextPresets = presets) => {
    try {
      await sbPatch("store_configs", "slug=eq.room-egypt", {
        name: storeName.trim() || "ROOM",
        whatsappNumber: whatsapp.trim() || null,
        supportEmail: supportEmail.trim() || null,
        defaultAccentColor: defaultAccent,
        themeTokens: {
          bgPrimary,
          bgSecondary,
          bgElevated,
          defaultAccent,
          footerTagline: footerTagline.trim(),
          presets: nextPresets.filter((p) => !p.isDefault),
        },
        updatedAt: new Date().toISOString(),
      });
      syncThemeSnapshotLocally(
        bgPrimary,
        bgSecondary,
        bgElevated,
        defaultAccent,
        universes
      );
      markSaved("store");
    } catch {
      // Ignore
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const univColors: Record<string, string> = {};
    for (const u of universes) univColors[u.slug] = u.accentColor;

    const created: ThemePreset = {
      id: generateClientId("preset"),
      name: newPresetName.trim(),
      bgPrimary,
      bgSecondary,
      bgElevated,
      defaultAccent,
      universeColors: univColors,
    };

    const nextPresets = [...presets, created];
    setPresets(nextPresets);
    setNewPresetName("");
    await handleSaveStore(nextPresets);
  };

  const handleApplyPreset = async (preset: ThemePreset) => {
    setBgPrimary(preset.bgPrimary);
    setBgSecondary(preset.bgSecondary);
    setBgElevated(preset.bgElevated);
    setDefaultAccent(preset.defaultAccent);

    const nextUnivs = universes.map((u) => ({
      ...u,
      accentColor: preset.universeColors[u.slug] ?? u.accentColor,
    }));
    setUniverses(nextUnivs);

    try {
      const nowIso = new Date().toISOString();
      await sbPatch("store_configs", "slug=eq.room-egypt", {
        defaultAccentColor: preset.defaultAccent,
        themeTokens: {
          bgPrimary: preset.bgPrimary,
          bgSecondary: preset.bgSecondary,
          bgElevated: preset.bgElevated,
          defaultAccent: preset.defaultAccent,
          footerTagline: footerTagline.trim(),
          presets: presets.filter((p) => !p.isDefault),
        },
        updatedAt: nowIso,
      });

      // Persist Universe accent updates directly inside __isolated_universe_organizer_v1__
      const uRows = await sbSelect<{ config: Record<string, unknown> }>(
        "page_sections",
        "select=config&pageKey=eq.__isolated_universe_organizer_v1__"
      );
      if (uRows[0]?.config && Array.isArray(uRows[0].config.universes)) {
        const updatedUniversesConfig = {
          ...uRows[0].config,
          updatedAt: nowIso,
          universes: uRows[0].config.universes.map((rawU: Record<string, unknown>) => {
            const slug = String(rawU.slug ?? "");
            const nextAccent = preset.universeColors[slug];
            return nextAccent ? { ...rawU, accentColor: nextAccent, updatedAt: nowIso } : rawU;
          }),
        };
        await sbPatch(
          "page_sections",
          "pageKey=eq.__isolated_universe_organizer_v1__",
          { config: updatedUniversesConfig, updatedAt: nowIso }
        );
      }

      syncThemeSnapshotLocally(
        preset.bgPrimary,
        preset.bgSecondary,
        preset.bgElevated,
        preset.defaultAccent,
        nextUnivs
      );
      localStorage.removeItem("room_live_universes_v1");
      markSaved("store");
    } catch {
      // Ignore
    }
  };

  const handleUpdateOrderField = async (
    orderId: string,
    patch: { status?: string; paymentStatus?: string }
  ) => {
    try {
      await sbPatch("orders", `id=eq.${encodeURIComponent(orderId)}`, {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
      );
    } catch {
      // Ignore
    }
  };

  const handleSaveZones = async () => {
    try {
      const nowIso = new Date().toISOString();
      await Promise.all(
        zones.map((z, idx) =>
          sbPatch("shipping_zones", `id=eq.${encodeURIComponent(z.id)}`, {
            name: z.name.trim() || "Zone",
            city: z.city.trim() || "Cairo",
            fee: z.fee,
            freeShippingThreshold: z.freeThreshold,
            estimatedDays: z.days.trim() || "1-2 Days",
            sortOrder: idx + 1,
            isActive: z.active,
            updatedAt: nowIso,
          })
        )
      );
      markSaved("shipping");
    } catch {
      // Ignore
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    const zId = generateClientId("zone");
    const nowIso = new Date().toISOString();
    try {
      await sbInsert("shipping_zones", {
        id: zId,
        storeId,
        name: newZoneName.trim(),
        city: newZoneCity.trim() || "Cairo",
        fee: newZoneFee,
        freeShippingThreshold: newZoneThreshold,
        estimatedDays: newZoneDays.trim() || "1-2 Days",
        sortOrder: zones.length + 1,
        isActive: true,
        updatedAt: nowIso,
      });
      setZones((prev) => [
        ...prev,
        {
          id: zId,
          name: newZoneName.trim(),
          city: newZoneCity.trim() || "Cairo",
          fee: newZoneFee,
          freeThreshold: newZoneThreshold,
          days: newZoneDays.trim() || "1-2 Days",
          active: true,
        },
      ]);
      setNewZoneName("");
      markSaved("shipping");
    } catch {
      // Ignore
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await sbDelete("shipping_zones", `id=eq.${encodeURIComponent(zoneId)}`);
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
      setConfirmDeleteZoneId(null);
    } catch {
      // Cannot delete if linked to existing Orders (Restrict FK) — deactivate instead
      await sbPatch("shipping_zones", `id=eq.${encodeURIComponent(zoneId)}`, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      setZones((prev) =>
        prev.map((z) => (z.id === zoneId ? { ...z, active: false } : z))
      );
      setConfirmDeleteZoneId(null);
    }
  };

  const handleSaveAnalyticsConfig = async () => {
    try {
      await saveAnalyticsRegistry({ storeId, registry: analyticsRegistry });
      markSaved("analytics");
    } catch {
      // Ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const idClean = identifier.trim().toLowerCase();
    if (!idClean || !password) {
      setLoginError(t.loginErr);
      return;
    }

    try {
      // Query ONLY the single matching active candidate at submit time (no bulk hash pre-fetch)
      const candidates = await sbSelect<{
        id: string;
        email: string | null;
        username: string | null;
        name: string;
        role: "OWNER" | "ADMIN" | "STAFF";
        isActive: boolean;
        passwordHash: string | null;
      }>(
        "users",
        `select=id,email,username,name,role,isActive,passwordHash&role=in.(OWNER,ADMIN,STAFF)&isActive=eq.true&or=(email.ilike.${encodeURIComponent(idClean)},username.ilike.${encodeURIComponent(idClean)})&limit=1`
      );

      const found = candidates[0];
      if (!found) {
        setLoginError(t.loginErr);
        return;
      }

      const ok = await verifyPasswordWeb(password, found.passwordHash);
      if (!ok) {
        setLoginError(t.loginErr);
        return;
      }

      setAccounts((prev) =>
        prev.some((a) => a.id === found.id)
          ? prev
          : [
              ...prev,
              {
                id: found.id,
                email: found.email ?? "",
                username: found.username ?? "",
                name: found.name,
                role: found.role,
                isActive: true,
                passwordHash: "",
              },
            ]
      );
      setCurrentUserId(found.id);
      localStorage.setItem(SESSION_KEY, found.id);
      setPassword("");
    } catch {
      setLoginError(t.loginErr);
    }
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || isStaffOnly) return;

    const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const newInvite: LocalInvite = {
      id: generateClientId("inv"),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      usedAt: null,
    };

    try {
      await sbInsert("admin_invites", {
        id: newInvite.id,
        storeId,
        email: newInvite.email,
        role: newInvite.role,
        token: newInvite.token,
        invitedById: currentUser?.id ?? null,
        expiresAt: newInvite.expiresAt,
      });
      setInvites((prev) => [newInvite, ...prev]);
      setInviteEmail("");
    } catch {
      // Ignore
    }
  };

  const handleToggleAccountActive = async (accId: string, nextActive: boolean) => {
    if (!isOwner || accId === currentUser?.id) return;
    try {
      await sbPatch("users", `id=eq.${encodeURIComponent(accId)}`, {
        isActive: nextActive,
        updatedAt: new Date().toISOString(),
      });
      setAccounts((prev) =>
        prev.map((a) => (a.id === accId ? { ...a, isActive: nextActive } : a))
      );
    } catch {
      // Ignore
    }
  };

  const handleChangeAccountRole = async (
    accId: string,
    role: "OWNER" | "ADMIN" | "STAFF"
  ) => {
    if (!isOwner || accId === currentUser?.id) return;
    try {
      await sbPatch("users", `id=eq.${encodeURIComponent(accId)}`, {
        role,
        updatedAt: new Date().toISOString(),
      });
      setAccounts((prev) =>
        prev.map((a) => (a.id === accId ? { ...a, role } : a))
      );
    } catch {
      // Ignore
    }
  };

  const getInviteUrl = (token: string) => {
    if (typeof window === "undefined") return `/admin/invite/?token=${token}`;
    const base = window.location.pathname.replace(/\/admin\/?$/, "");
    return `${window.location.origin}${base}/admin/invite/?token=${token}`;
  };

  const handleCopyInvite = (token: string) => {
    navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1800);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileError(null);

    const pwTrimmed = profileNewPassword.trim();
    if (pwTrimmed.length > 0 && pwTrimmed.length < 8) {
      setProfileError(
        lang === "ar"
          ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل."
          : "Password must be at least 8 characters."
      );
      return;
    }

    const nextName = profileName.trim() || currentUser.name;
    const nextUsername = profileUsername.trim() || currentUser.username;
    const nextEmail = profileEmail.trim().toLowerCase() || currentUser.email;
    const nextHash =
      pwTrimmed.length >= 8 ? await hashPasswordWeb(pwTrimmed) : null;

    try {
      await sbPatch("users", `id=eq.${encodeURIComponent(currentUser.id)}`, {
        name: nextName,
        username: nextUsername,
        email: nextEmail,
        ...(nextHash ? { passwordHash: nextHash } : {}),
        updatedAt: new Date().toISOString(),
      });
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === currentUser.id
            ? {
                ...acc,
                name: nextName,
                username: nextUsername,
                email: nextEmail,
              }
            : acc
        )
      );
      setProfileNewPassword("");
      markSaved("profile");
    } catch {
      setProfileError(
        lang === "ar" ? "تعذر حفظ التغييرات" : "Failed to save profile"
      );
    }
  };

  const funnelCounts = useMemo(() => {
    const counts = {
      PAGE_VIEW: 0,
      VIEW_UNIVERSE: 0,
      VIEW_PRODUCT: 0,
      VIEW_PACKAGE: 0,
      ADD_TO_BAG: 0,
      BEGIN_CHECKOUT: 0,
      APPLY_PROMO: 0,
      PURCHASE: 0,
    };
    for (const evt of analyticsRegistry.events) {
      counts[evt.eventType] = (counts[evt.eventType] ?? 0) + 1;
    }
    return counts;
  }, [analyticsRegistry.events]);

  const LangToggleButton = () => (
    <button
      type="button"
      onClick={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20"
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{lang === "ar" ? "EN" : "عربي"}</span>
    </button>
  );

  // ============================================================================
  // LOGIN SCREEN (Zero hardcoded credentials exposed)
  // ============================================================================
  if (!currentUser) {
    return (
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-[#040308] px-4 text-white"
      >
        <div className="fixed right-5 top-5 z-50">
          <LangToggleButton />
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0814]/95 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-[0.14em]">
                {t.brand}
              </h1>
              <p className="text-xs text-white/55">{t.loginSub}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/75">
                {t.identifierLabel}
              </label>
              <input
                type="text"
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t.identifierPlaceholder}
                required
                className="h-11 w-full rounded-xl border border-white/15 bg-black/60 px-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/75">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full rounded-xl border border-white/15 bg-black/60 px-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
              />
            </div>

            {loginError ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {loginError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loadingAuth}
              className="h-11 w-full rounded-full bg-white text-xs font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loadingAuth
                ? lang === "ar"
                  ? "جاري التحميل..."
                  : "Connecting..."
                : t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RESTRUCTURED COMMAND CENTER
  // ============================================================================
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t.tabs.overview, icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "orders", label: t.tabs.orders, icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "shipping", label: t.tabs.shipping, icon: <Truck className="h-4 w-4" /> },
    { id: "analytics", label: t.tabs.analytics, icon: <BarChart3 className="h-4 w-4" /> },
    ...(!isStaffOnly
      ? [
          { id: "store" as AdminTab, label: t.tabs.store, icon: <Palette className="h-4 w-4" /> },
          { id: "team" as AdminTab, label: t.tabs.team, icon: <Users className="h-4 w-4" /> },
        ]
      : []),
    { id: "profile", label: t.tabs.profile, icon: <Settings className="h-4 w-4" /> },
  ];

  const SaveButton = ({ tab, onClick }: { tab: AdminTab; onClick: () => void }) => {
    const isSaved = savedSection === tab;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-wider transition-all ${
          isSaved ? "bg-emerald-500 text-black" : "bg-white text-black hover:opacity-90"
        }`}
      >
        {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        <span>{isSaved ? t.savedBtn : t.saveBtn}</span>
      </button>
    );
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="flex min-h-screen bg-[#040308] text-white"
    >
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-white/10 bg-[#070510]/95 p-5 md:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-serif text-sm font-semibold tracking-[0.14em]">
            {storeName || t.brand}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
            <span>{t.supabaseLive}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadPortalData()}
            title="Refresh"
            className="text-emerald-200 hover:text-white"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                activeTab === item.id
                  ? "bg-white text-black shadow-[0_6px_20px_rgba(255,255,255,0.18)]"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === "orders" && pendingOrdersCount > 0 ? (
                <span className="ms-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">
                  {pendingOrdersCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{currentUser.name}</p>
              <p className="truncate font-mono text-[10px] text-white/50" dir="ltr">
                @{currentUser.username}
              </p>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              {currentUser.role}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#070510]/85 px-5 py-3.5 backdrop-blur-xl">
          <h1 className="font-serif text-lg font-semibold text-white">
            {navItems.find((n) => n.id === activeTab)?.label}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* LIVE QUICK SEARCH WITH RESULTS DROPDOWN */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-9 w-52 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:outline-none"
              />
              {quickSearchResults.length > 0 ? (
                <div className="absolute right-0 top-11 z-50 w-72 space-y-1 rounded-2xl border border-white/15 bg-[#0d0a1a] p-2 shadow-2xl">
                  {quickSearchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={res.onSelect}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-xs hover:bg-white/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{res.title}</p>
                        <p className="truncate text-[10px] text-white/55">{res.sub}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                        {res.kindLabel}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <LangToggleButton />

            <Link
              href="/admin/checkout/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "السلة والدفع" : "Checkout"}</span>
            </Link>

            <Link
              href="/admin/home/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "الرئيسية" : "Home"}</span>
            </Link>

            <Link
              href="/schema/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              <span className="hidden sm:inline">{t.viewSchema}</span>
            </Link>

            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black hover:opacity-90"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{t.viewStore}</span>
            </Link>
          </div>

          {/* Mobile Tabs */}
          <div className="flex w-full gap-1.5 overflow-x-auto pb-1 md:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  activeTab === item.id
                    ? "bg-white text-black"
                    : "border border-white/15 text-white/75"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          {/* ==================== TAB 1: COMMAND OVERVIEW ==================== */}
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Live KPIs */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                {[
                  {
                    label: lang === "ar" ? "الأقسام النشطة" : "Universes",
                    value: universes.filter((u) => u.isActive).length,
                    accent: "#c94b99",
                  },
                  {
                    label: lang === "ar" ? "المنتجات" : "Products",
                    value: products.length,
                    accent: "#6366f1",
                  },
                  {
                    label: lang === "ar" ? "الكوليكشنز" : "Packages",
                    value: packagesCount,
                    accent: "#f59e0b",
                  },
                  {
                    label: lang === "ar" ? "الطلبات" : "Orders",
                    value: orders.length,
                    accent: "#10b981",
                  },
                  {
                    label: lang === "ar" ? "إجمالي المبيعات" : "Revenue",
                    value: formatEgp(totalRevenue),
                    accent: "#06b6d4",
                  },
                  {
                    label: lang === "ar" ? "أحداث التتبع" : "Tracked Events",
                    value: analyticsRegistry.events.length,
                    accent: "#a855f7",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0815] p-4"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ backgroundColor: stat.accent }}
                    />
                    <p className="text-[11px] text-white/55">{stat.label}</p>
                    <p className="mt-1.5 font-serif text-xl font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Isolated Studios Hub */}
              <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                <h2 className="font-serif text-lg font-semibold text-white">
                  {t.studiosHubTitle}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      href: "/admin/home/",
                      title: lang === "ar" ? "منسّق الرئيسية المعزول" : "Home Composer",
                      desc: lang === "ar" ? "بناء بلوكات وأعمدة الرئيسية بالكامل" : "Blocks, mobile/desktop grids, vaults",
                      icon: <Layers className="h-4 w-4 text-cyan-300" />,
                      border: "border-cyan-400/30",
                    },
                    {
                      href: "/admin/elements/",
                      title: lang === "ar" ? "استوديو النصوص والأزرار" : "Text & Buttons",
                      desc: lang === "ar" ? "بطاقات القراءة (3 مقاسات) + الأزرار" : "Reading Cards & CTA Buttons",
                      icon: <Type className="h-4 w-4 text-fuchsia-300" />,
                      border: "border-fuchsia-400/30",
                    },
                    {
                      href: "/admin/universes/",
                      title: lang === "ar" ? "تنظيم اليونيفيرسز" : "Universe Organizer",
                      desc: lang === "ar" ? "اليونيفيرسز وأيقونات PNG وربط المنتجات" : "Universes, PNG symbols & links",
                      icon: <Sparkles className="h-4 w-4 text-pink-300" />,
                      border: "border-pink-400/30",
                    },
                    {
                      href: "/admin/products/",
                      title: lang === "ar" ? "تنظيم المنتجات والمخزون" : "Product Organizer",
                      desc: lang === "ar" ? "إضافة/تعديل المنتجات، المخزون والصور" : "Catalog, stock & product pages",
                      icon: <Package className="h-4 w-4 text-indigo-300" />,
                      border: "border-indigo-400/30",
                    },
                    {
                      href: "/admin/packages/",
                      title: lang === "ar" ? "الباكدجات والكوليكشنز" : "Packages & Collections",
                      desc: lang === "ar" ? "الباقات المجمعة والكوليكشنز وتسعيرها" : "Curated loadouts & collections",
                      icon: <ShoppingBag className="h-4 w-4 text-amber-300" />,
                      border: "border-amber-400/30",
                    },
                    {
                      href: "/admin/checkout/",
                      title: lang === "ar" ? "استوديو السلة والدفع المعزول" : "Cart & Checkout Studio",
                      desc: lang === "ar" ? "وسائل الدفع، الكوبونات، قواعد الطلب" : "Payment methods, promos, checkout rules",
                      icon: <CreditCard className="h-4 w-4 text-emerald-300" />,
                      border: "border-emerald-400/30",
                    },
                    {
                      href: "/admin/reviews/",
                      title: lang === "ar" ? "تقييمات وتعليقات العملاء" : "Product Reviews Studio",
                      desc: lang === "ar" ? "مراجعة التعليقات والنجوم والرد عليها" : "Moderate ratings, replies & visibility",
                      icon: <MessageSquare className="h-4 w-4 text-amber-300" />,
                      border: "border-amber-400/30",
                    },
                    {
                      href: "/admin/policies/",
                      title: lang === "ar" ? "صفحات السياسات والأسئلة" : "Policies & FAQ Studio",
                      desc: lang === "ar" ? "الاسترجاع، الشحن، الخصوصية، الأسئلة وتواصل" : "Separated policy docs, FAQ & contact",
                      icon: <FileText className="h-4 w-4 text-cyan-300" />,
                      border: "border-cyan-400/30",
                    },
                  ].map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className={`flex items-start gap-3 rounded-2xl border ${s.border} bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.06]`}
                    >
                      <div className="mt-0.5 rounded-xl border border-white/10 bg-black/50 p-2">
                        {s.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{s.title}</p>
                        <p className="mt-0.5 text-[11px] text-white/60">{s.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Low Stock Alerts + Recent Orders Snapshot */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <h2 className="font-serif text-lg font-semibold">
                        {t.lowStockTitle}
                      </h2>
                    </div>
                    <Link
                      href="/admin/products/"
                      className="text-xs font-semibold text-cyan-300 hover:underline"
                    >
                      /admin/products/ →
                    </Link>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {lowStockProducts.length === 0 ? (
                      <p className="text-xs text-white/55">{t.allHealthy}</p>
                    ) : (
                      lowStockProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2.5"
                        >
                          <div>
                            <p className="text-xs font-semibold">{p.name}</p>
                            <p className="text-[11px] text-amber-300/80">
                              Stock: {p.stock} {p.stock <= 0 ? "(Vaulted)" : ""}
                            </p>
                          </div>
                          <Link
                            href="/admin/products/"
                            className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25"
                          >
                            {lang === "ar" ? "تعديل في المنظم" : "Edit Stock"}
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-semibold">
                      {lang === "ar" ? "أحدث الطلبات" : "Latest Orders"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-semibold text-cyan-300 hover:underline"
                    >
                      {lang === "ar" ? "إدارة الطلبات ←" : "Manage Orders →"}
                    </button>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {orders.length === 0 ? (
                      <p className="text-xs text-white/55">{t.noOrders}</p>
                    ) : (
                      orders.slice(0, 5).map((ord) => (
                        <div
                          key={ord.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs"
                        >
                          <div>
                            <p className="font-mono font-bold text-white">
                              #{ord.orderNumber} — {ord.customerName}
                            </p>
                            <p className="text-[11px] text-white/50">
                              {ord.city} • {ord.paymentMethod}
                            </p>
                          </div>
                          <div className="text-end">
                            <p className="font-bold text-emerald-300">
                              {formatEgp(ord.total)}
                            </p>
                            <p className="text-[10px] text-white/60">{ord.status}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* ==================== TAB 2: ORDERS & CRM ==================== */}
          {activeTab === "orders" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold">
                  {lang === "ar" ? "إدارة الطلبات وبنود المشتريات" : "Orders & Line Items CRM"}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "بحث برقم الطلب، الاسم، الهاتف..."
                        : "Search order #, name, phone..."
                    }
                    className="h-9 w-56 rounded-full border border-white/15 bg-black/60 px-4 text-xs text-white"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="h-9 rounded-full border border-white/15 bg-black/60 px-3 text-xs text-white"
                  >
                    <option value="ALL">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-8 text-center text-xs text-white/55">
                  {t.noOrders}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((ord) => {
                    const itemsList = orderItemsByOrder[ord.id] ?? [];
                    const isExpanded = expandedOrderId === ord.id;
                    const zoneName =
                      zones.find((z) => z.id === ord.shippingZoneId)?.name ??
                      ord.city;
                    const waPhone = (ord.customerWhatsapp || ord.customerPhone).replace(
                      /[^0-9]/g,
                      ""
                    );
                    const waMsg = encodeURIComponent(
                      `مرحباً ${ord.customerName}، تحديث طلبك #${ord.orderNumber} (${formatEgp(ord.total)}): الحالة الآن ${ord.status}`
                    );

                    return (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-white/10 bg-[#0b0815] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-sm font-semibold text-white/90">
                                {ord.customerName}
                              </span>
                              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                                {ord.paymentMethod} • {ord.paymentStatus}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-white/60">
                              {ord.customerPhone} • {zoneName} •{" "}
                              <strong className="text-emerald-300">
                                {formatEgp(ord.total)}
                              </strong>{" "}
                              ({itemsList.length} {lang === "ar" ? "بنود" : "items"})
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(isExpanded ? null : ord.id)
                              }
                              className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/15"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              <span>{lang === "ar" ? "التفاصيل" : "Details"}</span>
                            </button>

                            <a
                              href={`https://wa.me/${waPhone}?text=${waMsg}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>{t.whatsappBtn}</span>
                            </a>

                            <select
                              value={ord.status}
                              onChange={(e) =>
                                void handleUpdateOrderField(ord.id, {
                                  status: e.target.value,
                                })
                              }
                              className="h-9 rounded-xl border border-white/15 bg-black/60 px-2.5 text-xs font-semibold text-white"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-xs">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                <p className="text-[10px] font-bold text-white/50">
                                  {lang === "ar" ? "عنوان التوصيل" : "Shipping Address"}
                                </p>
                                <p className="mt-1 text-white/90">{ord.shippingAddress}</p>
                                <p className="mt-1 text-[11px] text-white/60">
                                  {zoneName} ({ord.city})
                                </p>
                                {ord.notes ? (
                                  <p className="mt-1 text-[11px] text-amber-300">
                                    Notes: {ord.notes}
                                  </p>
                                ) : null}
                              </div>

                              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                <p className="text-[10px] font-bold text-white/50">
                                  {lang === "ar" ? "حالة الدفع والمرجع" : "Payment Tracking"}
                                </p>
                                <select
                                  value={ord.paymentStatus}
                                  onChange={(e) =>
                                    void handleUpdateOrderField(ord.id, {
                                      paymentStatus: e.target.value,
                                    })
                                  }
                                  className="mt-1.5 h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                                >
                                  {PAYMENT_STATUSES.map((ps) => (
                                    <option key={ps} value={ps}>
                                      {ps}
                                    </option>
                                  ))}
                                </select>
                                {ord.paymentReference ? (
                                  <p className="mt-1.5 font-mono text-[11px] text-cyan-200" dir="ltr">
                                    Ref: {ord.paymentReference}
                                  </p>
                                ) : null}
                              </div>

                              <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-white/55">Subtotal:</span>
                                  <span>{formatEgp(ord.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/55">Discount:</span>
                                  <span className="text-emerald-300">
                                    -{formatEgp(ord.discountAmount)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/55">Shipping:</span>
                                  <span>{formatEgp(ord.shippingFee)}</span>
                                </div>
                                <div className="flex justify-between border-t border-white/10 pt-1 font-bold text-white">
                                  <span>Total:</span>
                                  <span>{formatEgp(ord.total)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                              <p className="mb-2 text-[10px] font-bold text-white/50">
                                {lang === "ar"
                                  ? "المنتجات والباقات داخل الطلب (order_items)"
                                  : "Order Items"}
                              </p>
                              {itemsList.length === 0 ? (
                                <p className="text-white/45">No items snapshot found.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {itemsList.map((it) => (
                                    <div
                                      key={it.id}
                                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-1.5 last:border-0"
                                    >
                                      <div>
                                        <span className="font-semibold text-white">
                                          {it.titleSnapshot}
                                        </span>{" "}
                                        <span className="text-[10px] text-white/45">
                                          ({it.itemType})
                                        </span>
                                      </div>
                                      <div className="font-mono text-[11px] text-white/80" dir="ltr">
                                        {it.quantity} × {formatEgp(it.unitPrice)} ={" "}
                                        <strong className="text-emerald-300">
                                          {formatEgp(it.lineTotal)}
                                        </strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* ==================== TAB 3: SHIPPING ZONES ==================== */}
          {activeTab === "shipping" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">
                  {lang === "ar" ? "إدارة مناطق الشحن بالكامل" : "Shipping Zones CRUD"}
                </h2>
                <SaveButton tab="shipping" onClick={() => void handleSaveZones()} />
              </div>

              <form
                onSubmit={handleAddZone}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-4 sm:grid-cols-6 sm:items-end"
              >
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-white/65">
                    {lang === "ar" ? "اسم المنطقة" : "Zone Name"}
                  </label>
                  <input
                    required
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g. Sheikh Zayed"
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/65">
                    {lang === "ar" ? "المدينة" : "City"}
                  </label>
                  <input
                    required
                    value={newZoneCity}
                    onChange={(e) => setNewZoneCity(e.target.value)}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/65">
                    {lang === "ar" ? "التكلفة" : "Fee"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newZoneFee}
                    onChange={(e) => setNewZoneFee(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/65">
                    {lang === "ar" ? "مجاني فوق" : "Free Above"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newZoneThreshold}
                    onChange={(e) => setNewZoneThreshold(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-white/65">
                      {lang === "ar" ? "المدة" : "Days"}
                    </label>
                    <input
                      value={newZoneDays}
                      onChange={(e) => setNewZoneDays(e.target.value)}
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-9 shrink-0 items-center gap-1 self-end rounded-full bg-white px-4 text-xs font-bold text-black"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === "ar" ? "إضافة" : "Add"}</span>
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {zones.map((z) => (
                  <div
                    key={z.id}
                    className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-1 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-cyan-300" />
                        <input
                          value={z.name}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id ? { ...x, name: e.target.value } : x
                              )
                            )
                          }
                          className="h-8 flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 text-sm font-semibold text-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id ? { ...x, active: !x.active } : x
                              )
                            )
                          }
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            z.active
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/10 text-white/45"
                          }`}
                        >
                          {z.active ? "ON" : "OFF"}
                        </button>
                        {confirmDeleteZoneId === z.id ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteZone(z.id)}
                            className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white"
                          >
                            {lang === "ar" ? "تأكيد؟" : "Confirm"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteZoneId(z.id)}
                            className="rounded-full border border-white/15 p-1.5 text-white/55 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <label className="text-white/60">
                        {lang === "ar" ? "المدينة" : "City"}
                        <input
                          value={z.city}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id ? { ...x, city: e.target.value } : x
                              )
                            )
                          }
                          className="mt-1 h-8 w-full rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                      <label className="text-white/60">
                        {lang === "ar" ? "التكلفة" : "Fee"}
                        <input
                          type="number"
                          value={z.fee}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id
                                  ? { ...x, fee: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="mt-1 h-8 w-full rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                      <label className="text-white/60">
                        {lang === "ar" ? "مجاني فوق" : "Free Above"}
                        <input
                          type="number"
                          value={z.freeThreshold}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id
                                  ? { ...x, freeThreshold: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="mt-1 h-8 w-full rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                      <label className="text-white/60">
                        {lang === "ar" ? "المدة" : "Days"}
                        <input
                          value={z.days}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id ? { ...x, days: e.target.value } : x
                              )
                            )
                          }
                          className="mt-1 h-8 w-full rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ==================== TAB 4: ANALYTICS PREP & FUTURE OPS ==================== */}
          {activeTab === "analytics" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">
                    {lang === "ar"
                      ? "تهيئة الإحصائيات وقمع التحويل والعمليات المستقبلية"
                      : "Analytics Foundation & Future Ops Ledger"}
                  </h2>
                  <p className="mt-1 text-xs text-white/55">
                    {lang === "ar"
                      ? "بيانات حية مربوطة بجداول Orders وProducts وUniverses وShipping و(__isolated_analytics_v1__ / __isolated_future_ops_v1__)."
                      : "Live telemetry connected across Orders, Products, Universes, Shipping, and Future Ops tables."}
                  </p>
                </div>
                <SaveButton
                  tab="analytics"
                  onClick={() => void handleSaveAnalyticsConfig()}
                />
              </div>

              {/* Conversion Funnel Live Readout */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { k: "PAGE_VIEW", label: lang === "ar" ? "زيارات" : "Page Views", val: funnelCounts.PAGE_VIEW },
                  { k: "VIEW_UNIVERSE", label: lang === "ar" ? "أقسام" : "Universe Views", val: funnelCounts.VIEW_UNIVERSE },
                  { k: "VIEW_PRODUCT", label: lang === "ar" ? "منتجات" : "Product Views", val: funnelCounts.VIEW_PRODUCT },
                  { k: "ADD_TO_BAG", label: lang === "ar" ? "إضافة للسلة" : "Add to Bag", val: funnelCounts.ADD_TO_BAG },
                  { k: "BEGIN_CHECKOUT", label: lang === "ar" ? "بدء دفع" : "Begin Checkout", val: funnelCounts.BEGIN_CHECKOUT },
                  { k: "PURCHASE", label: lang === "ar" ? "شراء مكتمل" : "Purchases", val: funnelCounts.PURCHASE },
                ].map((f) => (
                  <div
                    key={f.k}
                    className="rounded-2xl border border-cyan-400/25 bg-[#0b0815] p-4"
                  >
                    <p className="text-[11px] text-white/60">{f.label}</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-cyan-300">
                      {f.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Interactive Revenue Charts & Top Performers */}
              <AnalyticsDashboardPanel
                lang={lang}
                orders={orders}
                orderItems={Object.values(orderItemsByOrder).flat()}
                zones={zones}
                analyticsRegistry={analyticsRegistry}
              />

              {/* Analytics Config + Future Ops Sink Counts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-6 text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-300" />
                    <h3 className="font-serif text-base font-semibold">
                      {lang === "ar" ? "إعدادات التتبع والأهداف (Zero Static)" : "Tracking & Goals Config"}
                    </h3>
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5">
                    <span>{lang === "ar" ? "تتبع زيارات الصفحات (PAGE_VIEW)" : "Track Page Views"}</span>
                    <input
                      type="checkbox"
                      checked={analyticsRegistry.config.trackPageViews}
                      onChange={(e) =>
                        setAnalyticsRegistry((prev) => ({
                          ...prev,
                          config: { ...prev.config, trackPageViews: e.target.checked },
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5">
                    <span>{lang === "ar" ? "تتبع قمع الشراء (Funnel Events)" : "Track Funnel Events"}</span>
                    <input
                      type="checkbox"
                      checked={analyticsRegistry.config.trackFunnelEvents}
                      onChange={(e) =>
                        setAnalyticsRegistry((prev) => ({
                          ...prev,
                          config: { ...prev.config, trackFunnelEvents: e.target.checked },
                        }))
                      }
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-white/60">GA4 Measurement ID</span>
                      <input
                        dir="ltr"
                        value={analyticsRegistry.config.ga4MeasurementId}
                        onChange={(e) =>
                          setAnalyticsRegistry((prev) => ({
                            ...prev,
                            config: { ...prev.config, ga4MeasurementId: e.target.value },
                          }))
                        }
                        placeholder="G-XXXXXXXXXX"
                        className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-white/60">Meta Pixel ID</span>
                      <input
                        dir="ltr"
                        value={analyticsRegistry.config.metaPixelId}
                        onChange={(e) =>
                          setAnalyticsRegistry((prev) => ({
                            ...prev,
                            config: { ...prev.config, metaPixelId: e.target.value },
                          }))
                        }
                        placeholder="1234567890"
                        className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-white/60">
                        {lang === "ar" ? "هدف المبيعات اليومي (EGP)" : "Daily Revenue Goal"}
                      </span>
                      <input
                        type="number"
                        value={analyticsRegistry.config.dailyRevenueGoal}
                        onChange={(e) =>
                          setAnalyticsRegistry((prev) => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              dailyRevenueGoal: Math.max(0, Number(e.target.value)),
                            },
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-white/60">
                        {lang === "ar" ? "هدف الطلبات اليومي" : "Daily Order Goal"}
                      </span>
                      <input
                        type="number"
                        value={analyticsRegistry.config.dailyOrderGoal}
                        onChange={(e) =>
                          setAnalyticsRegistry((prev) => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              dailyOrderGoal: Math.max(0, Number(e.target.value)),
                            },
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                      />
                    </label>
                  </div>
                </div>

                {/* Future Ops Prepared Tables Status */}
                <div className="space-y-3 rounded-2xl border border-amber-400/25 bg-[#0b0815] p-6 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-semibold text-amber-200">
                      {lang === "ar"
                        ? "الجداول المهيأة للأنظمة المستقبلية (__isolated_future_ops_v1__)"
                        : "Prepared Future Ops Ledger"}
                    </h3>
                    <Link
                      href="/schema/"
                      className="text-[11px] font-bold text-cyan-300 hover:underline"
                    >
                      /schema/ →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Payment Transactions", count: futureOps.paymentTransactions.length },
                      { label: "Shipment Dispatches", count: futureOps.shipmentDispatches.length },
                      { label: "Notification Queue", count: futureOps.notificationQueue.length },
                      { label: "Customer Directory", count: futureOps.customerDirectory.length },
                      { label: "Support Tickets", count: futureOps.supportTickets.length },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="rounded-xl border border-white/10 bg-black/45 p-3"
                      >
                        <p className="text-[11px] text-white/60">{row.label}</p>
                        <p className="mt-1 font-mono text-lg font-bold text-amber-300">
                          {row.count}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/60">
                    {lang === "ar"
                      ? "كل عملية شراء جديدة تسجّل تلقائياً نية دفع وتجهيز شحنة وإشعار تاجر وتحديث سجل العميل هنا لتكون جاهزة لأي لوحة دعم أو شركة شحن لاحقاً."
                      : "Every checkout automatically populates PaymentTx, ShipmentDispatch, MerchantNotification, and CustomerCRM records here."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* ==================== TAB 5: STORE & THEMES (Non-Staff) ==================== */}
          {activeTab === "store" && !isStaffOnly ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">
                  {lang === "ar" ? "الهوية البصرية والتذييل وثيمات الإيفنتات" : "Store Identity, Footer & Presets"}
                </h2>
                <SaveButton tab="store" onClick={() => void handleSaveStore()} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6 sm:grid-cols-2 lg:col-span-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {lang === "ar" ? "اسم المتجر" : "Store Name"}
                    </label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {lang === "ar" ? "رقم واتساب الطلبات" : "WhatsApp Order Number"}
                    </label>
                    <input
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {lang === "ar" ? "بريد الدعم (supportEmail)" : "Support Email"}
                    </label>
                    <input
                      dir="ltr"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {lang === "ar" ? "نص التذييل الديناميكي (Footer Tagline)" : "Dynamic Footer Tagline"}
                    </label>
                    <input
                      value={footerTagline}
                      onChange={(e) => setFooterTagline(e.target.value)}
                      placeholder="Cairo & New Cairo Express Delivery..."
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                    />
                  </div>
                  {[
                    { label: lang === "ar" ? "لون الرئيسية" : "Home Accent", val: defaultAccent, set: setDefaultAccent },
                    { label: lang === "ar" ? "خلفية علوي" : "Canvas Top", val: bgPrimary, set: setBgPrimary },
                    { label: lang === "ar" ? "خلفية أوسط" : "Canvas Mid", val: bgSecondary, set: setBgSecondary },
                    { label: lang === "ar" ? "خلفية سفلي" : "Canvas Bottom", val: bgElevated, set: setBgElevated },
                  ].map((c) => (
                    <div key={c.label}>
                      <label className="mb-1 block text-xs text-white/65">{c.label}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={c.val}
                          onChange={(e) => c.set(e.target.value)}
                          className="h-9 w-14 rounded-lg border border-white/15 bg-transparent"
                        />
                        <span className="font-mono text-xs text-white/75" dir="ltr">
                          {c.val}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Theme Preview */}
                <div
                  className="flex flex-col justify-between rounded-2xl border border-white/15 p-5"
                  style={{
                    background: `linear-gradient(180deg, ${bgPrimary} 0%, ${bgSecondary} 45%, ${bgElevated} 100%)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                      Preview
                    </span>
                    <span
                      className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold"
                      style={{ color: defaultAccent }}
                    >
                      ✦ {storeName || "STORE"}
                    </span>
                  </div>
                  <div className="my-6 text-center">
                    <p className="font-serif text-2xl font-semibold tracking-[0.22em] text-white">
                      {storeName}
                    </p>
                    <div className="mt-3 flex justify-center gap-2">
                      {universes.map((u) => (
                        <span
                          key={u.id}
                          className="h-6 w-12 rounded-lg border border-white/15"
                          style={{
                            background: `linear-gradient(180deg, #05030a 0%, ${u.accentColor} 100%)`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-white/55">
                    {footerTagline || `${bgPrimary} → ${bgElevated}`}
                  </p>
                </div>
              </div>

              {/* Event Theme Presets */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-lg font-semibold">
                    {lang === "ar"
                      ? "ثيمات الإيفنتات (تحفظ تلقائياً في __isolated_universe_organizer_v1__)"
                      : "Event Theme Presets"}
                  </h3>
                  {presets[0] ? (
                    <button
                      type="button"
                      onClick={() => void handleApplyPreset(presets[0]!)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{lang === "ar" ? "استرجاع الأساسي" : "Restore Baseline"}</span>
                    </button>
                  ) : null}
                </div>

                <form onSubmit={handleSavePreset} className="flex flex-wrap gap-3">
                  <input
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "اسم الإيفنت (مثال: رمضان، بلاك فرايداي)"
                        : "Event preset name"
                    }
                    required
                    className="h-10 min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    <span>{lang === "ar" ? "حفظ كقالب" : "Save Preset"}</span>
                  </button>
                </form>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3.5"
                    >
                      <div>
                        <p className="text-sm font-semibold">{preset.name}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {[
                            preset.bgPrimary,
                            preset.bgElevated,
                            preset.defaultAccent,
                            ...Object.values(preset.universeColors),
                          ].map((hex, idx) => (
                            <span
                              key={`${preset.id}-c-${idx}`}
                              className="h-3.5 w-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleApplyPreset(preset)}
                        className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-black hover:opacity-90"
                      >
                        {lang === "ar" ? "تطبيق" : "Apply"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* ==================== TAB 6: TEAM & RBAC (Non-Staff) ==================== */}
          {activeTab === "team" && !isStaffOnly ? (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl font-semibold">
                  {lang === "ar" ? "فريق الإدارة والدعوات (RBAC)" : "Team & Access Control"}
                </h2>
                <p className="mt-1 text-xs text-white/55">{t.teamSub}</p>
              </div>

              <form
                onSubmit={handleCreateInvite}
                className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5"
              >
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1.5 block text-xs font-semibold text-white/70">
                    {lang === "ar" ? "البريد الإلكتروني" : "Admin Email"}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/70">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "STAFF")}
                    className="h-10 rounded-xl border border-white/15 bg-black/50 px-3 text-sm text-white"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{lang === "ar" ? "توليد دعوة (48س)" : "Generate 48h Invite"}</span>
                </button>
              </form>

              {invites.length > 0 ? (
                <div className="space-y-3">
                  {invites.map((inv) => {
                    const expired = new Date(inv.expiresAt).getTime() < Date.now();
                    return (
                      <div
                        key={inv.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold" dir="ltr">
                            {inv.email}
                          </p>
                          <p className="text-xs text-white/50">
                            {inv.role} • {new Date(inv.expiresAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          {inv.usedAt ? (
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                              Used
                            </span>
                          ) : expired ? (
                            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                              Expired
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopyInvite(inv.token)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-1.5 text-xs font-semibold text-cyan-200"
                            >
                              {copiedToken === inv.token ? (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" /> Copy Link
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-white/70" />
                      <div>
                        <p className="text-sm font-semibold">{acc.name}</p>
                        <p className="font-mono text-xs text-white/55" dir="ltr">
                          @{acc.username} • {acc.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && acc.id !== currentUser.id ? (
                        <>
                          <select
                            value={acc.role}
                            onChange={(e) =>
                              void handleChangeAccountRole(
                                acc.id,
                                e.target.value as "OWNER" | "ADMIN" | "STAFF"
                              )
                            }
                            className="h-8 rounded-lg border border-white/15 bg-black/60 px-2 text-[11px] font-bold"
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="STAFF">STAFF</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleAccountActive(acc.id, !acc.isActive)
                            }
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              acc.isActive
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {acc.isActive ? "Active" : "Suspended"}
                          </button>
                        </>
                      ) : (
                        <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                          {acc.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ==================== TAB 7: MY PROFILE ==================== */}
          {activeTab === "profile" ? (
            <div className="max-w-xl space-y-5">
              <h2 className="font-serif text-2xl font-semibold">
                {lang === "ar" ? "الملف الشخصي وكلمة المرور" : "My Profile"}
              </h2>

              <form
                onSubmit={handleSaveProfile}
                className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6"
              >
                <div>
                  <label className="mb-1 block text-xs text-white/65">
                    {lang === "ar" ? "الاسم الظاهر" : "Display Name"}
                  </label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/65">Username</label>
                  <input
                    dir="ltr"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    required
                    pattern="^[a-zA-Z0-9_]+$"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/65">Email</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-white/65">
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>
                      {lang === "ar"
                        ? "كلمة مرور جديدة (8 أحرف على الأقل — اختياري)"
                        : "New Password (min 8 chars — optional)"}
                    </span>
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={profileNewPassword}
                    onChange={(e) => setProfileNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                </div>

                {profileError ? (
                  <p className="rounded-xl border border-red-400/35 bg-red-500/15 px-3 py-2 text-xs text-red-200">
                    {profileError}
                  </p>
                ) : null}

                <SaveButton
                  tab="profile"
                  onClick={() => {
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    void handleSaveProfile(fakeEvent);
                  }}
                />
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
