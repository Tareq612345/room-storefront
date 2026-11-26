/**
 * @file src/modules/product-organizer/components/ProductOrganizerClient.tsx
 * @purpose Isolated Admin Product Organizer (/admin/products/): manages outer container/banner styling + uploaded image framing and inner product page content & layout.
 */

"use client";

import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Languages,
  LayoutTemplate,
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
  fetchProductOrganizerSnapshot,
  saveIsolatedProductRegistry,
} from "../client-api";
import {
  PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY,
  buildDefaultSpecs,
  getProductHref,
  slugifyProductName,
} from "../helpers";
import {
  OrganizedProductSchema,
  ProductRegistrySchema,
  type OrganizedProduct,
  type ProductRegistry,
} from "../schema";
import { StorefrontProductBannerCard } from "./StorefrontProductBannerCard";

type Lang = "ar" | "en";
type DetailTab = "outer" | "inner";
type StatusFilter = "all" | "active" | "paused";

interface ProductOrganizerClientProps {
  initialStoreId: string;
  initialRegistry: ProductRegistry;
  initialHasPersistedRecord: boolean;
}

const COPY = {
  ar: {
    brand: "منظم المنتجات",
    isolatedBadge: "نظام معزول بالكود والداتا",
    backToAdmin: "لوحة الإدارة",
    addProduct: "إضافة منتج جديد",
    saveNow: "حفظ التعديلات",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ في الداتا المعزولة",
    saveError: "تعذر الحفظ في Supabase (محفوظ محلياً)",
    allFilter: "الكل",
    activeFilter: "المفعّلة",
    pausedFilter: "المعطّلة مؤقتاً",
    searchProducts: "ابحث عن منتج...",
    pausedLabel: "معطل مؤقتاً",
    activeLabel: "مفعّل",
    enterEdit: "تخصيص الشكل والمحتوى",
    previewInner: "معاينة الصفحة الداخلية",
    pauseBtn: "تعطيل مؤقت",
    enableBtn: "تفعيل",
    deleteBtn: "حذف",
    confirmDelete: "تأكيد الحذف؟",
    cancel: "إلغاء",
    backToList: "العودة لقائمة المنتجات",
    tabs: {
      outer: "1. الكونتينر والشكل الخارجي",
      inner: "2. محتوى وشكل الصفحة الداخلية",
    },
    outerTitle: "تعديل البانر والكونتينر الخارجي للمنتج",
    nameLabel: "اسم المنتج",
    subtitleLabel: "السطر المختصر تحت الاسم",
    slugLabel: "المعرّف (Slug)",
    universeTagLabel: "شارة القسم (Slug)",
    badgeLabel: "شارة البانر (مثال: Fresh Drop)",
    priceLabel: "السعر (EGP)",
    comparePriceLabel: "السعر قبل الخصم (اختياري)",
    stockLabel: "المخزون",
    vaultedToggle: "تحديد كـ Vaulted (نفد المخزون)",
    accentLabel: "لون الكارت والزر",
    bannerImageTitle: "صورة البانر وتنسيق مكانها",
    uploadImage: "تحميل صورة",
    imageUrlPlaceholder: "أو ضع رابط/مسار الصورة...",
    imageFitLabel: "طريقة عرض الصورة في البانر",
    fitCover: "تعبئة كاملة (Cover)",
    fitContain: "إطار متزن بدون قص (Contain)",
    imagePosLabel: "تموضع الصورة",
    posTop: "أعلى",
    posCenter: "وسط",
    posBottom: "أسفل",
    imageHint: "PNG / JPG / WEBP بحد أقصى 400KB — تم تنسيقها لتظهر بوضوح دون تداخل مع الشارات.",
    imageErrType: "من فضلك اختر صورة PNG أو JPG أو WEBP فقط.",
    imageErrSize: "حجم الصورة يجب ألا يتجاوز 400 كيلوبايت.",
    outerPreviewTitle: "المعاينة المباشرة للكونتينر الخارجي",
    innerTitle: "تخصيص صفحة المنتج الداخلية (شكل مبدئي قابل للتطوير)",
    layoutLabel: "تخطيط الصفحة الداخلية",
    layoutSplit: "معرض جانبي + تفاصيل (Split Gallery)",
    layoutCinema: "بانر سينمائي علوي + تفاصيل (Cinema Hero)",
    galleryLabel: "صور المعرض داخل الصفحة",
    addGalleryImage: "رفع صورة للمعرض",
    addGalleryUrl: "إضافة رابط صورة",
    descriptionLabel: "الوصف الكامل للمنتج",
    specsLabel: "التفاصيل والمواصفات (جدول المواصفات)",
    addSpec: "+ إضافة تفصيلة",
    specKeyPlaceholder: "العنوان (مثل: الخامة)",
    specValPlaceholder: "القيمة (مثل: قطن 300TC)",
    showSpecsLabel: "عرض جدول المواصفات",
    showBuyNowLabel: "عرض زر الشراء المباشر (Buy Now)",
    addBtnLabel: "نص زر الإضافة للسلة",
    buyBtnLabel: "نص زر الشراء المباشر",
    noProducts: "لا توجد منتجات مطابقة للبحث.",
    newModalTitle: "إضافة منتج جديد بداتا نظيفة منفصلة",
    createAndOpen: "إنشاء وتخصيص",
  },
  en: {
    brand: "Product Organizer",
    isolatedBadge: "Isolated Code & Data",
    backToAdmin: "Admin Portal",
    addProduct: "Add Product",
    saveNow: "Save Changes",
    saving: "Saving...",
    saved: "Saved to Isolated Data",
    saveError: "Supabase save failed (cached locally)",
    allFilter: "All",
    activeFilter: "Active",
    pausedFilter: "Paused",
    searchProducts: "Search products...",
    pausedLabel: "Paused",
    activeLabel: "Active",
    enterEdit: "Customize Outer & Inner",
    previewInner: "Preview Inner Page",
    pauseBtn: "Pause",
    enableBtn: "Enable",
    deleteBtn: "Delete",
    confirmDelete: "Confirm delete?",
    cancel: "Cancel",
    backToList: "Back to Products",
    tabs: {
      outer: "1. Outer Card & Banner",
      inner: "2. Inner Product Page",
    },
    outerTitle: "Edit Outer Product Container & Banner",
    nameLabel: "Product Name",
    subtitleLabel: "1-Line Subtitle",
    slugLabel: "Slug",
    universeTagLabel: "Universe Tag (Slug)",
    badgeLabel: "Banner Badge (e.g. Fresh Drop)",
    priceLabel: "Price (EGP)",
    comparePriceLabel: "Compare-at Price (Optional)",
    stockLabel: "Stock",
    vaultedToggle: "Mark as Vaulted (Out of Stock)",
    accentLabel: "Card & Button Accent Color",
    bannerImageTitle: "Banner Image & Placement",
    uploadImage: "Upload Image",
    imageUrlPlaceholder: "Or paste image URL / path...",
    imageFitLabel: "Image Framing in Banner",
    fitCover: "Full Bleed (Cover)",
    fitContain: "Framed Fit (Contain)",
    imagePosLabel: "Image Position",
    posTop: "Top",
    posCenter: "Center",
    posBottom: "Bottom",
    imageHint: "PNG / JPG / WEBP up to 400KB — framed cleanly below top badges.",
    imageErrType: "Please select a PNG, JPG, or WEBP image.",
    imageErrSize: "Image file size must be 400KB or smaller.",
    outerPreviewTitle: "Live Outer Card Preview",
    innerTitle: "Inner Product Page Content & Layout (Preliminary)",
    layoutLabel: "Inner Page Layout",
    layoutSplit: "Split Gallery + Details",
    layoutCinema: "Cinema Hero + Details",
    galleryLabel: "Inner Page Gallery Images",
    addGalleryImage: "Upload Gallery Image",
    addGalleryUrl: "Add Image URL",
    descriptionLabel: "Full Product Description",
    specsLabel: "Product Details & Specifications",
    addSpec: "+ Add Detail Row",
    specKeyPlaceholder: "Label (e.g. Material)",
    specValPlaceholder: "Value (e.g. 300TC Matte Cotton)",
    showSpecsLabel: "Show Specifications Grid",
    showBuyNowLabel: "Show Direct Buy Now Button",
    addBtnLabel: "Add to Bag Button Text",
    buyBtnLabel: "Buy Now Button Text",
    noProducts: "No matching products found.",
    newModalTitle: "Create New Product with Clean Isolated Data",
    createAndOpen: "Create & Customize",
  },
} as const;

export function ProductOrganizerClient({
  initialStoreId,
  initialRegistry,
  initialHasPersistedRecord,
}: ProductOrganizerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];

  const [storeId, setStoreId] = useState(initialStoreId);
  const [registry, setRegistry] = useState<ProductRegistry>(initialRegistry);
  const [recordExistsInDb, setRecordExistsInDb] = useState(initialHasPersistedRecord);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("outer");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPrice, setNewPrice] = useState(1450);
  const [newStock, setNewStock] = useState(12);
  const [newColor, setNewColor] = useState("#c94b99");
  const [newCardImg, setNewCardImg] = useState("/mockups/products/sheet-neo-tokyo.svg");
  const [newImgErr, setNewImgErr] = useState<string | null>(null);

  const persistRegistry = async (
    nextRegistry: ProductRegistry,
    targetStoreId = storeId,
    exists = recordExistsInDb
  ) => {
    setSaveState("saving");
    try {
      await saveIsolatedProductRegistry({
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
        const snapshot = await fetchProductOrganizerSnapshot();
        if (!active) return;

        setStoreId(snapshot.storeId);
        setRegistry(snapshot.registry);
        setRecordExistsInDb(snapshot.recordExistsInDb);

        if (!snapshot.recordExistsInDb) {
          await persistRegistry(snapshot.registry, snapshot.storeId, false);
        }
      } catch {
        try {
          const cachedRaw = localStorage.getItem(PRODUCT_ORGANIZER_LOCAL_STORAGE_KEY);
          if (cachedRaw && active) {
            const parsed = ProductRegistrySchema.safeParse(JSON.parse(cachedRaw));
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

  const selectedProduct = useMemo(
    () => registry.products.find((p) => p.id === selectedProductId) ?? null,
    [registry.products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registry.products
      .filter((p) => {
        if (statusFilter === "active" && !p.isActive) return false;
        if (statusFilter === "paused" && p.isActive) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [registry.products, statusFilter, searchQuery]);

  const updateRegistry = (
    updater: (prev: ProductRegistry) => ProductRegistry,
    autoSave = true
  ) => {
    const next = updater(registry);
    const stamped: ProductRegistry = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    setRegistry(stamped);
    if (autoSave) {
      void persistRegistry(stamped);
    }
  };

  const updateSingleProduct = (
    productId: string,
    patch: Partial<OrganizedProduct>,
    autoSave = false
  ) => {
    const now = new Date().toISOString();
    updateRegistry(
      (prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, ...patch, updatedAt: now } : p
        ),
      }),
      autoSave
    );
  };

  const handleImageUpload = (
    file: File | undefined,
    onSuccess: (dataUrl: string) => void,
    onError: (msg: string) => void
  ) => {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    const extOk = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extOk) {
      onError(t.imageErrType);
      return;
    }
    if (file.size > 400 * 1024) {
      onError(t.imageErrSize);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onError("");
        onSuccess(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProduct = (productId: string) => {
    updateRegistry(
      (prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== productId),
      }),
      true
    );
    setConfirmDeleteId(null);
    if (selectedProductId === productId) setSelectedProductId(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim() || "New ROOM Product";
    const baseSlug = slugifyProductName(newSlug.trim() || cleanName);
    const slugTaken = registry.products.some((p) => p.slug === baseSlug);
    const uniqueSlug = slugTaken
      ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      : baseSlug;

    const now = new Date().toISOString();
    const created = OrganizedProductSchema.parse({
      id: generateClientId("porg"),
      slug: uniqueSlug,
      name: cleanName,
      subtitle: newSubtitle.trim(),
      badgeLabel: "Fresh Drop",
      basePrice: Math.max(0, Number(newPrice) || 0),
      compareAtPrice: null,
      stock: Math.max(0, Number(newStock) || 0),
      isVaulted: Number(newStock) <= 0,
      accentColor: newColor,
      universeSlug: "cars",
      cardImageUrl: newCardImg,
      cardImageFit: "cover",
      cardImagePosition: "center",
      isNewArrival: true,
      isFeatured: true,
      isActive: true,
      sortOrder: registry.products.length + 1,
      galleryImages: newCardImg ? [newCardImg] : [],
      description: `${cleanName} — ${newSubtitle.trim() || "Limited dark-mode ROOM drop."}`,
      specs: buildDefaultSpecs(newSubtitle),
      detailLayout: "split-gallery",
      showSpecsGrid: true,
      showBuyNowBtn: true,
      addToBagLabel: "Claim Yours",
      buyNowLabel: "Buy Now",
      createdAt: now,
      updatedAt: now,
    });

    updateRegistry(
      (prev) => ({
        ...prev,
        products: [created, ...prev.products],
      }),
      true
    );

    setShowCreateModal(false);
    setNewName("");
    setNewSubtitle("");
    setNewSlug("");
    setNewPrice(1450);
    setNewStock(12);
    setNewColor("#c94b99");
    setNewCardImg("/mockups/products/sheet-neo-tokyo.svg");
    setNewImgErr(null);
    setSelectedProductId(created.id);
    setDetailTab("outer");
  };

  const activeCount = registry.products.filter((p) => p.isActive).length;
  const pausedCount = registry.products.length - activeCount;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#040308] text-white"
    >
      {/* Top Bar */}
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/35 bg-indigo-500/15">
                <Package className="h-4 w-4 text-indigo-300" />
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
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black transition-opacity hover:opacity-90"
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
        {!selectedProduct ? (
          /* ============================================================
             LIST VIEW: ALL PRODUCTS IN OUTER STOREFRONT CARD APPEARANCE
             ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all", label: `${t.allFilter} (${registry.products.length})` },
                    { id: "active", label: `${t.activeFilter} (${activeCount})` },
                    { id: "paused", label: `${t.pausedFilter} (${pausedCount})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      statusFilter === pill.id
                        ? "bg-white text-black"
                        : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {pill.label}
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
                    placeholder={t.searchProducts}
                    className="h-10 w-56 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo-500 px-5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-transform hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addProduct}</span>
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-12 text-center text-sm text-white/60">
                {t.noProducts}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#090712] p-3"
                  >
                    <StorefrontProductBannerCard
                      product={product}
                      pausedLabel={t.pausedLabel}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setDetailTab("outer");
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setDetailTab("outer");
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-white/20"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{t.enterEdit}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Link
                          href={getProductHref(product.slug)}
                          title={t.previewInner}
                          className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 p-1.5 text-white/80 hover:bg-white/15"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            updateSingleProduct(
                              product.id,
                              { isActive: !product.isActive },
                              true
                            )
                          }
                          title={product.isActive ? t.pauseBtn : t.enableBtn}
                          className={`inline-flex items-center rounded-xl p-1.5 ${
                            product.isActive
                              ? "border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                              : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                          }`}
                        >
                          {product.isActive ? (
                            <PauseCircle className="h-3.5 w-3.5" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {confirmDeleteId === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="rounded-xl bg-red-600 px-2 py-1 text-[10px] font-bold text-white"
                            >
                              {t.confirmDelete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-xl border border-white/15 px-1.5 py-1 text-[10px] text-white/70"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(product.id)}
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
             DETAIL VIEW: 2 TABS (OUTER CONTAINER vs INNER PRODUCT PAGE)
             ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(null);
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
                    {selectedProduct.name}
                  </h2>
                  <p className="font-mono text-[11px] text-white/50" dir="ltr">
                    {getProductHref(selectedProduct.slug)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={getProductHref(selectedProduct.slug)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{t.previewInner}</span>
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    updateSingleProduct(
                      selectedProduct.id,
                      { isActive: !selectedProduct.isActive },
                      true
                    )
                  }
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold ${
                    selectedProduct.isActive
                      ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                      : "border border-amber-400/35 bg-amber-500/15 text-amber-200"
                  }`}
                >
                  {selectedProduct.isActive ? (
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

                {confirmDeleteId === selectedProduct.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                      className="h-9 rounded-full bg-red-600 px-4 text-xs font-bold text-white"
                    >
                      {t.confirmDelete}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="h-9 rounded-full border border-white/15 px-3 text-xs text-white/75"
                    >
                      {t.cancel}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(selectedProduct.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.deleteBtn}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2 Tabs */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "outer", label: t.tabs.outer, icon: <Sparkles className="h-4 w-4" /> },
                  { id: "inner", label: t.tabs.inner, icon: <LayoutTemplate className="h-4 w-4" /> },
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

            {/* ------------------------------------------------------------
                TAB 1: OUTER CONTAINER / BANNER + UPLOADED IMAGE PLACEMENT
               ------------------------------------------------------------ */}
            {detailTab === "outer" ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0b0815] p-6 lg:col-span-7">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-base font-semibold text-white">
                      {t.outerTitle}
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.nameLabel}
                      </label>
                      <input
                        type="text"
                        dir="auto"
                        value={selectedProduct.name}
                        onChange={(e) =>
                          updateSingleProduct(selectedProduct.id, { name: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm font-semibold text-white focus:border-white/45 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.slugLabel}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedProduct.slug}
                        onChange={(e) =>
                          updateSingleProduct(selectedProduct.id, {
                            slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white/85 focus:border-white/45 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/75">
                      {t.subtitleLabel}
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={selectedProduct.subtitle}
                      onChange={(e) =>
                        updateSingleProduct(selectedProduct.id, { subtitle: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white/90 focus:border-white/45 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.priceLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={selectedProduct.basePrice}
                        onChange={(e) =>
                          updateSingleProduct(selectedProduct.id, {
                            basePrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.comparePriceLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={selectedProduct.compareAtPrice ?? ""}
                        onChange={(e) =>
                          updateSingleProduct(selectedProduct.id, {
                            compareAtPrice: e.target.value
                              ? Math.max(0, Number(e.target.value))
                              : null,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.stockLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={selectedProduct.stock}
                        onChange={(e) => {
                          const s = Math.max(0, Number(e.target.value) || 0);
                          updateSingleProduct(selectedProduct.id, {
                            stock: s,
                            isVaulted: s <= 0,
                          });
                        }}
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.universeTagLabel}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedProduct.universeSlug}
                        onChange={(e) =>
                          updateSingleProduct(selectedProduct.id, {
                            universeSlug: e.target.value.trim() || "cars",
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.badgeLabel}
                      </label>
                      <input
                        type="text"
                        dir="auto"
                        value={selectedProduct.badgeLabel}
                        onChange={(e) =>
                          updateSingleProduct(selectedProduct.id, {
                            badgeLabel: e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.accentLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedProduct.accentColor}
                          onChange={(e) =>
                            updateSingleProduct(selectedProduct.id, {
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 w-12 cursor-pointer rounded-xl border border-white/15 bg-transparent"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={selectedProduct.accentColor}
                          onChange={(e) =>
                            updateSingleProduct(selectedProduct.id, {
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-2.5 font-mono text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner Image Upload + Clean Placement Controls */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {t.bannerImageTitle}
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>{t.uploadImage}</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageUpload(
                              file,
                              (dataUrl) =>
                                updateSingleProduct(
                                  selectedProduct.id,
                                  {
                                    cardImageUrl: dataUrl,
                                    galleryImages: selectedProduct.galleryImages.includes(
                                      dataUrl
                                    )
                                      ? selectedProduct.galleryImages
                                      : [dataUrl, ...selectedProduct.galleryImages],
                                  },
                                  true
                                ),
                              (msg) => setImageError(msg || null)
                            );
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      dir="ltr"
                      value={selectedProduct.cardImageUrl}
                      onChange={(e) =>
                        updateSingleProduct(selectedProduct.id, {
                          cardImageUrl: e.target.value,
                        })
                      }
                      placeholder={t.imageUrlPlaceholder}
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white/80 focus:border-white/45 focus:outline-none"
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-white/60">
                          {t.imageFitLabel}
                        </label>
                        <div className="flex gap-1.5">
                          {(
                            [
                              { id: "cover", label: t.fitCover },
                              { id: "contain", label: t.fitContain },
                            ] as const
                          ).map((fit) => (
                            <button
                              key={fit.id}
                              type="button"
                              onClick={() =>
                                updateSingleProduct(
                                  selectedProduct.id,
                                  { cardImageFit: fit.id },
                                  true
                                )
                              }
                              className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold ${
                                selectedProduct.cardImageFit === fit.id
                                  ? "bg-white text-black"
                                  : "border border-white/15 bg-white/5 text-white/75"
                              }`}
                            >
                              {fit.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] text-white/60">
                          {t.imagePosLabel}
                        </label>
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
                                updateSingleProduct(
                                  selectedProduct.id,
                                  { cardImagePosition: pos.id },
                                  true
                                )
                              }
                              className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold ${
                                selectedProduct.cardImagePosition === pos.id
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

                    <p className="text-[11px] text-white/50">{t.imageHint}</p>
                    {imageError ? (
                      <p className="text-xs text-red-300">{imageError}</p>
                    ) : null}
                  </div>
                </div>

                {/* Live Outer Card Preview */}
                <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-6 lg:col-span-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/65">
                    {t.outerPreviewTitle}
                  </p>
                  <div className="mx-auto max-w-sm">
                    <StorefrontProductBannerCard
                      product={selectedProduct}
                      pausedLabel={t.pausedLabel}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* ------------------------------------------------------------
                TAB 2: INNER PRODUCT PAGE CONTENT & LAYOUT
               ------------------------------------------------------------ */}
            {detailTab === "inner" ? (
              <div className="space-y-6 rounded-3xl border border-white/10 bg-[#0b0815] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-base font-semibold text-white">
                    {t.innerTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Link
                      href={getProductHref(selectedProduct.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{t.previewInner}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void persistRegistry(registry)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:opacity-90"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{t.saveNow}</span>
                    </button>
                  </div>
                </div>

                {/* Layout Selection */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/75">
                    {t.layoutLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "split-gallery", label: t.layoutSplit },
                        { id: "cinema-hero", label: t.layoutCinema },
                      ] as const
                    ).map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() =>
                          updateSingleProduct(
                            selectedProduct.id,
                            { detailLayout: l.id },
                            true
                          )
                        }
                        className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${
                          selectedProduct.detailLayout === l.id
                            ? "bg-white text-black"
                            : "border border-white/15 bg-black/50 text-white/75"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">
                      {t.galleryLabel} ({selectedProduct.galleryImages.length})
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25">
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>{t.addGalleryImage}</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageUpload(
                            file,
                            (dataUrl) =>
                              updateSingleProduct(
                                selectedProduct.id,
                                {
                                  galleryImages: [
                                    ...selectedProduct.galleryImages,
                                    dataUrl,
                                  ],
                                },
                                true
                              ),
                            (msg) => setImageError(msg || null)
                          );
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={galleryUrlDraft}
                      onChange={(e) => setGalleryUrlDraft(e.target.value)}
                      placeholder="/mockups/products/sheet-neo-tokyo.svg"
                      className="h-9 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!galleryUrlDraft.trim()) return;
                        updateSingleProduct(
                          selectedProduct.id,
                          {
                            galleryImages: [
                              ...selectedProduct.galleryImages,
                              galleryUrlDraft.trim(),
                            ],
                          },
                          true
                        );
                        setGalleryUrlDraft("");
                      }}
                      className="h-9 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20"
                    >
                      {t.addGalleryUrl}
                    </button>
                  </div>

                  {selectedProduct.galleryImages.length > 0 ? (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {selectedProduct.galleryImages.map((img, idx) => (
                        <div
                          key={`${img.slice(0, 28)}_${idx}`}
                          className="group relative h-24 w-28 overflow-hidden rounded-2xl border border-white/15 bg-black/60"
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSingleProduct(
                                selectedProduct.id,
                                {
                                  galleryImages: selectedProduct.galleryImages.filter(
                                    (_, i) => i !== idx
                                  ),
                                },
                                true
                              )
                            }
                            className="absolute right-1.5 top-1.5 rounded-full bg-black/80 p-1 text-red-300 hover:bg-red-600 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Full Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/75">
                    {t.descriptionLabel}
                  </label>
                  <textarea
                    rows={4}
                    dir="auto"
                    value={selectedProduct.description}
                    onChange={(e) =>
                      updateSingleProduct(selectedProduct.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/60 p-3.5 text-xs leading-relaxed text-white focus:border-white/45 focus:outline-none"
                  />
                </div>

                {/* Specs / Details Builder */}
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">
                      {t.specsLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateSingleProduct(
                          selectedProduct.id,
                          {
                            specs: [
                              ...selectedProduct.specs,
                              {
                                id: generateClientId("spec"),
                                label: "",
                                value: "",
                              },
                            ],
                          },
                          false
                        )
                      }
                      className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                    >
                      {t.addSpec}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedProduct.specs.map((spec) => (
                      <div key={spec.id} className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          dir="auto"
                          value={spec.label}
                          placeholder={t.specKeyPlaceholder}
                          onChange={(e) =>
                            updateSingleProduct(selectedProduct.id, {
                              specs: selectedProduct.specs.map((s) =>
                                s.id === spec.id ? { ...s, label: e.target.value } : s
                              ),
                            })
                          }
                          className="h-9 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                        />
                        <input
                          type="text"
                          dir="auto"
                          value={spec.value}
                          placeholder={t.specValPlaceholder}
                          onChange={(e) =>
                            updateSingleProduct(selectedProduct.id, {
                              specs: selectedProduct.specs.map((s) =>
                                s.id === spec.id ? { ...s, value: e.target.value } : s
                              ),
                            })
                          }
                          className="h-9 flex-[1.5] rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateSingleProduct(
                              selectedProduct.id,
                              {
                                specs: selectedProduct.specs.filter(
                                  (s) => s.id !== spec.id
                                ),
                              },
                              true
                            )
                          }
                          className="rounded-xl border border-red-500/25 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inner Actions & Toggles */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/75">
                      {t.addBtnLabel}
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={selectedProduct.addToBagLabel}
                      onChange={(e) =>
                        updateSingleProduct(selectedProduct.id, {
                          addToBagLabel: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/75">
                      {t.buyBtnLabel}
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={selectedProduct.buyNowLabel}
                      onChange={(e) =>
                        updateSingleProduct(selectedProduct.id, {
                          buyNowLabel: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/85">
                    <input
                      type="checkbox"
                      checked={selectedProduct.showSpecsGrid}
                      onChange={(e) =>
                        updateSingleProduct(
                          selectedProduct.id,
                          { showSpecsGrid: e.target.checked },
                          true
                        )
                      }
                      className="h-4 w-4 rounded accent-white"
                    />
                    <span>{t.showSpecsLabel}</span>
                  </label>

                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/85">
                    <input
                      type="checkbox"
                      checked={selectedProduct.showBuyNowBtn}
                      onChange={(e) =>
                        updateSingleProduct(
                          selectedProduct.id,
                          { showBuyNowBtn: e.target.checked },
                          true
                        )
                      }
                      className="h-4 w-4 rounded accent-white"
                    />
                    <span>{t.showBuyNowLabel}</span>
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* ============================================================
          CREATE NEW PRODUCT MODAL (CLEAN ISOLATED DATA)
         ============================================================ */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b0815] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-semibold text-white">
                {t.newModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full border border-white/15 p-1.5 text-white/70 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-5 space-y-4">
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
                    placeholder="custom-room-sheet"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">
                  {t.subtitleLabel}
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.priceLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.stockLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                  />
                </div>
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
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">
                  {t.bannerImageTitle}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={newCardImg}
                    onChange={(e) => setNewCardImg(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                  />
                  <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25">
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>{t.uploadImage}</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleImageUpload(
                          file,
                          (dataUrl) => setNewCardImg(dataUrl),
                          (msg) => setNewImgErr(msg || null)
                        );
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {newImgErr ? (
                  <p className="mt-1 text-[11px] text-red-300">{newImgErr}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-full bg-indigo-500 px-5 text-xs font-bold text-white hover:bg-indigo-400"
                >
                  {t.createAndOpen}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
