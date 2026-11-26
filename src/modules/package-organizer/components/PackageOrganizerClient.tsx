/**
 * @file src/modules/package-organizer/components/PackageOrganizerClient.tsx
 * @purpose Isolated Admin Packages & Collections Organizer (/admin/packages/): manages Packages & Collections (outer banner image + large top hero image + multi-product membership without product editing or color filters).
 */

"use client";

import {
  fetchResolvedProductsForStorefront,
  type OrganizedProduct,
} from "@modules/product-organizer";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Languages,
  Layers,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPackageOrganizerSnapshot,
  saveIsolatedPackageRegistry,
} from "../client-api";
import {
  PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY,
  buildDefaultPackageSpecs,
  getPackageHref,
  slugifyPackageName,
} from "../helpers";
import {
  OrganizedPackageSchema,
  PackageRegistrySchema,
  type OrganizedPackage,
  type PackageRegistry,
} from "../schema";
import { StorefrontPackageBannerCard } from "./StorefrontPackageBannerCard";

type Lang = "ar" | "en";
type DetailTab = "identity" | "products";
type StatusFilter = "all" | "active" | "paused";
type KindFilter = "all" | "PACKAGE" | "COLLECTION";
type AssignFilter = "all" | "assigned" | "unassigned";

interface PackageOrganizerClientProps {
  initialStoreId: string;
  initialRegistry: PackageRegistry;
  initialHasPersistedRecord: boolean;
}

const COPY = {
  ar: {
    brand: "منظم الباكدجات والكوليكشنز",
    isolatedBadge: "نظام معزول بالكود والداتا",
    backToAdmin: "لوحة الإدارة",
    addBtn: "إضافة باكدج / كوليكشن",
    saveNow: "حفظ التعديلات",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ في الداتا المعزولة",
    saveError: "تعذر الحفظ في Supabase (محفوظ محلياً)",
    allFilter: "الكل",
    activeFilter: "المفعّلة",
    pausedFilter: "المعطّلة مؤقتاً",
    packagesOnly: "باكدجات",
    collectionsOnly: "كوليكشنز",
    searchPlaceholder: "ابحث عن باكدج أو كوليكشن...",
    pausedLabel: "معطل مؤقتاً",
    activeLabel: "مفعّل",
    enterEdit: "تخصيص والمنتجات",
    previewInner: "معاينة صفحة التفاصيل",
    pauseBtn: "تعطيل مؤقت",
    enableBtn: "تفعيل",
    deleteBtn: "حذف",
    confirmDelete: "تأكيد الحذف؟",
    cancel: "إلغاء",
    backToList: "العودة للقائمة",
    productsCount: (n: number) => `${n} منتج`,
    tabs: {
      identity: "1. الشكل والبانر والبيانات",
      products: "2. المنتجات داخل الكوليكشن / الباكدج",
    },
    formTitle: "تعديل الباكدج / الكوليكشن (الصورة الخارجية + صورة صفحة التفاصيل)",
    kindLabel: "النوع",
    kindCollection: "كوليكشن (Collection)",
    kindPackage: "باكدج (Loadout)",
    nameLabel: "العنوان",
    taglineLabel: "السطر المختصر",
    descriptionLabel: "الوصف الكامل",
    slugLabel: "المعرّف (Slug)",
    badgeLabel: "شارة البانر",
    ctaLabel: "نص الزر",
    universeTagLabel: "شارة القسم (اختياري)",
    accentLabel: "اللون",
    pricingModeLabel: "نظام التسعير",
    modeFixed: "سعر موحّد مع خصم (باكدج)",
    modeShowcase: "عرض منتجات فقط (كوليكشن)",
    finalPriceLabel: "السعر النهائي (EGP)",
    originalPriceLabel: "السعر الأصلي قبل الخصم (EGP)",
    bannerImgTitle: "صورة البانر من برا + تنسيقها",
    heroImgTitle: "الصورة الكبيرة أعلى صفحة التفاصيل",
    uploadImg: "تحميل صورة",
    fitCover: "تعبئة كاملة (Cover)",
    fitContain: "إطار كامل (Contain)",
    posTop: "أعلى",
    posCenter: "وسط",
    posBottom: "أسفل",
    imgHint: "PNG / JPG / WEBP بحد أقصى 400KB.",
    imgErrType: "اختر صورة PNG أو JPG أو WEBP فقط.",
    imgErrSize: "حجم الصورة يجب ألا يتجاوز 400 كيلوبايت.",
    specsTitle: "تفاصيل ومزايا إضافية",
    addSpec: "+ إضافة تفصيلة",
    specKey: "العنوان",
    specVal: "القيمة",
    showProductsToggle: "عرض قائمة المنتجات داخل صفحة التفاصيل",
    showBtnToggle: "عرض زر الإضافة للسلة في صفحة التفاصيل",
    previewOuter: "معاينة البانر الخارجي",
    previewHero: "معاينة الصورة الكبيرة في صفحة التفاصيل",
    productsNotice:
      "اختر من كل منتجات الموقع الموجودة لتظهر داخل هذا الكوليكشن/الباكدج (بدون تعديل المنتج نفسه وبدون فلاتر ألوان، ويمكن للمنتج الانتماء لأكثر من كوليكشن). ولربطه بأي يونيفيرس افتح تبويب العروض داخل /admin/universes/.",
    searchProducts: "ابحث في المنتجات...",
    assignedOnly: "المختارة هنا",
    unassignedOnly: "غير المختارة",
    selectedInPack: "موجود داخل الكوليكشن",
    addToPack: "إضافة للكوليكشن",
    alsoIn: "موجود أيضاً في",
    noItems: "لا توجد عناصر مطابقة.",
    newModalTitle: "إضافة باكدج أو كوليكشن جديد بداتا معزولة",
    createBtn: "إنشاء وتخصيص",
  },
  en: {
    brand: "Packages & Collections",
    isolatedBadge: "Isolated Code & Data",
    backToAdmin: "Admin Portal",
    addBtn: "Add Package / Collection",
    saveNow: "Save Changes",
    saving: "Saving...",
    saved: "Saved to Isolated Data",
    saveError: "Supabase save failed (cached locally)",
    allFilter: "All",
    activeFilter: "Active",
    pausedFilter: "Paused",
    packagesOnly: "Packages",
    collectionsOnly: "Collections",
    searchPlaceholder: "Search packages or collections...",
    pausedLabel: "Paused",
    activeLabel: "Active",
    enterEdit: "Customize & Products",
    previewInner: "Preview Detail Page",
    pauseBtn: "Pause",
    enableBtn: "Enable",
    deleteBtn: "Delete",
    confirmDelete: "Confirm delete?",
    cancel: "Cancel",
    backToList: "Back to List",
    productsCount: (n: number) => `${n} products`,
    tabs: {
      identity: "1. Banner, Hero & Details",
      products: "2. Included Products",
    },
    formTitle: "Edit Package / Collection (Outer Banner + Large Detail Hero)",
    kindLabel: "Type",
    kindCollection: "Collection",
    kindPackage: "Package (Loadout)",
    nameLabel: "Title",
    taglineLabel: "Tagline",
    descriptionLabel: "Full Description",
    slugLabel: "Slug",
    badgeLabel: "Badge Text",
    ctaLabel: "Button Text",
    universeTagLabel: "Universe Tag (Optional)",
    accentLabel: "Accent Color",
    pricingModeLabel: "Pricing Mode",
    modeFixed: "Fixed Bundle Price",
    modeShowcase: "Collection Showcase Only",
    finalPriceLabel: "Final Price (EGP)",
    originalPriceLabel: "Original Price (EGP)",
    bannerImgTitle: "Outer Banner Image & Framing",
    heroImgTitle: "Large Top Image on Detail Page",
    uploadImg: "Upload Image",
    fitCover: "Cover",
    fitContain: "Contain",
    posTop: "Top",
    posCenter: "Center",
    posBottom: "Bottom",
    imgHint: "PNG / JPG / WEBP up to 400KB.",
    imgErrType: "Please select PNG, JPG, or WEBP.",
    imgErrSize: "Image size must be 400KB or smaller.",
    specsTitle: "Extra Details & Perks",
    addSpec: "+ Add Detail",
    specKey: "Label",
    specVal: "Value",
    showProductsToggle: "Show included products inside detail page",
    showBtnToggle: "Show Add to Room button on detail page",
    previewOuter: "Live Outer Banner Preview",
    previewHero: "Detail Page Top Hero Preview",
    productsNotice:
      "Select existing site products to include inside this Collection/Package (read-only, zero color filters, multi-membership supported). Assign this Collection to any Universe from /admin/universes/ Tab 3.",
    searchProducts: "Search products...",
    assignedOnly: "Included",
    unassignedOnly: "Not Included",
    selectedInPack: "Included in Collection",
    addToPack: "Add to Collection",
    alsoIn: "Also in",
    noItems: "No matching items found.",
    newModalTitle: "Create Package or Collection with Clean Isolated Data",
    createBtn: "Create & Customize",
  },
} as const;

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

export function PackageOrganizerClient({
  initialStoreId,
  initialRegistry,
  initialHasPersistedRecord,
}: PackageOrganizerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];

  const [storeId, setStoreId] = useState(initialStoreId);
  const [registry, setRegistry] = useState<PackageRegistry>(initialRegistry);
  const [recordExistsInDb, setRecordExistsInDb] = useState(initialHasPersistedRecord);
  const [siteProducts, setSiteProducts] = useState<OrganizedProduct[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("identity");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newKind, setNewKind] = useState<"COLLECTION" | "PACKAGE">("COLLECTION");
  const [newName, setNewName] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newColor, setNewColor] = useState("#c94b99");
  const [newBanner, setNewBanner] = useState("/mockups/universe-anime.svg");
  const [newPrice, setNewPrice] = useState(2190);

  const persistRegistry = async (
    nextRegistry: PackageRegistry,
    targetStoreId = storeId,
    exists = recordExistsInDb
  ) => {
    setSaveState("saving");
    try {
      await saveIsolatedPackageRegistry({
        storeId: targetStoreId,
        registry: nextRegistry,
        recordExistsInDb: exists,
      });
      if (!exists) setRecordExistsInDb(true);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2400);
    } catch {
      setSaveState("error");
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [snapshot, resolvedProducts] = await Promise.all([
          fetchPackageOrganizerSnapshot(),
          fetchResolvedProductsForStorefront().catch(() => [] as OrganizedProduct[]),
        ]);
        if (!active) return;

        setStoreId(snapshot.storeId);
        setRegistry(snapshot.registry);
        setRecordExistsInDb(snapshot.recordExistsInDb);
        setSiteProducts(resolvedProducts);

        if (!snapshot.recordExistsInDb) {
          await persistRegistry(snapshot.registry, snapshot.storeId, false);
        }
      } catch {
        try {
          const raw = localStorage.getItem(PACKAGE_ORGANIZER_LOCAL_STORAGE_KEY);
          if (raw && active) {
            const parsed = PackageRegistrySchema.safeParse(JSON.parse(raw));
            if (parsed.success) setRegistry(parsed.data);
          }
        } catch {
          // Keep initial props
        }
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPkg = useMemo(
    () => registry.packages.find((p) => p.id === selectedId) ?? null,
    [registry.packages, selectedId]
  );

  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registry.packages
      .filter((p) => {
        if (statusFilter === "active" && !p.isActive) return false;
        if (statusFilter === "paused" && p.isActive) return false;
        if (kindFilter !== "all" && p.kind !== kindFilter) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [registry.packages, statusFilter, kindFilter, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!selectedPkg) return [];
    const q = productSearch.trim().toLowerCase();
    return siteProducts.filter((prod) => {
      const assigned = selectedPkg.productIds.includes(prod.id);
      if (assignFilter === "assigned" && !assigned) return false;
      if (assignFilter === "unassigned" && assigned) return false;
      if (!q) return true;
      return (
        prod.name.toLowerCase().includes(q) ||
        prod.subtitle.toLowerCase().includes(q) ||
        prod.universeSlug.toLowerCase().includes(q)
      );
    });
  }, [siteProducts, selectedPkg, productSearch, assignFilter]);

  const updateRegistry = (
    updater: (prev: PackageRegistry) => PackageRegistry,
    autoSave = true
  ) => {
    const next = updater(registry);
    const stamped: PackageRegistry = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    setRegistry(stamped);
    if (autoSave) void persistRegistry(stamped);
  };

  const updateSinglePackage = (
    pkgId: string,
    patch: Partial<OrganizedPackage>,
    autoSave = false
  ) => {
    const now = new Date().toISOString();
    updateRegistry(
      (prev) => ({
        ...prev,
        packages: prev.packages.map((p) =>
          p.id === pkgId ? { ...p, ...patch, updatedAt: now } : p
        ),
      }),
      autoSave
    );
  };

  const handleToggleProduct = (pkgId: string, productId: string) => {
    const target = registry.packages.find((p) => p.id === pkgId);
    if (!target) return;
    const exists = target.productIds.includes(productId);
    const nextIds = exists
      ? target.productIds.filter((id) => id !== productId)
      : [...target.productIds, productId];
    updateSinglePackage(pkgId, { productIds: nextIds }, true);
  };

  const handleImageUpload = (
    file: File | undefined,
    onSuccess: (dataUrl: string) => void
  ) => {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    const extOk = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extOk) {
      setImgErr(t.imgErrType);
      return;
    }
    if (file.size > 400 * 1024) {
      setImgErr(t.imgErrSize);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImgErr(null);
        onSuccess(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (pkgId: string) => {
    updateRegistry(
      (prev) => ({
        ...prev,
        packages: prev.packages.filter((p) => p.id !== pkgId),
      }),
      true
    );
    setConfirmDeleteId(null);
    if (selectedId === pkgId) setSelectedId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim() || "New Collection";
    const baseSlug = slugifyPackageName(newSlug.trim() || cleanName);
    const uniqueSlug = registry.packages.some((p) => p.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      : baseSlug;

    const now = new Date().toISOString();
    const isCollection = newKind === "COLLECTION";
    const created = OrganizedPackageSchema.parse({
      id: generateClientId("korg"),
      slug: uniqueSlug,
      kind: newKind,
      name: cleanName,
      tagline: newTagline.trim(),
      description: newTagline.trim() || cleanName,
      badgeLabel: isCollection ? "Collection" : "Loadout",
      ctaLabel: isCollection ? "Explore" : "Add to Room",
      accentColor: newColor,
      universeSlug: null,
      bannerImageUrl: newBanner,
      bannerImageFit: "cover",
      bannerImagePosition: "center",
      heroImageUrl: newBanner,
      pricingMode: isCollection ? "COLLECTION_SHOWCASE" : "FIXED_PRICE",
      originalPrice: isCollection ? null : newPrice + 450,
      finalPrice: isCollection ? null : newPrice,
      productIds: [],
      specs: buildDefaultPackageSpecs(newKind),
      showProductsInside: true,
      showAddPackBtn: !isCollection,
      isFeatured: true,
      isActive: true,
      sortOrder: registry.packages.length + 1,
      createdAt: now,
      updatedAt: now,
    });

    updateRegistry(
      (prev) => ({
        ...prev,
        packages: [created, ...prev.packages],
      }),
      true
    );

    setShowCreate(false);
    setNewName("");
    setNewTagline("");
    setNewSlug("");
    setSelectedId(created.id);
    setDetailTab("identity");
  };

  const activeCount = registry.packages.filter((p) => p.isActive).length;
  const pausedCount = registry.packages.length - activeCount;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#040308] text-white"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070510]/90 px-4 py-3.5 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              {lang === "ar" ? (
                <ArrowRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowLeft className="h-3.5 w-3.5" />
              )}
              <span>{t.backToAdmin}</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15">
                <Layers className="h-4 w-4 text-amber-300" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base font-semibold tracking-wide text-white md:text-lg">
                  {t.brand}
                </h1>
                <span className="hidden items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" />
                  {t.isolatedBadge}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {saveState === "saving" ? (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                {t.saving}
              </span>
            ) : saveState === "saved" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t.saved}
              </span>
            ) : saveState === "error" ? (
              <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-200">
                {t.saveError}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => void persistRegistry(registry)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{t.saveNow}</span>
            </button>

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "EN" : "عربي"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {!selectedPkg ? (
          /* ============================================================
             LIST VIEW: ALL PACKAGES & COLLECTIONS IN STOREFRONT STYLE
             ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all", label: `${t.allFilter} (${registry.packages.length})` },
                    { id: "active", label: `${t.activeFilter} (${activeCount})` },
                    { id: "paused", label: `${t.pausedFilter} (${pausedCount})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      statusFilter === pill.id
                        ? "bg-white text-black"
                        : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}

                <span className="mx-1 h-4 w-[1px] bg-white/15" />

                {(
                  [
                    { id: "all", label: t.allFilter },
                    { id: "PACKAGE", label: t.packagesOnly },
                    { id: "COLLECTION", label: t.collectionsOnly },
                  ] as const
                ).map((kf) => (
                  <button
                    key={kf.id}
                    type="button"
                    onClick={() => setKindFilter(kf.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
                      kindFilter === kf.id
                        ? "border border-amber-400/50 bg-amber-500/20 text-amber-200"
                        : "border border-white/10 bg-black/40 text-white/65 hover:text-white"
                    }`}
                  >
                    {kf.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="h-10 w-56 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-amber-500 px-5 text-xs font-bold text-black shadow-[0_8px_24px_rgba(245,158,11,0.3)] transition-transform hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addBtn}</span>
                </button>
              </div>
            </div>

            {filteredPackages.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-12 text-center text-sm text-white/60">
                {t.noItems}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#090712] p-3.5"
                  >
                    <StorefrontPackageBannerCard
                      pkg={pkg}
                      pausedLabel={t.pausedLabel}
                      onClick={() => {
                        setSelectedId(pkg.id);
                        setDetailTab("identity");
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/65">
                        {t.productsCount(pkg.productIds.length)}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(pkg.id);
                            setDetailTab("identity");
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{t.enterEdit}</span>
                        </button>

                        <Link
                          href={getPackageHref(pkg.slug)}
                          title={t.previewInner}
                          className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 p-1.5 text-white/80 hover:bg-white/15"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            updateSinglePackage(
                              pkg.id,
                              { isActive: !pkg.isActive },
                              true
                            )
                          }
                          className={`inline-flex items-center rounded-xl p-1.5 ${
                            pkg.isActive
                              ? "border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                              : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                          }`}
                        >
                          {pkg.isActive ? (
                            <PauseCircle className="h-3.5 w-3.5" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {confirmDeleteId === pkg.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(pkg.id)}
                              className="rounded-xl bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white"
                            >
                              {t.confirmDelete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-xl border border-white/15 px-2 py-1 text-[11px] text-white/70"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(pkg.id)}
                            className="inline-flex items-center rounded-xl border border-red-500/25 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ============================================================
             DETAIL WORKSPACE: 2 TABS (IDENTITY/BANNERS + MEMBER PRODUCTS)
             ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setConfirmDeleteId(null);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/85 hover:bg-white/10"
                >
                  {lang === "ar" ? (
                    <ArrowRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowLeft className="h-3.5 w-3.5" />
                  )}
                  <span>{t.backToList}</span>
                </button>

                <div>
                  <h2 dir="auto" className="font-serif text-lg font-semibold text-white">
                    {selectedPkg.name}
                  </h2>
                  <p className="font-mono text-[11px] text-white/50" dir="ltr">
                    {getPackageHref(selectedPkg.slug)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={getPackageHref(selectedPkg.slug)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{t.previewInner}</span>
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    updateSinglePackage(
                      selectedPkg.id,
                      { isActive: !selectedPkg.isActive },
                      true
                    )
                  }
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold ${
                    selectedPkg.isActive
                      ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                      : "border border-amber-400/35 bg-amber-500/15 text-amber-200"
                  }`}
                >
                  {selectedPkg.isActive ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t.activeLabel}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>{t.pausedLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2 Tabs */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "identity", label: t.tabs.identity, icon: <Sparkles className="h-4 w-4" /> },
                  {
                    id: "products",
                    label: `${t.tabs.products} (${selectedPkg.productIds.length})`,
                    icon: <Package className="h-4 w-4" />,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                    detailTab === tab.id
                      ? "bg-white text-black shadow-[0_6px_20px_rgba(255,255,255,0.18)]"
                      : "border border-white/15 bg-[#0b0815] text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {detailTab === "identity" ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0b0815] p-6 lg:col-span-7">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-base font-semibold text-white">
                      {t.formTitle}
                    </h3>
                    <button
                      type="button"
                      onClick={() => void persistRegistry(registry)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:opacity-90"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{t.saveNow}</span>
                    </button>
                  </div>

                  {/* Kind & Accent */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.kindLabel}
                      </label>
                      <div className="flex gap-2">
                        {(
                          [
                            { id: "COLLECTION", label: t.kindCollection },
                            { id: "PACKAGE", label: t.kindPackage },
                          ] as const
                        ).map((k) => (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() =>
                              updateSinglePackage(selectedPkg.id, { kind: k.id }, true)
                            }
                            className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${
                              selectedPkg.kind === k.id
                                ? "bg-white text-black"
                                : "border border-white/15 bg-black/50 text-white/75"
                            }`}
                          >
                            {k.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.accentLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedPkg.accentColor}
                          onChange={(e) =>
                            updateSinglePackage(selectedPkg.id, {
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 w-12 cursor-pointer rounded-xl border border-white/15 bg-transparent"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={selectedPkg.accentColor}
                          onChange={(e) =>
                            updateSinglePackage(selectedPkg.id, {
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.nameLabel}
                      </label>
                      <input
                        type="text"
                        dir="auto"
                        value={selectedPkg.name}
                        onChange={(e) =>
                          updateSinglePackage(selectedPkg.id, { name: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm font-semibold text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.slugLabel}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedPkg.slug}
                        onChange={(e) =>
                          updateSinglePackage(selectedPkg.id, {
                            slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/75">
                      {t.taglineLabel}
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={selectedPkg.tagline}
                      onChange={(e) =>
                        updateSinglePackage(selectedPkg.id, { tagline: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/75">
                      {t.descriptionLabel}
                    </label>
                    <textarea
                      rows={3}
                      dir="auto"
                      value={selectedPkg.description}
                      onChange={(e) =>
                        updateSinglePackage(selectedPkg.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.badgeLabel}
                      </label>
                      <input
                        type="text"
                        dir="auto"
                        value={selectedPkg.badgeLabel}
                        onChange={(e) =>
                          updateSinglePackage(selectedPkg.id, {
                            badgeLabel: e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.ctaLabel}
                      </label>
                      <input
                        type="text"
                        dir="auto"
                        value={selectedPkg.ctaLabel}
                        onChange={(e) =>
                          updateSinglePackage(selectedPkg.id, {
                            ctaLabel: e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.universeTagLabel}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedPkg.universeSlug ?? ""}
                        onChange={(e) =>
                          updateSinglePackage(selectedPkg.id, {
                            universeSlug: e.target.value.trim() || null,
                          })
                        }
                        placeholder="cars / gaming / anime"
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Pricing Mode */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <label className="block text-xs font-semibold text-white">
                      {t.pricingModeLabel}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: "FIXED_PRICE", label: t.modeFixed },
                          { id: "COLLECTION_SHOWCASE", label: t.modeShowcase },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            updateSinglePackage(
                              selectedPkg.id,
                              {
                                pricingMode: m.id,
                                finalPrice:
                                  m.id === "FIXED_PRICE"
                                    ? selectedPkg.finalPrice ?? 2190
                                    : null,
                              },
                              true
                            )
                          }
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                            selectedPkg.pricingMode === m.id
                              ? "bg-white text-black"
                              : "border border-white/15 bg-white/5 text-white/75"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {selectedPkg.pricingMode === "FIXED_PRICE" ? (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="mb-1 block text-[11px] text-white/65">
                            {t.finalPriceLabel}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={selectedPkg.finalPrice ?? 0}
                            onChange={(e) =>
                              updateSinglePackage(selectedPkg.id, {
                                finalPrice: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] text-white/65">
                            {t.originalPriceLabel}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={selectedPkg.originalPrice ?? ""}
                            onChange={(e) =>
                              updateSinglePackage(selectedPkg.id, {
                                originalPrice: e.target.value
                                  ? Math.max(0, Number(e.target.value))
                                  : null,
                              })
                            }
                            className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Outer Banner Image */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {t.bannerImgTitle}
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>{t.uploadImg}</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            handleImageUpload(f, (url) =>
                              updateSinglePackage(
                                selectedPkg.id,
                                {
                                  bannerImageUrl: url,
                                  heroImageUrl: selectedPkg.heroImageUrl || url,
                                },
                                true
                              )
                            );
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      dir="ltr"
                      value={selectedPkg.bannerImageUrl}
                      onChange={(e) =>
                        updateSinglePackage(selectedPkg.id, {
                          bannerImageUrl: e.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-1.5">
                        {(
                          [
                            { id: "cover", label: t.fitCover },
                            { id: "contain", label: t.fitContain },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() =>
                              updateSinglePackage(
                                selectedPkg.id,
                                { bannerImageFit: f.id },
                                true
                              )
                            }
                            className={`flex-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold ${
                              selectedPkg.bannerImageFit === f.id
                                ? "bg-white text-black"
                                : "border border-white/15 bg-white/5 text-white/75"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-1.5">
                        {(
                          [
                            { id: "top", label: t.posTop },
                            { id: "center", label: t.posCenter },
                            { id: "bottom", label: t.posBottom },
                          ] as const
                        ).map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() =>
                              updateSinglePackage(
                                selectedPkg.id,
                                { bannerImagePosition: pos.id },
                                true
                              )
                            }
                            className={`flex-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold ${
                              selectedPkg.bannerImagePosition === pos.id
                                ? "bg-white text-black"
                                : "border border-white/15 bg-white/5 text-white/75"
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Large Detail Page Top Hero Image */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {t.heroImgTitle}
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>{t.uploadImg}</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            handleImageUpload(f, (url) =>
                              updateSinglePackage(
                                selectedPkg.id,
                                { heroImageUrl: url },
                                true
                              )
                            );
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={selectedPkg.heroImageUrl}
                      onChange={(e) =>
                        updateSinglePackage(selectedPkg.id, {
                          heroImageUrl: e.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                    />
                    <p className="text-[11px] text-white/50">{t.imgHint}</p>
                    {imgErr ? <p className="text-xs text-red-300">{imgErr}</p> : null}
                  </div>

                  {/* Extra Details / Specs */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {t.specsTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSinglePackage(selectedPkg.id, {
                            specs: [
                              ...selectedPkg.specs,
                              { id: generateClientId("pspec"), label: "", value: "" },
                            ],
                          })
                        }
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/20"
                      >
                        {t.addSpec}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedPkg.specs.map((sp) => (
                        <div key={sp.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            dir="auto"
                            value={sp.label}
                            placeholder={t.specKey}
                            onChange={(e) =>
                              updateSinglePackage(selectedPkg.id, {
                                specs: selectedPkg.specs.map((s) =>
                                  s.id === sp.id ? { ...s, label: e.target.value } : s
                                ),
                              })
                            }
                            className="h-9 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                          />
                          <input
                            type="text"
                            dir="auto"
                            value={sp.value}
                            placeholder={t.specVal}
                            onChange={(e) =>
                              updateSinglePackage(selectedPkg.id, {
                                specs: selectedPkg.specs.map((s) =>
                                  s.id === sp.id ? { ...s, value: e.target.value } : s
                                ),
                              })
                            }
                            className="h-9 flex-[1.5] rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSinglePackage(
                                selectedPkg.id,
                                {
                                  specs: selectedPkg.specs.filter((s) => s.id !== sp.id),
                                },
                                true
                              )
                            }
                            className="rounded-xl border border-red-500/25 bg-red-500/10 p-2 text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/85">
                      <input
                        type="checkbox"
                        checked={selectedPkg.showProductsInside}
                        onChange={(e) =>
                          updateSinglePackage(
                            selectedPkg.id,
                            { showProductsInside: e.target.checked },
                            true
                          )
                        }
                        className="h-4 w-4 rounded accent-white"
                      />
                      <span>{t.showProductsToggle}</span>
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/85">
                      <input
                        type="checkbox"
                        checked={selectedPkg.showAddPackBtn}
                        onChange={(e) =>
                          updateSinglePackage(
                            selectedPkg.id,
                            { showAddPackBtn: e.target.checked },
                            true
                          )
                        }
                        className="h-4 w-4 rounded accent-white"
                      />
                      <span>{t.showBtnToggle}</span>
                    </label>
                  </div>
                </div>

                {/* Previews */}
                <div className="space-y-4 lg:col-span-5">
                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/65">
                      {t.previewOuter}
                    </p>
                    <StorefrontPackageBannerCard
                      pkg={selectedPkg}
                      pausedLabel={t.pausedLabel}
                    />
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/65">
                      {t.previewHero}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#06040b]">
                      <div
                        className="relative h-44 w-full overflow-hidden"
                        style={{
                          background: `radial-gradient(circle at 50% 35%, ${selectedPkg.accentColor}40 0%, #06040b 85%)`,
                        }}
                      >
                        {selectedPkg.heroImageUrl || selectedPkg.bannerImageUrl ? (
                          <img
                            src={resolveImgSrc(
                              selectedPkg.heroImageUrl || selectedPkg.bannerImageUrl
                            )}
                            alt=""
                            className="h-full w-full object-cover opacity-85"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06040b] via-transparent to-transparent" />
                      </div>
                      <div className="p-4">
                        <h4 dir="auto" className="font-serif text-lg font-semibold text-white">
                          {selectedPkg.name}
                        </h4>
                        <p dir="auto" className="mt-1 text-xs text-white/70">
                          {selectedPkg.tagline}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------
                 TAB 2: READ-ONLY PRODUCT ASSIGNMENT (NO COLOR FILTERS)
                 ------------------------------------------------------------ */
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-4">
                  <p className="text-xs leading-relaxed text-white/75">
                    {t.productsNotice}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: "all", label: `${t.allFilter} (${siteProducts.length})` },
                          {
                            id: "assigned",
                            label: `${t.assignedOnly} (${selectedPkg.productIds.length})`,
                          },
                          {
                            id: "unassigned",
                            label: `${t.unassignedOnly} (${Math.max(
                              0,
                              siteProducts.length - selectedPkg.productIds.length
                            )})`,
                          },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setAssignFilter(f.id)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                            assignFilter === f.id
                              ? "bg-white text-black"
                              : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={t.searchProducts}
                        className="h-9 w-56 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-10 text-center text-sm text-white/60">
                    {t.noItems}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredProducts.map((prod) => {
                      const isSelected = selectedPkg.productIds.includes(prod.id);
                      const otherNames = registry.packages
                        .filter(
                          (p) =>
                            p.id !== selectedPkg.id && p.productIds.includes(prod.id)
                        )
                        .map((p) => p.name);
                      const thumb = resolveImgSrc(prod.cardImageUrl);

                      return (
                        <div
                          key={prod.id}
                          className={`flex flex-col overflow-hidden rounded-2xl border transition-all ${
                            isSelected
                              ? "border-emerald-400/70 ring-1 ring-emerald-400/35"
                              : "border-[var(--color-border-subtle)]"
                          } bg-[var(--color-surface-card)]`}
                        >
                          <div
                            className="relative flex h-48 items-start justify-between overflow-hidden p-3.5"
                            style={{
                              background: `radial-gradient(circle at 50% 35%, ${prod.accentColor}30 0%, #07050c 82%)`,
                            }}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={prod.name}
                                className={
                                  prod.cardImageFit === "contain"
                                    ? "pointer-events-none mx-auto my-auto max-h-36 object-contain"
                                    : "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
                                }
                              />
                            ) : null}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />
                            <span className="relative z-10 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
                              {prod.universeSlug}
                            </span>
                            <span
                              className="relative z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-white"
                              style={{ backgroundColor: prod.accentColor }}
                            >
                              {prod.isVaulted || prod.stock <= 0
                                ? "Vaulted"
                                : prod.badgeLabel}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-4">
                            <div>
                              <h3 className="line-clamp-1 text-sm font-semibold text-white">
                                {prod.name}
                              </h3>
                              <p className="mt-1 line-clamp-1 text-xs text-white/60">
                                {prod.subtitle}
                              </p>
                              <p className="mt-2 text-sm font-bold text-white">
                                {formatEgp(prod.basePrice)}
                              </p>
                            </div>

                            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                              {otherNames.length > 0 ? (
                                <p className="truncate text-[11px] text-white/55">
                                  {t.alsoIn}: {otherNames.join(" • ")}
                                </p>
                              ) : null}
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleProduct(selectedPkg.id, prod.id)
                                }
                                className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                  isSelected
                                    ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                                    : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/15"
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                                <span>
                                  {isSelected ? t.selectedInPack : t.addToPack}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b0815] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-semibold text-white">
                {t.newModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-white/15 p-1.5 text-white/70 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="flex gap-2">
                {(
                  [
                    { id: "COLLECTION", label: t.kindCollection },
                    { id: "PACKAGE", label: t.kindPackage },
                  ] as const
                ).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setNewKind(k.id)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${
                      newKind === k.id
                        ? "bg-white text-black"
                        : "border border-white/15 bg-black/50 text-white/75"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    dir="auto"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.slugLabel}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="midnight-collection"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">
                  {t.taglineLabel}
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.accentLabel}
                  </label>
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-xl border border-white/15 bg-transparent"
                  />
                </div>
                {newKind === "PACKAGE" ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      {t.finalPriceLabel}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-end">
                    <span className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-[11px] text-white/65">
                      {t.modeShowcase}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">
                  {t.bannerImgTitle}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={newBanner}
                    onChange={(e) => setNewBanner(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                  />
                  <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 text-xs font-bold text-amber-200">
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>{t.uploadImg}</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        handleImageUpload(f, (url) => setNewBanner(url));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-full bg-amber-500 px-5 text-xs font-bold text-black hover:bg-amber-400"
                >
                  {t.createBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
