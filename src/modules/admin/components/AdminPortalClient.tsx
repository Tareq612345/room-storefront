/**
 * @file src/modules/admin/components/AdminPortalClient.tsx
 * @purpose Luxury Dark Command Center for ROOM: Complete site control (Store & Live Theme Preview, Event Presets, Universes, Catalog + Add/Delete, Loadouts, Orders + WhatsApp, Home Builder, Cairo Shipping, 48h Invites, Profile).
 */

"use client";

import { sbDelete, sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import {
  generateClientId,
  hashPasswordWeb,
  verifyPasswordWeb,
} from "@shared/utils/client-auth";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Boxes,
  Check,
  Copy,
  Database,
  ExternalLink,
  Info,
  KeyRound,
  Languages,
  LayoutDashboard,
  Layers,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lang = "ar" | "en";

type AdminTab =
  | "overview"
  | "store"
  | "universes"
  | "catalog"
  | "loadouts"
  | "orders"
  | "sections"
  | "shipping"
  | "team"
  | "profile";

interface LocalAdminAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: "OWNER" | "ADMIN" | "STAFF";
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

interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
}

interface AdminLoadoutRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  fixedPrice: number;
  isFeatured: boolean;
  isActive: boolean;
}

const ROOM_DEFAULT_PRESET: ThemePreset = {
  id: "preset_room_default",
  name: "ROOM Default (Original)",
  isDefault: true,
  bgPrimary: "#05030a",
  bgSecondary: "#0b0617",
  bgElevated: "#140b29",
  defaultAccent: "#ffffff",
  universeColors: {
    cars: "#d92323",
    gaming: "#6366f1",
    anime: "#c94b99",
  },
};

const INITIAL_OWNERS: LocalAdminAccount[] = [
  { id: "owner_tareq", email: "tareq612345@gmail.com", username: "tareq", name: "Tareq (Owner)", role: "OWNER", passwordHash: "" },
  { id: "owner_adegddn", email: "adegddn@gmail.com", username: "adegddn", name: "Partner (Owner)", role: "OWNER", passwordHash: "" },
];

const INITIAL_UNIVERSES = [
  { id: "univ_cars", slug: "cars", name: "GARAGE & CARS", tagline: "Midnight Touge & Supercar Bedroom Loadouts", description: "High-craft automotive bedsheets and pit-lane setups.", accentColor: "#d92323", isActive: true },
  { id: "univ_gaming", slug: "gaming", name: "GAMING ARENA", tagline: "Obsidian RGB & Next-Gen Battle Stations", description: "Stealth dark-mode bedsheets engineered for gaming setups.", accentColor: "#6366f1", isActive: true },
  { id: "univ_anime", slug: "anime", name: "ANIME REALM", tagline: "Shonen Arcs, Katana & Neo-Tokyo Vibes", description: "Signature anime-inspired bedsheets and collector Loadouts.", accentColor: "#c94b99", isActive: true },
];

const INITIAL_PRODUCTS = [
  { id: "prod_touge", name: "Midnight Touge Carbon Bedsheet", subtitle: "300TC Matte Obsidian Cotton • Pit-Lane Red Piping", universeId: "univ_cars", universe: "cars", price: 1450, compareAtPrice: 1750, stock: 18, thumbnailUrl: "/mockups/products/sheet-midnight-touge.svg", isFreshDrop: true },
  { id: "prod_ranked", name: "Obsidian Ranked Arena Bedsheet", subtitle: "Stealth Micro-Weave • Indigo Stitch Matrix", universeId: "univ_gaming", universe: "gaming", price: 1390, compareAtPrice: 0, stock: 12, thumbnailUrl: "/mockups/products/sheet-obsidian-ranked.svg", isFreshDrop: true },
  { id: "prod_eclipse", name: "Neo-Tokyo Eclipse Bedsheet", subtitle: "Brushed Dark Sateen • Orchid Embroidered Crest", universeId: "univ_anime", universe: "anime", price: 1550, compareAtPrice: 1890, stock: 9, thumbnailUrl: "/mockups/products/sheet-neo-tokyo.svg", isFreshDrop: true },
  { id: "prod_apex", name: "Apex GT Twin Pillowcase Pair", subtitle: "Limited Cairo Drop • Heavyweight Weave", universeId: "univ_cars", universe: "cars", price: 590, compareAtPrice: 0, stock: 0, thumbnailUrl: "/mockups/products/pillows-apex-gt.svg", isFreshDrop: true },
];

const INITIAL_ZONES = [
  { id: "z1", name: "New Cairo (5th Settlement / Rehab)", fee: 65, freeThreshold: 2500, days: "1-2 Days", active: true },
  { id: "z2", name: "Nasr City & Heliopolis", fee: 60, freeThreshold: 2500, days: "1-2 Days", active: true },
  { id: "z3", name: "Maadi & Zamalek", fee: 65, freeThreshold: 2500, days: "1-2 Days", active: true },
  { id: "z4", name: "6th of October & Sheikh Zayed", fee: 85, freeThreshold: 3000, days: "2-3 Days", active: true },
];

const INITIAL_SECTIONS = [
  { id: "s1", type: "UNIVERSE_QUICK_BAR", title: "3-Card Universe Showcase", visible: true },
  { id: "s2", type: "NEW_ARRIVALS", title: "Fresh Drops", visible: true },
  { id: "s3", type: "FEATURED_BUNDLES", title: "Signature Loadouts", visible: true },
  { id: "s4", type: "FLASH_DEALS", title: "Midnight Flash Deals", visible: false },
  { id: "s5", type: "CUSTOMER_SETUPS", title: "Cairo Room Setups", visible: false },
];

const MOCKUP_OPTIONS = [
  { label: "Cars Bedsheet (Midnight Touge)", value: "/mockups/products/sheet-midnight-touge.svg" },
  { label: "Gaming Bedsheet (Obsidian Ranked)", value: "/mockups/products/sheet-obsidian-ranked.svg" },
  { label: "Anime Bedsheet (Neo-Tokyo)", value: "/mockups/products/sheet-neo-tokyo.svg" },
  { label: "Pillowcase Pair (Apex GT)", value: "/mockups/products/pillows-apex-gt.svg" },
];

const SESSION_KEY = "room_admin_session_v1";

const I18N = {
  en: {
    brand: "ROOM COMMAND",
    supabaseLive: "Supabase Live",
    loginSub: "Sign in with Username or Email",
    identifierLabel: "Username or Email",
    identifierPlaceholder: "tareq or tareq612345@gmail.com",
    passwordLabel: "Password",
    loginBtn: "Enter Command Center",
    loginErr: "Invalid username/email or password",
    seededTitle: "Seeded Owners:",
    initialPassNote: "Initial password:",
    changeInProfile: "(change in Profile)",
    searchPlaceholder: "Quick search...",
    tabs: {
      overview: "Command Overview",
      store: "Themes & Brand",
      universes: "Universes",
      catalog: "Products & Stock",
      loadouts: "Loadouts (Bundles)",
      orders: "Orders & WhatsApp",
      sections: "Home Builder",
      shipping: "Cairo Shipping",
      team: "Owners & Invites",
      profile: "My Profile",
    },
    viewStore: "Live Storefront",
    viewSchema: "DB Schema",
    signOut: "Sign Out",
    welcome: "Command Center",
    signedInAs: "Active session:",
    quickActions: "Quick Actions",
    vaultedAlerts: "Stock & Vaulted Alerts",
    restockOneClick: "+10 Restock",
    allHealthy: "All products are well-stocked.",
    stats: {
      universes: "Active Universes",
      products: "Live Products",
      orders: "Total Orders",
      team: "Owners & Admins",
    },
    storeTitle: "Brand, Live Preview & Event Themes",
    livePreview: "Live Theme Preview",
    storeName: "Store Name",
    whatsapp: "WhatsApp Order Number",
    homeAccent: "Home Accent",
    bgPrimary: "Canvas Top",
    bgSecondary: "Canvas Mid",
    bgElevated: "Canvas Bottom",
    presetsTitle: "Event Theme Presets & Default Restore",
    presetPlaceholder: "Event name (e.g. Ramadan Nights, Black Friday)",
    savePresetBtn: "Save as Preset",
    applyTheme: "Apply",
    restoreDefault: "Restore ROOM Default",
    universesTitle: "Universes Studio",
    active: "Active",
    hidden: "Hidden",
    visible: "Visible",
    catalogTitle: "Catalog & Inventory",
    addProductTitle: "Add New Product",
    prodName: "Product Name",
    prodSub: "1-Line Subtitle",
    prodPrice: "Price (EGP)",
    prodOldPrice: "Old Price",
    prodStock: "Stock",
    prodMockup: "Mockup Visual",
    addProdBtn: "Create Product",
    loadoutsTitle: "Signature Loadouts (Bundles)",
    egp: "EGP",
    stock: "Stock",
    vaulted: "Vaulted",
    inStock: "In Stock",
    ordersTitle: "Orders & WhatsApp Dispatch",
    noOrders: "No orders placed yet. Orders from checkout will appear here live.",
    whatsappBtn: "WhatsApp Update",
    sectionsTitle: "Homepage Section Builder",
    shippingTitle: "Cairo & New Cairo Shipping Zones",
    addZoneTitle: "Add New Cairo Zone",
    zoneNamePlaceholder: "e.g. Sheikh Zayed / Zamalek",
    addZoneBtn: "Add Zone",
    fee: "Fee (EGP)",
    freeAbove: "Free Above",
    teamTitle: "Owners & Admin Team",
    teamSub: "Invite a new admin by email to generate a 48-hour single-use onboarding link.",
    adminEmail: "Admin Email",
    role: "Role",
    genInvite: "Generate 48h Invite",
    inviteLinksTitle: "Single-Use Invite Links (48 Hours)",
    expires: "Expires",
    used: "Used",
    expired: "Expired",
    copyLink: "Copy Link",
    copied: "Copied",
    activeAccounts: "Active Accounts",
    profileTitle: "My Profile & Username",
    profileSub: "Set a custom username so you can sign in with Username + Password without needing your email.",
    displayName: "Display Name",
    usernameLabel: "Username (Login without Email)",
    emailLabel: "Email",
    newPasswordLabel: "New Password (optional)",
    saveBtn: "Save Changes",
    savedBtn: "Saved!",
  },
  ar: {
    brand: "مركز تحكم ROOM",
    supabaseLive: "متصل بـ Supabase",
    loginSub: "سجّل الدخول باسم المستخدم أو البريد الإلكتروني",
    identifierLabel: "اسم المستخدم أو البريد الإلكتروني",
    identifierPlaceholder: "tareq أو tareq612345@gmail.com",
    passwordLabel: "كلمة المرور",
    loginBtn: "دخول مركز التحكم",
    loginErr: "اسم المستخدم/البريد أو كلمة المرور غير صحيحة",
    seededTitle: "حسابات المالكين المسجلة:",
    initialPassNote: "كلمة المرور الأولية:",
    changeInProfile: "(يمكن تغييرها من الملف الشخصي)",
    searchPlaceholder: "بحث سريع...",
    tabs: {
      overview: "نظرة عامة",
      store: "الثيمات والهوية",
      universes: "الأقسام (Universes)",
      catalog: "المنتجات والمخزون",
      loadouts: "الباقات (Loadouts)",
      orders: "الطلبات والواتساب",
      sections: "بناء الرئيسية",
      shipping: "شحن القاهرة",
      team: "المالكون والدعوات",
      profile: "ملفي الشخصي",
    },
    viewStore: "عرض المتجر",
    viewSchema: "خريطة الداتا بيز",
    signOut: "خروج",
    welcome: "مركز التحكم",
    signedInAs: "الجلسة الحالية:",
    quickActions: "إجراءات سريعة",
    vaultedAlerts: "تنبيهات المخزون والمنتجات النافدة",
    restockOneClick: "+10 للمخزون",
    allHealthy: "كل المنتجات متوفرة بمخزون جيد.",
    stats: {
      universes: "الأقسام النشطة",
      products: "المنتجات المتاحة",
      orders: "إجمالي الطلبات",
      team: "المالكون والأدمن",
    },
    storeTitle: "الهوية البصرية والمعاينة وثيمات الإيفنتات",
    livePreview: "معاينة حية للثيم",
    storeName: "اسم المتجر",
    whatsapp: "رقم واتساب الطلبات",
    homeAccent: "لون الرئيسية",
    bgPrimary: "خلفية علوي",
    bgSecondary: "خلفية أوسط",
    bgElevated: "خلفية سفلي",
    presetsTitle: "ثيمات الإيفنتات المحفوظة والثيم الأساسي",
    presetPlaceholder: "اسم الإيفنت (مثال: رمضان، بلاك فرايداي)",
    savePresetBtn: "حفظ كثيم إيفنت",
    applyTheme: "تطبيق",
    restoreDefault: "استرجاع ثيم ROOM الأساسي",
    universesTitle: "استوديو الأقسام (Universes)",
    active: "مفعل",
    hidden: "مخفي",
    visible: "ظاهر",
    catalogTitle: "إدارة المنتجات والمخزون",
    addProductTitle: "إضافة منتج جديد",
    prodName: "اسم المنتج",
    prodSub: "وصف سطر واحد",
    prodPrice: "السعر (ج.م)",
    prodOldPrice: "السعر قبل الخصم",
    prodStock: "المخزون",
    prodMockup: "صورة الموكاب",
    addProdBtn: "إضافة المنتج",
    loadoutsTitle: "إدارة الباقات (Loadouts)",
    egp: "ج.م",
    stock: "المخزون",
    vaulted: "نفد (Vaulted)",
    inStock: "متاح",
    ordersTitle: "الطلبات والتواصل عبر واتساب",
    noOrders: "لا توجد طلبات مسجلة بعد. أي طلب جديد سيظهر هنا مباشرة.",
    whatsappBtn: "تحديث واتساب",
    sectionsTitle: "ترتيب وإظهار أقسام الرئيسية",
    shippingTitle: "مناطق الشحن (القاهرة والقاهرة الجديدة)",
    addZoneTitle: "إضافة منطقة شحن جديدة",
    zoneNamePlaceholder: "مثال: مدينتي أو التجمع الأول",
    addZoneBtn: "إضافة منطقة",
    fee: "تكلفة الشحن",
    freeAbove: "مجاني فوق",
    teamTitle: "المالكون وفريق الإدارة",
    teamSub: "أضف إيميل أدمن جديد لتوليد رابط دعوة صالح ليومين (48 ساعة) للاستخدام مرة واحدة فقط.",
    adminEmail: "البريد الإلكتروني للأدمن",
    role: "الصلاحية",
    genInvite: "توليد رابط (48 ساعة)",
    inviteLinksTitle: "روابط الدعوة (48 ساعة • استخدام مرة واحدة)",
    expires: "ينتهي في",
    used: "مُستخدم",
    expired: "منتهي",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ",
    activeAccounts: "الحسابات النشطة",
    profileTitle: "الملف الشخصي واسم المستخدم",
    profileSub: "حدد اسم مستخدم (Username) لتتمكن من تسجيل الدخول به مع كلمة المرور بدون كتابة الإيميل.",
    displayName: "الاسم الظاهر",
    usernameLabel: "اسم المستخدم (للدخول بدون إيميل)",
    emailLabel: "البريد الإلكتروني",
    newPasswordLabel: "كلمة مرور جديدة (اختياري)",
    saveBtn: "حفظ التغييرات",
    savedBtn: "تم الحفظ!",
  },
} as const;

export function AdminPortalClient() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = I18N[lang];

  const [storeId, setStoreId] = useState<string>("store_room_egypt");
  const [accounts, setAccounts] = useState<LocalAdminAccount[]>(INITIAL_OWNERS);
  const [invites, setInvites] = useState<LocalInvite[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [savedSection, setSavedSection] = useState<AdminTab | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openHintId, setOpenHintId] = useState<string | null>(null);

  // Store & Theme state
  const [storeName, setStoreName] = useState("ROOM");
  const [whatsapp, setWhatsapp] = useState("+201000000000");
  const [defaultAccent, setDefaultAccent] = useState("#ffffff");
  const [bgPrimary, setBgPrimary] = useState("#05030a");
  const [bgSecondary, setBgSecondary] = useState("#0b0617");
  const [bgElevated, setBgElevated] = useState("#140b29");
  const [presets, setPresets] = useState<ThemePreset[]>([ROOM_DEFAULT_PRESET]);
  const [newPresetName, setNewPresetName] = useState("");

  // Domain Data
  const [universes, setUniverses] = useState(INITIAL_UNIVERSES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [loadouts, setLoadouts] = useState<AdminLoadoutRow[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [sections, setSections] = useState(INITIAL_SECTIONS);

  // Add Product form
  const [newProdName, setNewProdName] = useState("");
  const [newProdSub, setNewProdSub] = useState("");
  const [newProdUnivSlug, setNewProdUnivSlug] = useState("cars");
  const [newProdPrice, setNewProdPrice] = useState(1490);
  const [newProdOldPrice, setNewProdOldPrice] = useState(0);
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdThumb, setNewProdThumb] = useState(MOCKUP_OPTIONS[0]?.value ?? "");

  // Add Shipping Zone form
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneFee, setNewZoneFee] = useState(70);

  // Invite & Profile
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "STAFF">("ADMIN");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) setCurrentUserId(savedSession);
    } catch {
      // Ignore
    }

    (async () => {
      try {
        const [
          sbStores,
          sbUnivs,
          sbProds,
          sbVars,
          sbBundles,
          sbZones,
          sbUsers,
          sbInvites,
          sbSections,
          sbOrders,
        ] = await Promise.all([
          sbSelect<{
            id: string;
            name: string;
            whatsappNumber: string | null;
            defaultAccentColor: string;
            themeTokens: {
              bgPrimary?: string;
              bgSecondary?: string;
              bgElevated?: string;
              presets?: ThemePreset[];
            };
          }>(
            "store_configs",
            "select=id,name,whatsappNumber,defaultAccentColor,themeTokens&slug=eq.room-egypt"
          ),
          sbSelect<{
            id: string;
            slug: string;
            name: string;
            tagline: string | null;
            description: string | null;
            accentColor: string;
            isActive: boolean;
          }>(
            "universes",
            "select=id,slug,name,tagline,description,accentColor,isActive&order=sortOrder.asc"
          ),
          sbSelect<{
            id: string;
            universeId: string;
            slug: string;
            name: string;
            subtitle: string | null;
            basePrice: number | string;
            compareAtPrice: number | string | null;
            thumbnailUrl: string;
            isNewArrival: boolean;
          }>(
            "products",
            "select=id,universeId,slug,name,subtitle,basePrice,compareAtPrice,thumbnailUrl,isNewArrival&isActive=eq.true&order=createdAt.asc"
          ),
          sbSelect<{ id: string; productId: string; stock: number }>(
            "product_variants",
            "select=id,productId,stock"
          ),
          sbSelect<{
            id: string;
            slug: string;
            name: string;
            tagline: string | null;
            fixedPrice: number | string | null;
            isFeatured: boolean;
            isActive: boolean;
          }>(
            "bundles",
            "select=id,slug,name,tagline,fixedPrice,isFeatured,isActive&order=createdAt.asc"
          ),
          sbSelect<{
            id: string;
            name: string;
            fee: number | string;
            freeShippingThreshold: number | string | null;
            estimatedDays: string;
            isActive: boolean;
          }>(
            "shipping_zones",
            "select=id,name,fee,freeShippingThreshold,estimatedDays,isActive&order=sortOrder.asc"
          ),
          sbSelect<{
            id: string;
            email: string | null;
            username: string | null;
            name: string;
            role: "OWNER" | "ADMIN" | "STAFF";
            passwordHash: string | null;
          }>(
            "users",
            "select=id,email,username,name,role,passwordHash&role=in.(OWNER,ADMIN,STAFF)&order=createdAt.asc"
          ),
          sbSelect<LocalInvite>(
            "admin_invites",
            "select=id,email,role,token,expiresAt,usedAt&order=createdAt.desc"
          ),
          sbSelect<{
            id: string;
            type: string;
            title: string | null;
            isVisible: boolean;
            sortOrder: number;
          }>(
            "page_sections",
            "select=id,type,title,isVisible,sortOrder&pageKey=eq.home&order=sortOrder.asc"
          ),
          sbSelect<AdminOrderRow>(
            "orders",
            "select=id,orderNumber,customerName,customerPhone,status,paymentMethod,total,createdAt&order=createdAt.desc&limit=30"
          ),
        ]);

        if (sbStores[0]) {
          const st = sbStores[0];
          setStoreId(st.id);
          setStoreName(st.name);
          if (st.whatsappNumber) setWhatsapp(st.whatsappNumber);
          setDefaultAccent(st.defaultAccentColor);
          if (st.themeTokens?.bgPrimary) setBgPrimary(st.themeTokens.bgPrimary);
          if (st.themeTokens?.bgSecondary) setBgSecondary(st.themeTokens.bgSecondary);
          if (st.themeTokens?.bgElevated) setBgElevated(st.themeTokens.bgElevated);
          const savedPresets = st.themeTokens?.presets ?? [];
          setPresets([
            ROOM_DEFAULT_PRESET,
            ...savedPresets.filter((p) => p.id !== ROOM_DEFAULT_PRESET.id),
          ]);
        }

        if (sbUnivs.length > 0) {
          setUniverses(
            sbUnivs.map((u) => ({
              id: u.id,
              slug: u.slug,
              name: u.name,
              tagline: u.tagline ?? "",
              description: u.description ?? "",
              accentColor: u.accentColor,
              isActive: u.isActive,
            }))
          );
        }

        if (sbProds.length > 0) {
          setProducts(
            sbProds.map((p) => {
              const pVars = sbVars.filter((v) => v.productId === p.id);
              const totalStock = pVars.reduce((sum, v) => sum + Number(v.stock), 0);
              const matchedUniv = sbUnivs.find((u) => u.id === p.universeId);
              return {
                id: p.id,
                name: p.name,
                subtitle: p.subtitle ?? "",
                universeId: p.universeId,
                universe: matchedUniv?.slug ?? "cars",
                price: Number(p.basePrice),
                compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : 0,
                stock: totalStock,
                thumbnailUrl: p.thumbnailUrl,
                isFreshDrop: p.isNewArrival,
              };
            })
          );
        }

        if (sbBundles.length > 0) {
          setLoadouts(
            sbBundles.map((b) => ({
              id: b.id,
              slug: b.slug,
              name: b.name,
              tagline: b.tagline ?? "",
              fixedPrice: b.fixedPrice ? Number(b.fixedPrice) : 2190,
              isFeatured: b.isFeatured,
              isActive: b.isActive,
            }))
          );
        }

        if (sbZones.length > 0) {
          setZones(
            sbZones.map((z) => ({
              id: z.id,
              name: z.name,
              fee: Number(z.fee),
              freeThreshold: z.freeShippingThreshold ? Number(z.freeShippingThreshold) : 2500,
              days: z.estimatedDays,
              active: z.isActive,
            }))
          );
        }

        if (sbUsers.length > 0) {
          setAccounts(
            sbUsers.map((u) => ({
              id: u.id,
              email: u.email ?? "",
              username: u.username ?? "",
              name: u.name,
              role: u.role,
              passwordHash: u.passwordHash ?? "",
            }))
          );
        }

        if (sbInvites.length > 0) setInvites(sbInvites);

        if (sbSections.length > 0) {
          setSections(
            sbSections.map((s) => ({
              id: s.id,
              type: s.type,
              title: s.title ?? s.type,
              visible: s.isVisible,
            }))
          );
        }

        if (sbOrders.length > 0) {
          setOrders(sbOrders.map((o) => ({ ...o, total: Number(o.total) })));
        }
      } catch {
        // Fallback to defaults
      }
    })();
  }, []);

  const currentUser = accounts.find((a) => a.id === currentUserId) ?? null;

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileUsername(currentUser.username);
      setProfileEmail(currentUser.email);
    }
  }, [currentUser]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= 5),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.universe.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const markSaved = (tab: AdminTab) => {
    setSavedSection(tab);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const syncThemeSnapshotLocally = (
    p: string,
    s: string,
    e: string,
    acc: string,
    univList: typeof universes
  ) => {
    const univMap: Record<string, string> = {};
    for (const u of univList) univMap[u.slug] = u.accentColor;
    localStorage.setItem(
      "room_theme_snapshot_v1",
      JSON.stringify({
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
        name: storeName,
        whatsappNumber: whatsapp,
        defaultAccentColor: defaultAccent,
        themeTokens: {
          bgPrimary,
          bgSecondary,
          bgElevated,
          defaultAccent,
          presets: nextPresets.filter((p) => !p.isDefault),
        },
        updatedAt: new Date().toISOString(),
      });
      syncThemeSnapshotLocally(bgPrimary, bgSecondary, bgElevated, defaultAccent, universes);
    } catch {
      // Ignore
    }
    markSaved("store");
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

    const nextUnivs = preset.isDefault
      ? INITIAL_UNIVERSES.map((def) => ({ ...def }))
      : universes.map((u) => ({
          ...u,
          accentColor: preset.universeColors[u.slug] ?? u.accentColor,
        }));

    if (preset.isDefault) {
      setStoreName("ROOM");
    }
    setUniverses(nextUnivs);

    try {
      await Promise.all([
        sbPatch("store_configs", "slug=eq.room-egypt", {
          ...(preset.isDefault ? { name: "ROOM" } : {}),
          defaultAccentColor: preset.defaultAccent,
          themeTokens: {
            bgPrimary: preset.bgPrimary,
            bgSecondary: preset.bgSecondary,
            bgElevated: preset.bgElevated,
            defaultAccent: preset.defaultAccent,
            presets: presets.filter((p) => !p.isDefault),
          },
          updatedAt: new Date().toISOString(),
        }),
        ...nextUnivs.map((u) =>
          sbPatch("universes", `slug=eq.${encodeURIComponent(u.slug)}`, {
            ...(preset.isDefault
              ? {
                  name: u.name,
                  tagline: u.tagline,
                  description: u.description,
                  isActive: u.isActive,
                }
              : {}),
            accentColor: u.accentColor,
            updatedAt: new Date().toISOString(),
          })
        ),
      ]);
      syncThemeSnapshotLocally(
        preset.bgPrimary,
        preset.bgSecondary,
        preset.bgElevated,
        preset.defaultAccent,
        nextUnivs
      );
      localStorage.removeItem("room_live_universes_v1");
    } catch {
      // Ignore
    }
    markSaved("store");
  };

  const handleSaveUniverses = async () => {
    try {
      await Promise.all(
        universes.map((u) =>
          sbPatch("universes", `slug=eq.${encodeURIComponent(u.slug)}`, {
            name: u.name,
            tagline: u.tagline,
            description: u.description,
            accentColor: u.accentColor,
            isActive: u.isActive,
            updatedAt: new Date().toISOString(),
          })
        )
      );
      syncThemeSnapshotLocally(bgPrimary, bgSecondary, bgElevated, defaultAccent, universes);
      localStorage.removeItem("room_live_universes_v1");
    } catch {
      // Ignore
    }
    markSaved("universes");
  };

  const handleSaveCatalog = async () => {
    try {
      await Promise.all(
        products.map(async (p) => {
          await sbPatch("products", `id=eq.${encodeURIComponent(p.id)}`, {
            name: p.name,
            subtitle: p.subtitle,
            basePrice: p.price,
            compareAtPrice: p.compareAtPrice > 0 ? p.compareAtPrice : null,
            isNewArrival: p.isFreshDrop,
            updatedAt: new Date().toISOString(),
          });
          await sbPatch(
            "product_variants",
            `productId=eq.${encodeURIComponent(p.id)}&isDefault=eq.true`,
            { stock: p.stock, updatedAt: new Date().toISOString() }
          );
        })
      );
      localStorage.removeItem("room_live_products_v1");
    } catch {
      // Ignore
    }
    markSaved("catalog");
  };

  const handleQuickRestock = async (prodId: string) => {
    const target = products.find((p) => p.id === prodId);
    if (!target) return;
    const nextStock = target.stock + 10;
    setProducts((prev) =>
      prev.map((p) => (p.id === prodId ? { ...p, stock: nextStock } : p))
    );
    try {
      await sbPatch(
        "product_variants",
        `productId=eq.${encodeURIComponent(prodId)}&isDefault=eq.true`,
        { stock: nextStock, updatedAt: new Date().toISOString() }
      );
      localStorage.removeItem("room_live_products_v1");
    } catch {
      // Ignore
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const targetUniv =
      universes.find((u) => u.slug === newProdUnivSlug) ?? universes[0];
    if (!targetUniv) return;

    const prodId = generateClientId("prod");
    const varId = generateClientId("var");
    const slug = `${newProdName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    try {
      await sbInsert("products", {
        id: prodId,
        storeId,
        universeId: targetUniv.id,
        slug,
        name: newProdName.trim(),
        subtitle: newProdSub.trim() || "Limited Cairo Drop",
        basePrice: newProdPrice,
        compareAtPrice: newProdOldPrice > 0 ? newProdOldPrice : null,
        thumbnailUrl: newProdThumb,
        images: [newProdThumb],
        isFeatured: true,
        isNewArrival: true,
        isActive: true,
        updatedAt: nowIso,
      });

      await sbInsert("product_variants", {
        id: varId,
        storeId,
        productId: prodId,
        sku: `RM-${Date.now().toString().slice(-6)}`,
        name: "King / 240x220 cm",
        size: "King",
        price: newProdPrice,
        stock: newProdStock,
        isDefault: true,
        isActive: true,
        updatedAt: nowIso,
      });

      setProducts((prev) => [
        ...prev,
        {
          id: prodId,
          name: newProdName.trim(),
          subtitle: newProdSub.trim() || "Limited Cairo Drop",
          universeId: targetUniv.id,
          universe: targetUniv.slug,
          price: newProdPrice,
          compareAtPrice: newProdOldPrice,
          stock: newProdStock,
          thumbnailUrl: newProdThumb,
          isFreshDrop: true,
        },
      ]);
      localStorage.removeItem("room_live_products_v1");
      setNewProdName("");
      setNewProdSub("");
      setNewProdOldPrice(0);
      markSaved("catalog");
    } catch {
      // Ignore
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    try {
      await sbDelete("products", `id=eq.${encodeURIComponent(prodId)}`);
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
      localStorage.removeItem("room_live_products_v1");
    } catch {
      // Ignore
    }
  };

  const handleSaveLoadouts = async () => {
    try {
      await Promise.all(
        loadouts.map((l) =>
          sbPatch("bundles", `id=eq.${encodeURIComponent(l.id)}`, {
            name: l.name,
            tagline: l.tagline,
            fixedPrice: l.fixedPrice,
            isFeatured: l.isFeatured,
            isActive: l.isActive,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    } catch {
      // Ignore
    }
    markSaved("loadouts");
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await sbPatch("orders", `id=eq.${encodeURIComponent(orderId)}`, {
        status,
        updatedAt: new Date().toISOString(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch {
      // Ignore
    }
  };

  const handleSaveSections = async () => {
    try {
      const existing = await sbSelect<{ id: string }>(
        "page_sections",
        `select=id&storeId=eq.${encodeURIComponent(storeId)}&pageKey=eq.home`
      );
      const nowIso = new Date().toISOString();
      if (existing.length === 0) {
        await Promise.all(
          sections.map((s, idx) =>
            sbInsert("page_sections", {
              id: generateClientId("sec"),
              storeId,
              pageKey: "home",
              type: s.type,
              title: s.title,
              sortOrder: idx + 1,
              isVisible: s.visible,
              updatedAt: nowIso,
            })
          )
        );
      } else {
        await Promise.all(
          sections.map((s, idx) =>
            sbPatch("page_sections", `id=eq.${encodeURIComponent(s.id)}`, {
              isVisible: s.visible,
              sortOrder: idx + 1,
              updatedAt: nowIso,
            })
          )
        );
      }
    } catch {
      // Ignore
    }
    markSaved("sections");
  };

  const handleSaveZones = async () => {
    try {
      await Promise.all(
        zones.map((z) =>
          sbPatch("shipping_zones", `id=eq.${encodeURIComponent(z.id)}`, {
            fee: z.fee,
            freeShippingThreshold: z.freeThreshold,
            isActive: z.active,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    } catch {
      // Ignore
    }
    markSaved("shipping");
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
        city: "Cairo",
        fee: newZoneFee,
        freeShippingThreshold: 2500,
        estimatedDays: "1-2 Days",
        sortOrder: zones.length + 1,
        isActive: true,
        updatedAt: nowIso,
      });
      setZones((prev) => [
        ...prev,
        {
          id: zId,
          name: newZoneName.trim(),
          fee: newZoneFee,
          freeThreshold: 2500,
          days: "1-2 Days",
          active: true,
        },
      ]);
      setNewZoneName("");
      markSaved("shipping");
    } catch {
      // Ignore
    }
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(index, 1);
    if (!item) return;
    copy.splice(nextIdx, 0, item);
    setSections(copy);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const idClean = identifier.trim().toLowerCase();
    const found = accounts.find(
      (a) =>
        a.email.toLowerCase() === idClean ||
        a.username.toLowerCase() === idClean
    );

    if (!found) {
      setLoginError(t.loginErr);
      return;
    }

    const ok = await verifyPasswordWeb(password, found.passwordHash);
    if (!ok) {
      setLoginError(t.loginErr);
      return;
    }

    setCurrentUserId(found.id);
    localStorage.setItem(SESSION_KEY, found.id);
    setPassword("");
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

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
    } catch {
      // Ignore
    }

    setInvites((prev) => [newInvite, ...prev]);
    setInviteEmail("");
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

    const nextName = profileName.trim() || currentUser.name;
    const nextUsername = profileUsername.trim() || currentUser.username;
    const nextEmail = profileEmail.trim().toLowerCase() || currentUser.email;
    const nextHash =
      profileNewPassword.trim().length >= 6
        ? await hashPasswordWeb(profileNewPassword.trim())
        : currentUser.passwordHash;

    try {
      await sbPatch("users", `id=eq.${encodeURIComponent(currentUser.id)}`, {
        name: nextName,
        username: nextUsername,
        email: nextEmail,
        ...(profileNewPassword.trim().length >= 6
          ? { passwordHash: nextHash }
          : {}),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Ignore
    }

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === currentUser.id
          ? {
              ...acc,
              name: nextName,
              username: nextUsername,
              email: nextEmail,
              passwordHash: nextHash,
            }
          : acc
      )
    );
    setProfileNewPassword("");
    markSaved("profile");
  };

  const LangToggleButton = () => (
    <button
      type="button"
      onClick={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20"
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{lang === "ar" ? "English" : "عربي"}</span>
    </button>
  );

  // ============================================================================
  // LOGIN SCREEN
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
              className="h-11 w-full rounded-full bg-white text-xs font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
            >
              {t.loginBtn}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[11px] text-white/60">
            <p className="font-semibold text-white/85">{t.seededTitle}</p>
            <p className="mt-1 font-mono" dir="ltr">
              tareq612345@gmail.com (user: <span className="text-white">tareq</span>)
            </p>
            <p className="font-mono" dir="ltr">
              adegddn@gmail.com (user: <span className="text-white">adegddn</span>)
            </p>
            <p className="mt-1 text-white/45">
              {t.initialPassNote}{" "}
              <span className="font-mono text-white/75" dir="ltr">
                RoomOwner#2026
              </span>{" "}
              {t.changeInProfile}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // COMMAND CENTER LAYOUT
  // ============================================================================
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t.tabs.overview, icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "store", label: t.tabs.store, icon: <Palette className="h-4 w-4" /> },
    { id: "universes", label: t.tabs.universes, icon: <Sparkles className="h-4 w-4" /> },
    { id: "catalog", label: t.tabs.catalog, icon: <Package className="h-4 w-4" /> },
    { id: "loadouts", label: t.tabs.loadouts, icon: <Boxes className="h-4 w-4" /> },
    { id: "orders", label: t.tabs.orders, icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "sections", label: t.tabs.sections, icon: <Layers className="h-4 w-4" /> },
    { id: "shipping", label: t.tabs.shipping, icon: <Truck className="h-4 w-4" /> },
    { id: "team", label: t.tabs.team, icon: <Users className="h-4 w-4" /> },
    { id: "profile", label: t.tabs.profile, icon: <Settings className="h-4 w-4" /> },
  ];

  const InfoHint = ({
    id,
    ar,
    en,
  }: {
    id: string;
    ar: string;
    en: string;
  }) => {
    const isOpen = openHintId === id;
    return (
      <span className="relative inline-flex items-center align-middle">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenHintId((prev) => (prev === id ? null : id));
          }}
          className={`mx-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] transition-colors ${
            isOpen
              ? "border-cyan-400 bg-cyan-500/25 text-cyan-200"
              : "border-white/25 bg-white/5 text-white/60 hover:border-cyan-400/60 hover:text-cyan-200"
          }`}
          aria-label="Info"
        >
          <Info className="h-2.5 w-2.5" />
        </button>
        {isOpen ? (
          <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-cyan-400/35 bg-[#090714] p-2.5 text-[11px] font-normal leading-relaxed text-white/90 shadow-2xl">
            {lang === "ar" ? ar : en}
          </span>
        ) : null}
      </span>
    );
  };

  const TabGuideBanner = ({
    arPoints,
    enPoints,
  }: {
    arPoints: string[];
    enPoints: string[];
  }) => {
    const points = lang === "ar" ? arPoints : enPoints;
    return (
      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-200">
          <Info className="h-4 w-4" />
          <span>
            {lang === "ar"
              ? "تعليمات: أين تنعكس تعديلات هذا القسم في الموقع؟"
              : "Guide: Where do changes in this tab apply?"}
          </span>
        </div>
        <ul className="mt-2.5 space-y-1.5 text-xs text-white/70">
          {points.map((pt, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const SaveButton = ({
    tab,
    onClick,
  }: {
    tab: AdminTab;
    onClick: () => void;
  }) => {
    const isSaved = savedSection === tab;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-wider transition-all ${
          isSaved
            ? "bg-emerald-500 text-black"
            : "bg-white text-black hover:opacity-90"
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
      {/* Sleek Glass Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-white/10 bg-[#070510]/95 p-5 md:flex">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-serif text-sm font-semibold tracking-[0.14em]">
              {t.brand}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
          <span>{t.supabaseLive}</span>
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

      {/* Main Command Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Command Header */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#070510]/85 px-6 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-lg font-semibold text-white">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && activeTab === "overview") {
                    setActiveTab("catalog");
                  }
                }}
                placeholder={t.searchPlaceholder}
                className="h-9 w-48 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
              />
            </div>

            <LangToggleButton />

            <Link
              href="/admin/editor/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "المحرر البصري" : "Visual Editor"}</span>
            </Link>

            <Link
              href="/schema/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/85 hover:bg-white/10"
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

          {/* Mobile Tab Strip */}
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

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* OVERVIEW */}
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: t.stats.universes, value: universes.filter((u) => u.isActive).length, accent: "#c94b99" },
                  { label: t.stats.products, value: products.length, accent: "#6366f1" },
                  { label: t.stats.orders, value: orders.length, accent: "#22c55e" },
                  { label: t.stats.team, value: accounts.length, accent: "#f59e0b" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0815] p-5"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ backgroundColor: stat.accent }}
                    />
                    <p className="text-xs text-white/55">{stat.label}</p>
                    <p className="mt-2 font-serif text-3xl font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                  <h2 className="font-serif text-lg font-semibold">{t.quickActions}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("catalog")}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs font-semibold hover:border-white/30"
                    >
                      <Plus className="h-4 w-4 text-cyan-300" />
                      <span>{t.addProductTitle}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("store")}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs font-semibold hover:border-white/30"
                    >
                      <Palette className="h-4 w-4 text-pink-300" />
                      <span>{t.tabs.store}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("team")}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs font-semibold hover:border-white/30"
                    >
                      <UserPlus className="h-4 w-4 text-emerald-300" />
                      <span>{t.genInvite}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs font-semibold hover:border-white/30"
                    >
                      <ShoppingBag className="h-4 w-4 text-amber-300" />
                      <span>{t.tabs.orders}</span>
                    </button>
                  </div>
                </div>

                {/* Stock & Vaulted Alerts */}
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h2 className="font-serif text-lg font-semibold">
                      {t.vaultedAlerts}
                      <InfoHint
                        id="overview-restock"
                        ar="أي منتج مخزونه 5 قطع أو أقل يظهر هنا. الضغط على +10 يزيد المخزون في Supabase فوراً ويزيل علامة Vaulted من المتجر."
                        en="Products with 5 or fewer units appear here. Clicking +10 updates Supabase stock immediately and removes the Vaulted badge."
                      />
                    </h2>
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
                            <p className="text-[11px] text-white/50">
                              {t.stock}: {p.stock} {p.stock <= 0 ? `(${t.vaulted})` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleQuickRestock(p.id)}
                            className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25"
                          >
                            {t.restockOneClick}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <TabGuideBanner
                arPoints={[
                  "نظرة عامة تعرض ملخصاً حياً لبيانات Supabase (الأقسام، المنتجات، الطلبات، الفريق).",
                  "زر (+10 للمخزون) يرفع المخزون في قاعدة البيانات مباشرة ويعيد تفعيل المنتج على المتجر.",
                  "أزرار الإجراءات السريعة تنقلك مباشرة لتعديل الثيمات أو إضافة منتج أو دعوة أدمن."
                ]}
                enPoints={[
                  "Overview displays live KPIs fetched directly from Supabase.",
                  "One-click (+10 Restock) updates Supabase inventory immediately and un-vaults sold-out products.",
                  "Quick Actions jump directly to Themes, Add Product, Orders, or 48h Invites."
                ]}
              />
            </div>
          ) : null}

          {/* STORE, LIVE PREVIEW & EVENT THEMES */}
          {activeTab === "store" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">{t.storeTitle}</h2>
                <SaveButton tab="store" onClick={() => void handleSaveStore()} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Color & Identity Inputs */}
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6 sm:grid-cols-2 lg:col-span-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {t.storeName}
                      <InfoHint
                        id="store-name"
                        ar="اسم البراند المحفوظ في جدول store_configs ويظهر في المتجر والهوية العامة."
                        en="Brand name stored in store_configs across the storefront."
                      />
                    </label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {t.whatsapp}
                      <InfoHint
                        id="store-wa"
                        ar="رقم واتساب المتجر المستخدم في إشعارات الطلبات والتواصل المباشر مع العملاء."
                        en="Store WhatsApp number used for order confirmations and customer support."
                      />
                    </label>
                    <input
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                    />
                  </div>
                  {[
                    {
                      label: t.homeAccent,
                      val: defaultAccent,
                      set: setDefaultAccent,
                      ar: "يغيّر لون النصوص التمييزية (New Arrivals / Room Bundles) ولون نجمة MY ROOM في الصفحة الرئيسية فقط.",
                      en: "Changes accent text (New Arrivals / Room Bundles) and the MY ROOM star icon on the Home page.",
                    },
                    {
                      label: t.bgPrimary,
                      val: bgPrimary,
                      set: setBgPrimary,
                      ar: "يتحكم في لون أعلى خلفية الموقع بالكامل (أول تدرج في الخلفية).",
                      en: "Controls the top background color of the entire site canvas.",
                    },
                    {
                      label: t.bgSecondary,
                      val: bgSecondary,
                      set: setBgSecondary,
                      ar: "يتحكم في لون منتصف خلفية الموقع بالكامل.",
                      en: "Controls the middle gradient stop of the site canvas.",
                    },
                    {
                      label: t.bgElevated,
                      val: bgElevated,
                      set: setBgElevated,
                      ar: "يتحكم في لون أسفل خلفية الموقع بالكامل.",
                      en: "Controls the bottom gradient stop of the site canvas.",
                    },
                  ].map((c) => (
                    <div key={c.label}>
                      <label className="mb-1 block text-xs text-white/65">
                        {c.label}
                        <InfoHint id={`color-${c.label}`} ar={c.ar} en={c.en} />
                      </label>
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

                {/* Live Theme Preview Mini-Card */}
                <div
                  className="flex flex-col justify-between rounded-2xl border border-white/15 p-5"
                  style={{
                    background: `linear-gradient(180deg, ${bgPrimary} 0%, ${bgSecondary} 45%, ${bgElevated} 100%)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                      {t.livePreview}
                    </span>
                    <span
                      className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold"
                      style={{ color: defaultAccent }}
                    >
                      ✦ MY ROOM
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
                  <p className="text-center text-[10px] text-white/50">
                    {bgPrimary} → {bgElevated}
                  </p>
                </div>
              </div>

              {/* Event Theme Presets */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-lg font-semibold">
                    {t.presetsTitle}
                    <InfoHint
                      id="presets-info"
                      ar="احفظ ألوان الإيفنت (مثل رمضان أو البلاك فرايداي) في Supabase لتبديل ثيم الموقع بالكامل بضغطة واحدة، ويمكنك استرجاع ثيم ROOM الأساسي في أي وقت."
                      en="Save full event palettes to Supabase and switch the entire site theme in 1 click, or restore ROOM Default anytime."
                    />
                  </h3>
                  <button
                    type="button"
                    onClick={() => void handleApplyPreset(ROOM_DEFAULT_PRESET)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t.restoreDefault}
                  </button>
                </div>

                <form onSubmit={handleSavePreset} className="flex flex-wrap gap-3">
                  <input
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder={t.presetPlaceholder}
                    required
                    className="h-10 min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    {t.savePresetBtn}
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
                        {t.applyTheme}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <TabGuideBanner
                arPoints={[
                  "ألوان الخلفية (علوي / أوسط / سفلي) تغيّر تدرج خلفية الموقع بالكامل فوراً عند الحفظ.",
                  "لون الرئيسية يغيّر لون النصوص التمييزية ونجمة MY ROOM في الصفحة الرئيسية فقط.",
                  "قوالب الإيفنتات تحفظ الخلفية + ألوان الأقسام الثلاثة معاً في Supabase، وزر (استرجاع ثيم ROOM الأساسي) يعيد كل الألوان الأصلية."
                ]}
                enPoints={[
                  "Canvas colors (Top / Mid / Bottom) update the full site background gradient immediately on save.",
                  "Home Accent changes the highlight text and MY ROOM star icon on the Home page only.",
                  "Event Theme Presets save both the canvas and all 3 Universe colors in Supabase; Restore Default resets back to ROOM's original palette."
                ]}
              />
            </div>
          ) : null}

          {/* UNIVERSES */}
          {activeTab === "universes" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">
                  {t.universesTitle}
                  <InfoHint
                    id="univ-header"
                    ar="كل قسم له لون خاص ينعكس على بطاقته في الرئيسية، وعلى صفحة القسم، وعلى منتجاته، وعلى نجمة MY ROOM عند الدخول إليه."
                    en="Each Universe has its own accent color applied to its Home card, Universe page, products, and the MY ROOM star icon."
                  />
                </h2>
                <SaveButton tab="universes" onClick={() => void handleSaveUniverses()} />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {universes.map((u) => (
                  <div
                    key={u.id}
                    className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5"
                    style={{
                      borderTop: `3px solid ${u.accentColor}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-white/55" dir="ltr">
                        /{u.slug}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setUniverses((prev) =>
                              prev.map((x) =>
                                x.id === u.id ? { ...x, isActive: !x.isActive } : x
                              )
                            )
                          }
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            u.isActive
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/10 text-white/45"
                          }`}
                        >
                          {u.isActive ? t.active : t.hidden}
                        </button>
                        <input
                          type="color"
                          value={u.accentColor}
                          onChange={(e) =>
                            setUniverses((prev) =>
                              prev.map((x) =>
                                x.id === u.id ? { ...x, accentColor: e.target.value } : x
                              )
                            )
                          }
                          className="h-7 w-10 rounded border border-white/15 bg-transparent"
                        />
                      </div>
                    </div>
                    <input
                      value={u.name}
                      onChange={(e) =>
                        setUniverses((prev) =>
                          prev.map((x) =>
                            x.id === u.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-sm font-semibold"
                    />
                    <input
                      value={u.tagline}
                      onChange={(e) =>
                        setUniverses((prev) =>
                          prev.map((x) =>
                            x.id === u.id ? { ...x, tagline: e.target.value } : x
                          )
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-xs text-white/80"
                    />
                    <textarea
                      rows={2}
                      value={u.description}
                      onChange={(e) =>
                        setUniverses((prev) =>
                          prev.map((x) =>
                            x.id === u.id ? { ...x, description: e.target.value } : x
                          )
                        )
                      }
                      className="w-full rounded-lg border border-white/15 bg-black/50 p-2.5 text-xs text-white/75"
                    />
                  </div>
                ))}
              </div>

              <TabGuideBanner
                arPoints={[
                  "لون القسم يغيّر تدرج البطاقة في الرئيسية، وخلفية رأس صفحة القسم، وشارات المنتجات، ولون نجمة MY ROOM عند دخول القسم.",
                  "الاسم والسطر التعريفي يظهران داخل الكبسولة الزجاجية أسفل بطاقة القسم في الرئيسية.",
                  "زر (مفعل / مخفي) يتحكم في ظهور القسم أو إخفائه من الصفحة الرئيسية."
                ]}
                enPoints={[
                  "Universe Color updates the Home card gradient, Universe detail banner, product badges, and MY ROOM star icon inside that Universe.",
                  "Name and Tagline appear inside the frosted pill on the Home Universe card.",
                  "Active/Hidden toggles whether the Universe appears on the Storefront."
                ]}
              />
            </div>
          ) : null}

          {/* CATALOG & PRODUCTS */}
          {activeTab === "catalog" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">
                  {t.catalogTitle}
                  <InfoHint
                    id="cat-header"
                    ar="أي منتج تضيفه أو تعدل سعره/مخزونه هنا يُحفظ في Supabase ويظهر في قسم Fresh Drops وصفحة القسم التابع له."
                    en="Products added or edited here sync to Supabase and appear in Fresh Drops and their Universe page."
                  />
                </h2>
                <SaveButton tab="catalog" onClick={() => void handleSaveCatalog()} />
              </div>

              {/* Add Product Form */}
              <form
                onSubmit={handleAddProduct}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5 sm:grid-cols-2 lg:grid-cols-7"
              >
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-[11px] text-white/65">{t.prodName}</label>
                  <input
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Akatsuki Night Bedsheet"
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-[11px] text-white/65">{t.prodSub}</label>
                  <input
                    value={newProdSub}
                    onChange={(e) => setNewProdSub(e.target.value)}
                    placeholder="300TC Matte Sateen • Limited"
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/65">Universe</label>
                  <select
                    value={newProdUnivSlug}
                    onChange={(e) => setNewProdUnivSlug(e.target.value)}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-2 text-xs"
                  >
                    {universes.map((u) => (
                      <option key={u.id} value={u.slug}>
                        {u.slug.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/65">{t.prodPrice}</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/65">{t.prodStock}</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="mb-1 block text-[11px] text-white/65">{t.prodMockup}</label>
                  <select
                    value={newProdThumb}
                    onChange={(e) => setNewProdThumb(e.target.value)}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-2 text-xs"
                  >
                    {MOCKUP_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-[11px] text-white/65">{t.prodOldPrice}</label>
                  <input
                    type="number"
                    value={newProdOldPrice}
                    onChange={(e) => setNewProdOldPrice(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div className="flex items-end lg:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t.addProdBtn}
                  </button>
                </div>
              </form>

              {/* Product List */}
              <div className="space-y-3">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-4"
                  >
                    <div className="min-w-[220px] flex-1 space-y-1.5">
                      <input
                        value={p.name}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, name: e.target.value } : x
                            )
                          )
                        }
                        className="h-8 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 text-sm font-semibold"
                      />
                      <input
                        value={p.subtitle}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, subtitle: e.target.value } : x
                            )
                          )
                        }
                        className="h-7 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 text-xs text-white/70"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs text-white/60">
                        {t.egp}
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) =>
                            setProducts((prev) =>
                              prev.map((x) =>
                                x.id === p.id ? { ...x, price: Number(e.target.value) } : x
                              )
                            )
                          }
                          className="mx-1.5 h-8 w-20 rounded-lg border border-white/15 bg-black/50 px-2 text-xs text-white"
                        />
                      </label>
                      <label className="text-xs text-white/60">
                        {t.stock}
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) =>
                            setProducts((prev) =>
                              prev.map((x) =>
                                x.id === p.id ? { ...x, stock: Number(e.target.value) } : x
                              )
                            )
                          }
                          className="mx-1.5 h-8 w-16 rounded-lg border border-white/15 bg-black/50 px-2 text-xs text-white"
                        />
                      </label>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                          p.stock <= 0
                            ? "bg-zinc-700 text-white"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {p.stock <= 0 ? t.vaulted : t.inStock}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDeleteProduct(p.id)}
                        className="rounded-lg border border-red-500/25 p-1.5 text-red-300 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <TabGuideBanner
                arPoints={[
                  "نموذج إضافة المنتج ينشئ المنتج مع النسخة الافتراضية والمخزون في جدول products و product_variants مباشرة.",
                  "تعديل السعر أو الوصف (سطر واحد) ينعكس فوراً في كروت المنتجات وصفحة القسم.",
                  "تصفير المخزون (0) يحوّل حالة المنتج تلقائياً إلى Vaulted (نفد المخزون) ويعطل زر Claim Yours."
                ]}
                enPoints={[
                  "Add Product inserts both the product and its default variant/stock into Supabase.",
                  "Editing price or 1-line subtitle updates Fresh Drops and Universe product cards.",
                  "Setting stock to 0 automatically marks the product as Vaulted and disables Claim Yours."
                ]}
              />
            </div>
          ) : null}

          {/* LOADOUTS (BUNDLES) */}
          {activeTab === "loadouts" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">{t.loadoutsTitle}</h2>
                <SaveButton tab="loadouts" onClick={() => void handleSaveLoadouts()} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {loadouts.map((l) => (
                  <div
                    key={l.id}
                    className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5"
                  >
                    <input
                      value={l.name}
                      onChange={(e) =>
                        setLoadouts((prev) =>
                          prev.map((x) =>
                            x.id === l.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-sm font-semibold"
                    />
                    <input
                      value={l.tagline}
                      onChange={(e) =>
                        setLoadouts((prev) =>
                          prev.map((x) =>
                            x.id === l.id ? { ...x, tagline: e.target.value } : x
                          )
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-xs text-white/80"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-white/60">
                        {t.egp}
                        <input
                          type="number"
                          value={l.fixedPrice}
                          onChange={(e) =>
                            setLoadouts((prev) =>
                              prev.map((x) =>
                                x.id === l.id
                                  ? { ...x, fixedPrice: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="mx-2 h-8 w-24 rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setLoadouts((prev) =>
                            prev.map((x) =>
                              x.id === l.id ? { ...x, isFeatured: !x.isFeatured } : x
                            )
                          )
                        }
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                          l.isFeatured
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {l.isFeatured ? t.visible : t.hidden}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <TabGuideBanner
                arPoints={[
                  "الباقات (Loadouts) تظهر في قسم Signature Loadouts أسفل الصفحة الرئيسية.",
                  "تعديل السعر أو الوصف أو إخفاء الباقة ينعكس مباشرة على المتجر وسلة MY ROOM."
                ]}
                enPoints={[
                  "Loadouts appear in the Signature Loadouts section on the Homepage.",
                  "Editing price, tagline, or visibility updates the Storefront and My Room bag."
                ]}
              />
            </div>
          ) : null}

          {/* ORDERS & WHATSAPP */}
          {activeTab === "orders" ? (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl font-semibold">{t.ordersTitle}</h2>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-8 text-center text-xs text-white/55">
                  {t.noOrders}
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => {
                    const waPhone = ord.customerPhone.replace(/[^0-9]/g, "");
                    const waMsg = encodeURIComponent(
                      `Hi ${ord.customerName}, your ROOM order #${ord.orderNumber} (${formatEgp(ord.total)}) is now: ${ord.status}`
                    );
                    return (
                      <div
                        key={ord.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-4"
                      >
                        <div>
                          <p className="font-mono text-sm font-bold text-white">
                            #{ord.orderNumber} — {ord.customerName}
                          </p>
                          <p className="text-xs text-white/55">
                            {ord.customerPhone} • {ord.paymentMethod} • {formatEgp(ord.total)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                            onChange={(e) => void handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="h-9 rounded-xl border border-white/15 bg-black/60 px-3 text-xs font-semibold text-white"
                          >
                            {[
                              "PENDING",
                              "CONFIRMED",
                              "PACKING",
                              "OUT_FOR_DELIVERY",
                              "DELIVERED",
                              "CANCELLED",
                            ].map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <TabGuideBanner
                arPoints={[
                  "تغيير حالة الطلب (PENDING / CONFIRMED / PACKING / OUT_FOR_DELIVERY / DELIVERED) يُحفظ فوراً في جدول orders بـ Supabase.",
                  "زر (تحديث واتساب) يفتح محادثة واتساب مع العميل برسالة جاهزة تحتوي على رقم الطلب والإجمالي والحالة."
                ]}
                enPoints={[
                  "Changing order status updates the orders table in Supabase immediately.",
                  "WhatsApp Update opens a pre-filled WhatsApp message to the customer with order number, total, and status."
                ]}
              />
            </div>
          ) : null}

          {/* HOME BUILDER */}
          {activeTab === "sections" ? (
            <div className="max-w-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">{t.sectionsTitle}</h2>
                <SaveButton tab="sections" onClick={() => void handleSaveSections()} />
              </div>
              <div className="space-y-2.5">
                {sections.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0815] px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="font-mono text-[11px] text-white/45" dir="ltr">
                        {s.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                        className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSections((prev) =>
                            prev.map((x) =>
                              x.id === s.id ? { ...x, visible: !x.visible } : x
                            )
                          )
                        }
                        className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                          s.visible
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {s.visible ? t.visible : t.hidden}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <TabGuideBanner
                arPoints={[
                  "الأسهم (أعلى / أسفل) تغيّر ترتيب ظهور الأقسام في الصفحة الرئيسية.",
                  "زر (ظاهر / مخفي) يتحكم في إظهار أو إخفاء أي قسم بالكامل من الرئيسية ويُحفظ في جدول page_sections."
                ]}
                enPoints={[
                  "Up/Down arrows reorder sections on the Storefront Homepage.",
                  "Visible/Hidden toggles section visibility in Supabase page_sections."
                ]}
              />
            </div>
          ) : null}

          {/* CAIRO SHIPPING */}
          {activeTab === "shipping" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold">{t.shippingTitle}</h2>
                <SaveButton tab="shipping" onClick={() => void handleSaveZones()} />
              </div>

              <form
                onSubmit={handleAddZone}
                className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-4"
              >
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1 block text-xs text-white/65">{t.addZoneTitle}</label>
                  <input
                    required
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder={t.zoneNamePlaceholder}
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/65">{t.fee}</label>
                  <input
                    type="number"
                    value={newZoneFee}
                    onChange={(e) => setNewZoneFee(Number(e.target.value))}
                    className="h-9 w-24 rounded-xl border border-white/15 bg-black/50 px-3 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.addZoneBtn}
                </button>
              </form>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {zones.map((z) => (
                  <div
                    key={z.id}
                    className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-300" />
                        <h3 className="text-sm font-semibold">{z.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setZones((prev) =>
                            prev.map((x) =>
                              x.id === z.id ? { ...x, active: !x.active } : x
                            )
                          )
                        }
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          z.active
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/45"
                        }`}
                      >
                        {z.active ? t.active : t.hidden}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <label className="text-white/60">
                        {t.fee}
                        <input
                          type="number"
                          value={z.fee}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((x) =>
                                x.id === z.id ? { ...x, fee: Number(e.target.value) } : x
                              )
                            )
                          }
                          className="mx-2 h-8 w-20 rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                      <label className="text-white/60">
                        {t.freeAbove}
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
                          className="mx-2 h-8 w-24 rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <TabGuideBanner
                arPoints={[
                  "مناطق الشحن المفعّلة تظهر للعملاء داخل سلة MY ROOM لحساب تكلفة التوصيل في القاهرة والقاهرة الجديدة.",
                  "إذا وصل إجمالي طلب العميل إلى رقم (مجاني فوق) يصبح الشحن مجانياً (FREE) تلقائياً."
                ]}
                enPoints={[
                  "Active Cairo/New Cairo zones appear inside the My Room bag drawer for live shipping calculation.",
                  "Orders reaching the Free Above threshold automatically receive FREE shipping."
                ]}
              />
            </div>
          ) : null}

          {/* TEAM & INVITES */}
          {activeTab === "team" ? (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{t.teamTitle}</h2>
                <p className="mt-1 text-xs text-white/55">{t.teamSub}</p>
              </div>

              <form
                onSubmit={handleCreateInvite}
                className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5"
              >
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1.5 block text-xs font-semibold text-white/70">
                    {t.adminEmail}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="new-admin@example.com"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/70">
                    {t.role}
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
                  <span>{t.genInvite}</span>
                </button>
              </form>

              {invites.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                    {t.inviteLinksTitle}
                  </h3>
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
                            {t.role}: {inv.role} • {t.expires}:{" "}
                            {new Date(inv.expiresAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {inv.usedAt ? (
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                              {t.used}
                            </span>
                          ) : expired ? (
                            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                              {t.expired}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopyInvite(inv.token)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                            >
                              {copiedToken === inv.token ? (
                                <>
                                  <Check className="h-3.5 w-3.5" /> {t.copied}
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" /> {t.copyLink}
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

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                  {t.activeAccounts} ({accounts.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b0815] p-4"
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
                      <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {acc.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <TabGuideBanner
                arPoints={[
                  "رابط الدعوة صالح لمدة 48 ساعة فقط ويُستخدم مرة واحدة: بمجرد أن يسجل الأدمن الجديد اسمه وباسورده يتعطل الرابط تلقائياً.",
                  "جميع حسابات الـ Owners والأدمن محفوظة في جدول users وروابط الدعوة في admin_invites على Supabase."
                ]}
                enPoints={[
                  "Invite links expire after 48 hours and are strictly single-use: once redeemed, the token is marked used.",
                  "All Owner/Admin accounts and invites are stored in Supabase users & admin_invites tables."
                ]}
              />
            </div>
          ) : null}

          {/* MY PROFILE */}
          {activeTab === "profile" ? (
            <div className="max-w-xl space-y-5">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{t.profileTitle}</h2>
                <p className="mt-1 text-xs text-white/55">{t.profileSub}</p>
              </div>

              <form
                onSubmit={handleSaveProfile}
                className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6"
              >
                <div>
                  <label className="mb-1 block text-xs text-white/65">{t.displayName}</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/65">
                    {t.usernameLabel}
                  </label>
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
                  <label className="mb-1 block text-xs text-white/65">{t.emailLabel}</label>
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
                    <span>{t.newPasswordLabel}</span>
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={profileNewPassword}
                    onChange={(e) => setProfileNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                  />
                </div>

                <SaveButton
                  tab="profile"
                  onClick={() => {
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    void handleSaveProfile(fakeEvent);
                  }}
                />
              </form>

              <TabGuideBanner
                arPoints={[
                  "تعديل اسم المستخدم (Username) يتيح لك تسجيل الدخول للوحة التحكم باستخدامه مع كلمة المرور بدون كتابة الإيميل.",
                  "تعديل كلمة المرور يشفرها فوراً ويحفظها في جدول users على Supabase."
                ]}
                enPoints={[
                  "Updating your Username lets you sign in to Admin with Username + Password without needing your email.",
                  "Updating your password hashes and stores it securely in Supabase users."
                ]}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
