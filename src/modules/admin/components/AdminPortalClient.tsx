/**
 * @file src/modules/admin/components/AdminPortalClient.tsx
 * @purpose Full-featured ROOM Admin & Owner Portal: Event Theme Presets + Default Theme Restore, Add/Edit/Delete Products, Orders Manager, Home Builder, Cairo Shipping, 48h Invites, and AR/EN toggle.
 */

"use client";

import { sbDelete, sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import {
  generateClientId,
  hashPasswordWeb,
  verifyPasswordWeb,
} from "@shared/utils/client-auth";
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Check,
  Copy,
  KeyRound,
  Languages,
  LayoutDashboard,
  Layers,
  LogOut,
  MapPin,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Save,
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
import { useEffect, useState } from "react";

type Lang = "ar" | "en";

type AdminTab =
  | "overview"
  | "store"
  | "universes"
  | "catalog"
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
  {
    id: "owner_tareq",
    email: "tareq612345@gmail.com",
    username: "tareq",
    name: "Tareq (Owner)",
    role: "OWNER",
    passwordHash: "",
  },
  {
    id: "owner_adegddn",
    email: "adegddn@gmail.com",
    username: "adegddn",
    name: "Partner (Owner)",
    role: "OWNER",
    passwordHash: "",
  },
];

const INITIAL_UNIVERSES = [
  { id: "univ_cars", slug: "cars", name: "GARAGE & CARS", tagline: "Midnight Touge & Supercar Bedroom Loadouts", accentColor: "#d92323", isActive: true },
  { id: "univ_gaming", slug: "gaming", name: "GAMING ARENA", tagline: "Obsidian RGB & Next-Gen Battle Stations", accentColor: "#6366f1", isActive: true },
  { id: "univ_anime", slug: "anime", name: "ANIME REALM", tagline: "Shonen Arcs, Katana & Neo-Tokyo Vibes", accentColor: "#c94b99", isActive: true },
];

const INITIAL_PRODUCTS = [
  { id: "prod_touge", name: "Midnight Touge Carbon Bedsheet", subtitle: "300TC Matte Obsidian Cotton • Pit-Lane Red Piping", universeId: "univ_cars", universe: "cars", price: 1450, stock: 18, thumbnailUrl: "/mockups/products/sheet-midnight-touge.svg", isFreshDrop: true },
  { id: "prod_ranked", name: "Obsidian Ranked Arena Bedsheet", subtitle: "Stealth Micro-Weave • Indigo Stitch Matrix", universeId: "univ_gaming", universe: "gaming", price: 1390, stock: 12, thumbnailUrl: "/mockups/products/sheet-obsidian-ranked.svg", isFreshDrop: true },
  { id: "prod_eclipse", name: "Neo-Tokyo Eclipse Bedsheet", subtitle: "Brushed Dark Sateen • Orchid Embroidered Crest", universeId: "univ_anime", universe: "anime", price: 1550, stock: 9, thumbnailUrl: "/mockups/products/sheet-neo-tokyo.svg", isFreshDrop: true },
  { id: "prod_apex", name: "Apex GT Twin Pillowcase Pair", subtitle: "Limited Cairo Drop • Heavyweight Weave", universeId: "univ_cars", universe: "cars", price: 590, stock: 0, thumbnailUrl: "/mockups/products/pillows-apex-gt.svg", isFreshDrop: true },
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
    brand: "ROOM ADMIN",
    loginSub: "Sign in with Username or Email",
    identifierLabel: "Username or Email",
    identifierPlaceholder: "tareq or tareq612345@gmail.com",
    passwordLabel: "Password",
    loginBtn: "Enter Control Center",
    loginErr: "Invalid username/email or password",
    seededTitle: "Seeded Owners:",
    initialPassNote: "Initial password:",
    changeInProfile: "(change in Profile)",
    tabs: {
      overview: "Overview",
      store: "Store & Themes",
      universes: "Universes",
      catalog: "Catalog & Products",
      orders: "Orders",
      sections: "Home Builder",
      shipping: "Cairo Shipping",
      team: "Owners & Invites",
      profile: "My Profile",
    },
    viewStore: "View Storefront →",
    viewSchema: "DB Schema Explorer →",
    signOut: "Sign Out",
    welcome: "Welcome back",
    signedInAs: "Signed in as",
    stats: {
      universes: "Active Universes",
      products: "Catalog Products",
      zones: "Cairo Shipping Zones",
      team: "Owners & Admins",
    },
    storeTitle: "Store & Event Theme Presets",
    storeName: "Store Name",
    whatsapp: "WhatsApp Order Number",
    homeAccent: "Home Default Accent",
    bgPrimary: "Canvas Top (Primary)",
    bgSecondary: "Canvas Mid (Secondary)",
    bgElevated: "Canvas Bottom (Elevated)",
    presetsTitle: "Saved Event Themes & Default Restore",
    presetPlaceholder: "Event name (e.g. Ramadan Nights, Black Friday)",
    savePresetBtn: "Save Current Theme as Preset",
    applyTheme: "Apply Theme",
    restoreDefault: "Restore ROOM Default",
    universesTitle: "Universes Control",
    active: "Active",
    hidden: "Hidden",
    visible: "Visible",
    catalogTitle: "Catalog & Product Management",
    addProductTitle: "Add New Product",
    prodName: "Product Name",
    prodSub: "1-Line Subtitle",
    prodPrice: "Price (EGP)",
    prodStock: "Initial Stock",
    prodMockup: "Mockup Visual",
    addProdBtn: "Add Product",
    egp: "EGP",
    stock: "Stock",
    vaulted: "Vaulted",
    inStock: "In Stock",
    ordersTitle: "Customer Orders",
    noOrders: "No orders placed yet. Orders from checkout will appear here live.",
    sectionsTitle: "Homepage Section Builder",
    shippingTitle: "Cairo & New Cairo Shipping Zones",
    fee: "Fee (EGP)",
    freeAbove: "Free Above",
    teamTitle: "Owners & Admin Team",
    teamSub: "Invite a new admin by email to generate a 48-hour single-use onboarding link.",
    adminEmail: "Admin Email",
    role: "Role",
    genInvite: "Generate 48h Invite Link",
    inviteLinksTitle: "Single-Use Invite Links (Valid 48 Hours)",
    expires: "Expires",
    used: "Used",
    expired: "Expired",
    copyLink: "Copy Invite Link",
    copied: "Copied Link",
    activeAccounts: "Active Accounts",
    profileTitle: "My Profile & Username",
    profileSub: "Set a custom username so you can sign in with Username + Password without needing your email.",
    displayName: "Display Name",
    usernameLabel: "Username (Login without Email)",
    emailLabel: "Email",
    newPasswordLabel: "New Password (leave blank to keep current)",
    saveBtn: "Save Changes",
    savedBtn: "Saved!",
  },
  ar: {
    brand: "إدارة ROOM",
    loginSub: "سجّل الدخول باسم المستخدم أو البريد الإلكتروني",
    identifierLabel: "اسم المستخدم أو البريد الإلكتروني",
    identifierPlaceholder: "tareq أو tareq612345@gmail.com",
    passwordLabel: "كلمة المرور",
    loginBtn: "دخول لوحة التحكم",
    loginErr: "اسم المستخدم/البريد أو كلمة المرور غير صحيحة",
    seededTitle: "حسابات المالكين المسجلة:",
    initialPassNote: "كلمة المرور الأولية:",
    changeInProfile: "(يمكن تغييرها من الملف الشخصي)",
    tabs: {
      overview: "نظرة عامة",
      store: "المتجر والثيمات",
      universes: "الأقسام (Universes)",
      catalog: "المنتجات والمخزون",
      orders: "الطلبات",
      sections: "بناء الرئيسية",
      shipping: "شحن القاهرة",
      team: "المالكون والدعوات",
      profile: "ملفي الشخصي",
    },
    viewStore: "عرض المتجر ←",
    viewSchema: "خريطة قاعدة البيانات ←",
    signOut: "تسجيل الخروج",
    welcome: "مرحباً بعودتك",
    signedInAs: "مسجل باسم",
    stats: {
      universes: "الأقسام النشطة",
      products: "المنتجات بالكتالوج",
      zones: "مناطق شحن القاهرة",
      team: "المالكون والأدمن",
    },
    storeTitle: "إعدادات المتجر وثيمات الإيفنتات",
    storeName: "اسم المتجر",
    whatsapp: "رقم واتساب الطلبات",
    homeAccent: "اللون الأساسي للرئيسية",
    bgPrimary: "لون الخلفية العلوي",
    bgSecondary: "لون الخلفية الأوسط",
    bgElevated: "لون الخلفية السفلي",
    presetsTitle: "الثيمات المحفوظة (الإيفنتات) والثيم الأساسي",
    presetPlaceholder: "اسم الإيفنت (مثال: رمضان، بلاك فرايداي)",
    savePresetBtn: "حفظ الثيم الحالي كقالب",
    applyTheme: "تطبيق الثيم",
    restoreDefault: "استرجاع ثيم ROOM الأساسي",
    universesTitle: "التحكم في الأقسام (Universes)",
    active: "مفعل",
    hidden: "مخفي",
    visible: "ظاهر",
    catalogTitle: "إدارة المنتجات والمخزون",
    addProductTitle: "إضافة منتج جديد",
    prodName: "اسم المنتج",
    prodSub: "وصف سطر واحد",
    prodPrice: "السعر (ج.م)",
    prodStock: "المخزون",
    prodMockup: "صورة الموكاب",
    addProdBtn: "إضافة المنتج",
    egp: "ج.م",
    stock: "المخزون",
    vaulted: "نفد (Vaulted)",
    inStock: "متاح",
    ordersTitle: "طلبات العملاء",
    noOrders: "لا توجد طلبات مسجلة بعد. أي طلب جديد سيظهر هنا مباشرة.",
    sectionsTitle: "ترتيب وإظهار أقسام الرئيسية",
    shippingTitle: "مناطق الشحن (القاهرة والقاهرة الجديدة)",
    fee: "تكلفة الشحن (ج.م)",
    freeAbove: "شحن مجاني فوق",
    teamTitle: "المالكون وفريق الإدارة",
    teamSub: "أضف إيميل أدمن جديد لتوليد رابط دعوة صالح ليومين (48 ساعة) للاستخدام مرة واحدة فقط.",
    adminEmail: "البريد الإلكتروني للأدمن",
    role: "الصلاحية",
    genInvite: "توليد رابط دعوة (48 ساعة)",
    inviteLinksTitle: "روابط الدعوة (صالحة 48 ساعة • استخدام مرة واحدة)",
    expires: "ينتهي في",
    used: "مُستخدم",
    expired: "منتهي",
    copyLink: "نسخ رابط الدعوة",
    copied: "تم النسخ",
    activeAccounts: "الحسابات النشطة",
    profileTitle: "الملف الشخصي واسم المستخدم",
    profileSub: "حدد اسم مستخدم (Username) لتتمكن من تسجيل الدخول به مع كلمة المرور بدون كتابة الإيميل.",
    displayName: "الاسم الظاهر",
    usernameLabel: "اسم المستخدم (للدخول بدون إيميل)",
    emailLabel: "البريد الإلكتروني",
    newPasswordLabel: "كلمة مرور جديدة (اتركه فارغاً للإبقاء على الحالية)",
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

  // Store & Theme state
  const [storeName, setStoreName] = useState("ROOM");
  const [whatsapp, setWhatsapp] = useState("+201000000000");
  const [defaultAccent, setDefaultAccent] = useState("#ffffff");
  const [bgPrimary, setBgPrimary] = useState("#05030a");
  const [bgSecondary, setBgSecondary] = useState("#0b0617");
  const [bgElevated, setBgElevated] = useState("#140b29");
  const [presets, setPresets] = useState<ThemePreset[]>([ROOM_DEFAULT_PRESET]);
  const [newPresetName, setNewPresetName] = useState("");

  // Universes, Catalog, Orders, Sections, Zones
  const [universes, setUniverses] = useState(INITIAL_UNIVERSES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [sections, setSections] = useState(INITIAL_SECTIONS);

  // Add Product form
  const [newProdName, setNewProdName] = useState("");
  const [newProdSub, setNewProdSub] = useState("");
  const [newProdUnivSlug, setNewProdUnivSlug] = useState("cars");
  const [newProdPrice, setNewProdPrice] = useState(1490);
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdThumb, setNewProdThumb] = useState(MOCKUP_OPTIONS[0]?.value ?? "");

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
        const [sbStores, sbUnivs, sbProds, sbVars, sbZones, sbUsers, sbInvites, sbSections, sbOrders] =
          await Promise.all([
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
            sbSelect<{ id: string; slug: string; name: string; tagline: string | null; accentColor: string; isActive: boolean }>(
              "universes",
              "select=id,slug,name,tagline,accentColor,isActive&order=sortOrder.asc"
            ),
            sbSelect<{ id: string; universeId: string; slug: string; name: string; subtitle: string | null; basePrice: number | string; thumbnailUrl: string; isNewArrival: boolean }>(
              "products",
              "select=id,universeId,slug,name,subtitle,basePrice,thumbnailUrl,isNewArrival&isActive=eq.true&order=createdAt.asc"
            ),
            sbSelect<{ id: string; productId: string; stock: number }>(
              "product_variants",
              "select=id,productId,stock"
            ),
            sbSelect<{ id: string; name: string; fee: number | string; freeShippingThreshold: number | string | null; estimatedDays: string; isActive: boolean }>(
              "shipping_zones",
              "select=id,name,fee,freeShippingThreshold,estimatedDays,isActive&order=sortOrder.asc"
            ),
            sbSelect<{ id: string; email: string | null; username: string | null; name: string; role: "OWNER" | "ADMIN" | "STAFF"; passwordHash: string | null }>(
              "users",
              "select=id,email,username,name,role,passwordHash&role=in.(OWNER,ADMIN,STAFF)&order=createdAt.asc"
            ),
            sbSelect<LocalInvite>(
              "admin_invites",
              "select=id,email,role,token,expiresAt,usedAt&order=createdAt.desc"
            ),
            sbSelect<{ id: string; type: string; title: string | null; isVisible: boolean; sortOrder: number }>(
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
                stock: totalStock,
                thumbnailUrl: p.thumbnailUrl,
                isFreshDrop: p.isNewArrival,
              };
            })
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

    const nextUnivs = universes.map((u) => ({
      ...u,
      accentColor: preset.universeColors[u.slug] ?? u.accentColor,
    }));
    setUniverses(nextUnivs);

    try {
      await Promise.all([
        sbPatch("store_configs", "slug=eq.room-egypt", {
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
            basePrice: p.price,
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
          stock: newProdStock,
          thumbnailUrl: newProdThumb,
          isFreshDrop: true,
        },
      ]);
      localStorage.removeItem("room_live_products_v1");
      setNewProdName("");
      setNewProdSub("");
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
      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/25"
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{lang === "ar" ? "English" : "عربي"}</span>
    </button>
  );

  if (!currentUser) {
    return (
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-[#05030a] px-4 text-white"
      >
        <div className="fixed right-5 top-5 z-50">
          <LangToggleButton />
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0c0916]/95 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-[0.12em]">
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

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t.tabs.overview, icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "store", label: t.tabs.store, icon: <Palette className="h-4 w-4" /> },
    { id: "universes", label: t.tabs.universes, icon: <Sparkles className="h-4 w-4" /> },
    { id: "catalog", label: t.tabs.catalog, icon: <Package className="h-4 w-4" /> },
    { id: "orders", label: t.tabs.orders, icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "sections", label: t.tabs.sections, icon: <Layers className="h-4 w-4" /> },
    { id: "shipping", label: t.tabs.shipping, icon: <Truck className="h-4 w-4" /> },
    { id: "team", label: t.tabs.team, icon: <Users className="h-4 w-4" /> },
    { id: "profile", label: t.tabs.profile, icon: <Settings className="h-4 w-4" /> },
  ];

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
      className="flex min-h-screen bg-[#05030a] text-white"
    >
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-white/10 bg-[#080611] p-5 md:flex">
        <div className="flex items-center justify-between">
          <span className="font-serif text-base font-semibold tracking-[0.15em]">
            {t.brand}
          </span>
          <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {currentUser.role}
          </span>
        </div>

        <div className="mt-4">
          <LangToggleButton />
        </div>

        <nav className="mt-6 flex-1 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === item.id
                  ? "bg-white text-black"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <Link
            href="/"
            className="block rounded-xl border border-white/15 px-3 py-2 text-center text-xs font-semibold text-white/80 hover:bg-white/5"
          >
            {t.viewStore}
          </Link>
          <Link
            href="/schema/"
            className="block rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-center text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
          >
            {t.viewSchema}
          </Link>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 md:hidden">
          <span className="font-serif text-base font-semibold tracking-widest">
            {t.brand}
          </span>
          <LangToggleButton />
          <div className="flex w-full flex-wrap gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  activeTab === item.id
                    ? "bg-white text-black"
                    : "border border-white/15 text-white/75"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold">
                {t.welcome}, {currentUser.name}
              </h2>
              <p className="mt-1 text-xs text-white/55">
                {t.signedInAs} <span dir="ltr">@{currentUser.username} ({currentUser.email})</span> •{" "}
                {currentUser.role}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t.stats.universes, value: universes.filter((u) => u.isActive).length },
                { label: t.stats.products, value: products.length },
                { label: t.stats.zones, value: zones.filter((z) => z.active).length },
                { label: t.stats.team, value: accounts.length },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-[#0d0a16] p-5"
                >
                  <p className="text-xs text-white/55">{stat.label}</p>
                  <p className="mt-2 font-serif text-3xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* STORE & EVENT THEMES */}
        {activeTab === "store" ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-semibold">{t.storeTitle}</h2>
              <SaveButton tab="store" onClick={() => void handleSaveStore()} />
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/65">{t.storeName}</label>
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/65">{t.whatsapp}</label>
                <input
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>
              {[
                { label: t.homeAccent, val: defaultAccent, set: setDefaultAccent },
                { label: t.bgPrimary, val: bgPrimary, set: setBgPrimary },
                { label: t.bgSecondary, val: bgSecondary, set: setBgSecondary },
                { label: t.bgElevated, val: bgElevated, set: setBgElevated },
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

            {/* Event Theme Presets */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold">{t.presetsTitle}</h3>
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
                  className="h-10 flex-1 min-w-[220px] rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                >
                  <BookmarkPlus className="h-4 w-4" />
                  {t.savePresetBtn}
                </button>
              </form>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
        ) : null}

        {/* UNIVERSES */}
        {activeTab === "universes" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-semibold">{t.universesTitle}</h2>
              <SaveButton tab="universes" onClick={() => void handleSaveUniverses()} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {universes.map((u) => (
                <div
                  key={u.id}
                  className="space-y-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-5"
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
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* CATALOG & ADD PRODUCT */}
        {activeTab === "catalog" ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-semibold">{t.catalogTitle}</h2>
              <SaveButton tab="catalog" onClick={() => void handleSaveCatalog()} />
            </div>

            {/* Add New Product Form */}
            <form
              onSubmit={handleAddProduct}
              className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-5 sm:grid-cols-2 lg:grid-cols-6"
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
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="font-mono text-xs text-white/50">
                      Universe: {p.universe}
                    </p>
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
                        className="mx-2 h-8 w-24 rounded-lg border border-white/15 bg-black/50 px-2 text-xs text-white"
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
                        className="mx-2 h-8 w-20 rounded-lg border border-white/15 bg-black/50 px-2 text-xs text-white"
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
          </div>
        ) : null}

        {/* ORDERS */}
        {activeTab === "orders" ? (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">{t.ordersTitle}</h2>
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0d0a16] p-8 text-center text-xs text-white/55">
                {t.noOrders}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
                  >
                    <div>
                      <p className="font-mono text-sm font-bold text-white">
                        #{ord.orderNumber} — {ord.customerName}
                      </p>
                      <p className="text-xs text-white/55">
                        {ord.customerPhone} • {ord.paymentMethod} • {ord.total} EGP
                      </p>
                    </div>
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
                ))}
              </div>
            )}
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d0a16] px-5 py-3.5"
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
          </div>
        ) : null}

        {/* CAIRO SHIPPING */}
        {activeTab === "shipping" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-semibold">{t.shippingTitle}</h2>
              <SaveButton tab="shipping" onClick={() => void handleSaveZones()} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="space-y-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-5"
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
              className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-5"
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
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
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
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
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
              className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-6"
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
