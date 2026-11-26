/**
 * @file src/modules/universe-organizer/components/UniverseOrganizerClient.tsx
 * @purpose Completely isolated Admin Universe Organizer (/admin/universes/): manages universes (add, pause/enable, delete, edit values + PNG symbol, assign existing products & offer banners with zero cross-contamination).
 */

"use client";

import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchOrganizerDataSnapshot,
  saveIsolatedRegistry,
} from "../client-api";
import {
  ORGANIZER_LOCAL_STORAGE_KEY,
  slugifyUniverseName,
} from "../helpers";
import {
  OrganizedUniverseSchema,
  OrganizerRegistrySchema,
  type OrganizedUniverse,
  type OrganizerRegistry,
  type SiteOfferBannerSource,
  type SiteProductSource,
} from "../schema";
import {
  ReadonlyStorefrontOfferBanner,
  ReadonlyStorefrontProductCard,
} from "./StorefrontItemsReadonly";
import { StorefrontUniverseCard } from "./StorefrontUniverseCard";

type Lang = "ar" | "en";
type DetailTab = "identity" | "products" | "offers";
type StatusFilter = "all" | "active" | "paused";
type AssignmentFilter = "all" | "assigned" | "unassigned";

interface UniverseOrganizerClientProps {
  initialStoreId: string;
  initialRegistry: OrganizerRegistry;
  initialHasPersistedRecord: boolean;
  initialProducts: SiteProductSource[];
  initialOffers: SiteOfferBannerSource[];
}

const COPY = {
  ar: {
    brand: "منظم اليونيفيرسز",
    isolatedBadge: "نظام معزول بالكود والداتا",
    backToAdmin: "لوحة الإدارة",
    addUniverse: "إضافة يونيفيرس جديد",
    saveNow: "حفظ التعديلات",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ في الداتا المعزولة",
    saveError: "تعذر الحفظ في Supabase (محفوظ محلياً)",
    allFilter: "الكل",
    activeFilter: "المفعّلة",
    pausedFilter: "المعطّلة مؤقتاً",
    searchUniverses: "ابحث عن يونيفيرس...",
    pausedLabel: "معطل مؤقتاً",
    activeLabel: "مفعّل",
    enterEdit: "دخول وتخصيص",
    pauseBtn: "تعطيل مؤقت",
    enableBtn: "تفعيل",
    deleteBtn: "حذف",
    confirmDelete: "تأكيد الحذف؟",
    cancel: "إلغاء",
    productsCount: (n: number) => `${n} منتج`,
    offersCount: (n: number) => `${n} عرض`,
    backToList: "العودة لقائمة اليونيفيرسز",
    tabs: {
      identity: "1. تعديل اليونيفيرس نفسه",
      products: "2. منتجات اليونيفيرس",
      offers: "3. بنرات العروض",
    },
    identityTitle: "تعديل قيم اليونيفيرس (مع الحفاظ على تكوينه)",
    nameLabel: "العنوان (Name)",
    taglineLabel: "السطر التعريفي (Tagline)",
    descriptionLabel: "الوصف (Description)",
    slugLabel: "المعرّف (Slug)",
    colorLabel: "لون اليونيفيرس (Accent Color)",
    pngLabel: "صورة PNG رمز لليونيفيرس",
    pngUpload: "رفع صورة PNG",
    pngRemove: "إزالة الرمز",
    pngPlaceholder: "أو ضع رابط/مسار صورة PNG...",
    pngHint: "يُقبل ملف PNG فقط (بحد أقصى 350KB) ويظهر مباشرة كرمز فوق كارت اليونيفيرس.",
    pngErrorType: "من فضلك اختر صورة بصيغة PNG فقط.",
    pngErrorSize: "حجم صورة PNG يجب ألا يتجاوز 350 كيلوبايت.",
    bannerLabel: "صورة خلفية الكارت (اختياري)",
    statusLabel: "حالة اليونيفيرس",
    previewTitle: "المعاينة المباشرة بشكل الواجهة",
    detailHeroPreview: "معاينة رأس صفحة اليونيفيرس",
    productsNotice:
      "اختيار فقط من المنتجات الموجودة بالفعل في الموقع (بدون تعديل المنتج نفسه وبدون أي فلاتر ألوان تابعة لليونيفيرس). يمكن للمنتج الانتماء لأكثر من يونيفيرس.",
    offersNotice:
      "اختيار فقط من بنرات العروض الموجودة في الموقع (بدون تعديل العرض نفسه وبدون أي فلاتر ألوان تابعة لليونيفيرس). يمكن للعرض الانتماء لأكثر من يونيفيرس.",
    searchProducts: "ابحث في منتجات الموقع...",
    assignedOnly: "المختارة هنا",
    unassignedOnly: "غير المختارة",
    selectedInUniverse: "منتمي لهذا اليونيفيرس",
    addToUniverse: "إضافة لهذا اليونيفيرس",
    alsoIn: "موجود أيضاً في",
    noProducts: "لا توجد منتجات مطابقة.",
    noOffers: "لا توجد بنرات عروض متاحة في الموقع حالياً.",
    noUniverses: "لا توجد يونيفيرسز مطابقة للبحث.",
    newModalTitle: "إضافة يونيفيرس جديد بداتا نظيفة منفصلة",
    newNamePlaceholder: "مثال: CYBER SPACE",
    newTaglinePlaceholder: "مثال: Neon Minimalist Bedroom Setups",
    newDescPlaceholder: "وصف مختصر لليونيفيرس الجديد...",
    createAndOpen: "إنشاء وتخصيص القوائم",
  },
  en: {
    brand: "Universe Organizer",
    isolatedBadge: "Isolated Code & Data",
    backToAdmin: "Admin Portal",
    addUniverse: "Add Universe",
    saveNow: "Save Changes",
    saving: "Saving...",
    saved: "Saved to Isolated Data",
    saveError: "Supabase save failed (cached locally)",
    allFilter: "All",
    activeFilter: "Active",
    pausedFilter: "Paused",
    searchUniverses: "Search universes...",
    pausedLabel: "Paused",
    activeLabel: "Active",
    enterEdit: "Open & Configure",
    pauseBtn: "Pause",
    enableBtn: "Enable",
    deleteBtn: "Delete",
    confirmDelete: "Confirm delete?",
    cancel: "Cancel",
    productsCount: (n: number) => `${n} products`,
    offersCount: (n: number) => `${n} offers`,
    backToList: "Back to Universes",
    tabs: {
      identity: "1. Edit Universe",
      products: "2. Universe Products",
      offers: "3. Offer Banners",
    },
    identityTitle: "Edit Universe Values (Existing Structure Preserved)",
    nameLabel: "Title (Name)",
    taglineLabel: "Tagline",
    descriptionLabel: "Description",
    slugLabel: "Slug",
    colorLabel: "Accent Color",
    pngLabel: "PNG Symbol Icon",
    pngUpload: "Upload PNG",
    pngRemove: "Remove PNG",
    pngPlaceholder: "Or paste a PNG URL / path...",
    pngHint: "PNG files only (max 350KB). Displayed as a symbol badge on the Universe card.",
    pngErrorType: "Please choose a valid .png image file.",
    pngErrorSize: "PNG file size must be 350KB or smaller.",
    bannerLabel: "Card Background Image (Optional)",
    statusLabel: "Universe Status",
    previewTitle: "Live Storefront Card Preview",
    detailHeroPreview: "Universe Detail Hero Preview",
    productsNotice:
      "Read-only selection from existing site products (no product editing, no universe color filters applied). A product can belong to multiple universes.",
    offersNotice:
      "Read-only selection from existing site offer banners (no offer editing, no universe color filters applied). An offer can belong to multiple universes.",
    searchProducts: "Search site products...",
    assignedOnly: "Assigned Here",
    unassignedOnly: "Unassigned",
    selectedInUniverse: "Assigned to Universe",
    addToUniverse: "Assign to Universe",
    alsoIn: "Also in",
    noProducts: "No matching products found.",
    noOffers: "No offer banners found on the site yet.",
    noUniverses: "No universes match your filter.",
    newModalTitle: "Create New Universe with Clean Isolated Data",
    newNamePlaceholder: "e.g. CYBER SPACE",
    newTaglinePlaceholder: "e.g. Neon Minimalist Bedroom Setups",
    newDescPlaceholder: "Short description for this universe...",
    createAndOpen: "Create & Configure",
  },
} as const;

export function UniverseOrganizerClient({
  initialStoreId,
  initialRegistry,
  initialHasPersistedRecord,
  initialProducts,
  initialOffers,
}: UniverseOrganizerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];

  const [storeId, setStoreId] = useState(initialStoreId);
  const [registry, setRegistry] = useState<OrganizerRegistry>(initialRegistry);
  const [recordExistsInDb, setRecordExistsInDb] = useState(initialHasPersistedRecord);
  const [products, setProducts] = useState<SiteProductSource[]>(initialProducts);
  const [offers, setOffers] = useState<SiteOfferBannerSource[]>(initialOffers);

  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("identity");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [universeSearch, setUniverseSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productAssignFilter, setProductAssignFilter] = useState<AssignmentFilter>("all");
  const [offerAssignFilter, setOfferAssignFilter] = useState<AssignmentFilter>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pngError, setPngError] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Create Universe Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newColor, setNewColor] = useState("#c94b99");
  const [newIconPng, setNewIconPng] = useState<string | null>(null);
  const [newPngError, setNewPngError] = useState<string | null>(null);

  const persistRegistry = async (
    nextRegistry: OrganizerRegistry,
    targetStoreId = storeId,
    exists = recordExistsInDb
  ) => {
    setSaveState("saving");
    try {
      await saveIsolatedRegistry({
        storeId: targetStoreId,
        registry: nextRegistry,
        recordExistsInDb: exists,
      });
      if (!exists) {
        setRecordExistsInDb(true);
      }
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2400);
    } catch {
      setSaveState("error");
    }
  };

  // Load isolated registry & read-only site products/offers via the isolated Data Manager
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snapshot = await fetchOrganizerDataSnapshot();
        if (!active) return;

        setStoreId(snapshot.storeId);
        setProducts(snapshot.products);
        setOffers(snapshot.offers);
        setRegistry(snapshot.registry);
        setRecordExistsInDb(snapshot.recordExistsInDb);

        if (!snapshot.recordExistsInDb) {
          await persistRegistry(snapshot.registry, snapshot.storeId, false);
        }
      } catch {
        // Offline fallback: check localStorage
        try {
          const cachedRaw = localStorage.getItem(ORGANIZER_LOCAL_STORAGE_KEY);
          if (cachedRaw && active) {
            const parsedLocal = OrganizerRegistrySchema.safeParse(JSON.parse(cachedRaw));
            if (parsedLocal.success) {
              setRegistry(parsedLocal.data);
            }
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

  const selectedUniverse = useMemo(
    () => registry.universes.find((u) => u.id === selectedUniverseId) ?? null,
    [registry.universes, selectedUniverseId]
  );

  const filteredUniverses = useMemo(() => {
    const q = universeSearch.trim().toLowerCase();
    return registry.universes
      .filter((u) => {
        if (statusFilter === "active" && !u.isActive) return false;
        if (statusFilter === "paused" && u.isActive) return false;
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.tagline.toLowerCase().includes(q) ||
          u.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [registry.universes, statusFilter, universeSearch]);

  const updateRegistry = (
    updater: (prev: OrganizerRegistry) => OrganizerRegistry,
    autoSave = true
  ) => {
    const next = updater(registry);
    const stamped: OrganizerRegistry = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    setRegistry(stamped);
    if (autoSave) {
      void persistRegistry(stamped);
    }
  };

  const updateSingleUniverse = (
    universeId: string,
    patch: Partial<OrganizedUniverse>,
    autoSave = false
  ) => {
    const now = new Date().toISOString();
    updateRegistry(
      (prev) => ({
        ...prev,
        universes: prev.universes.map((u) =>
          u.id === universeId ? { ...u, ...patch, updatedAt: now } : u
        ),
      }),
      autoSave
    );
  };

  const handleToggleProductInUniverse = (universeId: string, productId: string) => {
    const target = registry.universes.find((u) => u.id === universeId);
    if (!target) return;
    const exists = target.productIds.includes(productId);
    const nextIds = exists
      ? target.productIds.filter((id) => id !== productId)
      : [...target.productIds, productId];
    updateSingleUniverse(universeId, { productIds: nextIds }, true);
  };

  const handleToggleOfferInUniverse = (universeId: string, offerId: string) => {
    const target = registry.universes.find((u) => u.id === universeId);
    if (!target) return;
    const exists = target.offerIds.includes(offerId);
    const nextIds = exists
      ? target.offerIds.filter((id) => id !== offerId)
      : [...target.offerIds, offerId];
    updateSingleUniverse(universeId, { offerIds: nextIds }, true);
  };

  const handleDeleteUniverse = (universeId: string) => {
    updateRegistry(
      (prev) => ({
        ...prev,
        universes: prev.universes.filter((u) => u.id !== universeId),
      }),
      true
    );
    setConfirmDeleteId(null);
    if (selectedUniverseId === universeId) {
      setSelectedUniverseId(null);
    }
  };

  const handlePngUpload = (
    file: File | undefined,
    onSuccess: (dataUrl: string) => void,
    onError: (msg: string) => void
  ) => {
    if (!file) return;
    const isPng =
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    if (!isPng) {
      onError(t.pngErrorType);
      return;
    }
    if (file.size > 350 * 1024) {
      onError(t.pngErrorSize);
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

  const handleCreateUniverse = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim() || "NEW UNIVERSE";
    const baseSlug = slugifyUniverseName(newSlug.trim() || trimmedName);
    const slugInUse = registry.universes.some((u) => u.slug === baseSlug);
    const uniqueSlug = slugInUse
      ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      : baseSlug;

    const now = new Date().toISOString();
    const created = OrganizedUniverseSchema.parse({
      id: generateClientId("uorg"),
      slug: uniqueSlug,
      name: trimmedName,
      tagline: newTagline.trim(),
      description: newDescription.trim(),
      accentColor: newColor,
      iconPngUrl: newIconPng,
      bannerUrl: null,
      sortOrder: registry.universes.length + 1,
      isActive: true,
      productIds: [],
      offerIds: [],
      createdAt: now,
      updatedAt: now,
    });

    updateRegistry(
      (prev) => ({
        ...prev,
        universes: [...prev.universes, created],
      }),
      true
    );

    setShowCreateModal(false);
    setNewName("");
    setNewTagline("");
    setNewDescription("");
    setNewSlug("");
    setNewColor("#c94b99");
    setNewIconPng(null);
    setNewPngError(null);
    setSelectedUniverseId(created.id);
    setDetailTab("identity");
  };

  const filteredProducts = useMemo(() => {
    if (!selectedUniverse) return [];
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const assigned = selectedUniverse.productIds.includes(p.id);
      if (productAssignFilter === "assigned" && !assigned) return false;
      if (productAssignFilter === "unassigned" && assigned) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.subtitle ?? "").toLowerCase().includes(q) ||
        p.universeSlug.toLowerCase().includes(q)
      );
    });
  }, [products, selectedUniverse, productSearch, productAssignFilter]);

  const filteredOffers = useMemo(() => {
    if (!selectedUniverse) return [];
    return offers.filter((o) => {
      const assigned = selectedUniverse.offerIds.includes(o.id);
      if (offerAssignFilter === "assigned" && !assigned) return false;
      if (offerAssignFilter === "unassigned" && assigned) return false;
      return true;
    });
  }, [offers, selectedUniverse, offerAssignFilter]);

  const activeCount = registry.universes.filter((u) => u.isActive).length;
  const pausedCount = registry.universes.length - activeCount;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#040308] text-white"
    >
      {/* Top Admin Organizer Bar */}
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/15">
                <Layers className="h-4 w-4 text-fuchsia-300" />
              </div>
              <div>
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
        {/* ============================================================
            VIEW 1: UNIVERSES ORGANIZER GRID (STOREFRONT CARD STYLE)
           ============================================================ */}
        {!selectedUniverse ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all", label: `${t.allFilter} (${registry.universes.length})` },
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
                    value={universeSearch}
                    onChange={(e) => setUniverseSearch(e.target.value)}
                    placeholder={t.searchUniverses}
                    className="h-10 w-56 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-fuchsia-500 px-5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(201,75,153,0.35)] transition-transform hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addUniverse}</span>
                </button>
              </div>
            </div>

            {filteredUniverses.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-12 text-center text-sm text-white/60">
                {t.noUniverses}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {filteredUniverses.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#090712] p-3.5"
                  >
                    {/* Exact Storefront Card Appearance */}
                    <StorefrontUniverseCard
                      universe={u}
                      pausedLabel={t.pausedLabel}
                      onClick={() => {
                        setSelectedUniverseId(u.id);
                        setDetailTab("identity");
                      }}
                    />

                    {/* Card Quick Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2 text-[11px] text-white/65">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                          {t.productsCount(u.productIds.length)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                          {t.offersCount(u.offerIds.length)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUniverseId(u.id);
                            setDetailTab("identity");
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{t.enterEdit}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSingleUniverse(u.id, { isActive: !u.isActive }, true)
                          }
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                            u.isActive
                              ? "border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                              : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <PauseCircle className="h-3.5 w-3.5" />
                              <span>{t.pauseBtn}</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3.5 w-3.5" />
                              <span>{t.enableBtn}</span>
                            </>
                          )}
                        </button>

                        {confirmDeleteId === u.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteUniverse(u.id)}
                              className="rounded-xl bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-500"
                            >
                              {t.confirmDelete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-xl border border-white/15 px-2 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(u.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{t.deleteBtn}</span>
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
             VIEW 2: INSIDE SELECTED UNIVERSE (3 ORGANIZED LISTS)
             ============================================================ */
          <div className="space-y-6">
            {/* Universe Detail Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUniverseId(null);
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

                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: selectedUniverse.accentColor }}
                  />
                  {selectedUniverse.iconPngUrl ? (
                    <img
                      src={selectedUniverse.iconPngUrl}
                      alt=""
                      className="h-7 w-7 rounded object-contain"
                    />
                  ) : null}
                  <div>
                    <h2 dir="auto" className="font-serif text-lg font-semibold text-white">
                      {selectedUniverse.name || "Untitled Universe"}
                    </h2>
                    <p className="font-mono text-[11px] text-white/50" dir="ltr">
                      /{selectedUniverse.slug}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateSingleUniverse(
                      selectedUniverse.id,
                      { isActive: !selectedUniverse.isActive },
                      true
                    )
                  }
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold ${
                    selectedUniverse.isActive
                      ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                      : "border border-amber-400/35 bg-amber-500/15 text-amber-200"
                  }`}
                >
                  {selectedUniverse.isActive ? (
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

                {confirmDeleteId === selectedUniverse.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteUniverse(selectedUniverse.id)}
                      className="h-9 rounded-full bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-500"
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
                    onClick={() => setConfirmDeleteId(selectedUniverse.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.deleteBtn}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3 Organized Tabs */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    id: "identity",
                    label: t.tabs.identity,
                    icon: <Sparkles className="h-4 w-4" />,
                  },
                  {
                    id: "products",
                    label: `${t.tabs.products} (${selectedUniverse.productIds.length})`,
                    icon: <Package className="h-4 w-4" />,
                  },
                  {
                    id: "offers",
                    label: `${t.tabs.offers} (${selectedUniverse.offerIds.length})`,
                    icon: <Tag className="h-4 w-4" />,
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

            {/* ------------------------------------------------------------
                LIST 1: EDIT UNIVERSE VALUES (COLOR, PNG SYMBOL, TITLE, DESC)
               ------------------------------------------------------------ */}
            {detailTab === "identity" ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0b0815] p-6 lg:col-span-7">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-base font-semibold text-white">
                      {t.identityTitle}
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
                        value={selectedUniverse.name}
                        onChange={(e) =>
                          updateSingleUniverse(selectedUniverse.id, { name: e.target.value })
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
                        value={selectedUniverse.slug}
                        onChange={(e) =>
                          updateSingleUniverse(selectedUniverse.id, {
                            slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                          })
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white/85 focus:border-white/45 focus:outline-none"
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
                      value={selectedUniverse.tagline}
                      onChange={(e) =>
                        updateSingleUniverse(selectedUniverse.id, { tagline: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white/90 focus:border-white/45 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/75">
                      {t.descriptionLabel}
                    </label>
                    <textarea
                      rows={3}
                      dir="auto"
                      value={selectedUniverse.description}
                      onChange={(e) =>
                        updateSingleUniverse(selectedUniverse.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs leading-relaxed text-white/85 focus:border-white/45 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.colorLabel}
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={selectedUniverse.accentColor}
                          onChange={(e) =>
                            updateSingleUniverse(selectedUniverse.id, {
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 w-14 cursor-pointer rounded-xl border border-white/15 bg-transparent"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={selectedUniverse.accentColor}
                          onChange={(e) =>
                            updateSingleUniverse(selectedUniverse.id, {
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-white/75">
                        {t.bannerLabel}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedUniverse.bannerUrl ?? ""}
                        onChange={(e) =>
                          updateSingleUniverse(selectedUniverse.id, {
                            bannerUrl: e.target.value.trim() || null,
                          })
                        }
                        placeholder="/mockups/universe-anime.svg"
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white/80 focus:border-white/45 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* PNG Symbol Picker */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-white">
                        {t.pngLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3.5 py-1.5 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/25">
                          <ImagePlus className="h-3.5 w-3.5" />
                          <span>{t.pngUpload}</span>
                          <input
                            type="file"
                            accept=".png,image/png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handlePngUpload(
                                file,
                                (dataUrl) => {
                                  updateSingleUniverse(
                                    selectedUniverse.id,
                                    { iconPngUrl: dataUrl },
                                    true
                                  );
                                },
                                (msg) => setPngError(msg || null)
                              );
                              e.target.value = "";
                            }}
                          />
                        </label>

                        {selectedUniverse.iconPngUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateSingleUniverse(
                                selectedUniverse.id,
                                { iconPngUrl: null },
                                true
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>{t.pngRemove}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <input
                      type="text"
                      dir="ltr"
                      value={selectedUniverse.iconPngUrl ?? ""}
                      onChange={(e) =>
                        updateSingleUniverse(selectedUniverse.id, {
                          iconPngUrl: e.target.value.trim() || null,
                        })
                      }
                      placeholder={t.pngPlaceholder}
                      className="mt-3 h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white/80 focus:border-white/45 focus:outline-none"
                    />
                    <p className="mt-2 text-[11px] text-white/50">{t.pngHint}</p>
                    {pngError ? (
                      <p className="mt-2 text-xs text-red-300">{pngError}</p>
                    ) : null}
                  </div>
                </div>

                {/* Live Storefront Previews */}
                <div className="space-y-4 lg:col-span-5">
                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/65">
                      {t.previewTitle}
                    </p>
                    <StorefrontUniverseCard
                      universe={selectedUniverse}
                      pausedLabel={t.pausedLabel}
                    />
                  </div>

                  {/* Detail Hero Preview */}
                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/65">
                      {t.detailHeroPreview}
                    </p>
                    <div
                      className="rounded-2xl border border-[var(--color-border-subtle)] p-6 transition-colors duration-300"
                      style={{
                        background: `linear-gradient(135deg, #05030a 0%, ${selectedUniverse.accentColor}2e 100%)`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
                          style={{ backgroundColor: selectedUniverse.accentColor }}
                        >
                          Universe
                        </span>
                        {selectedUniverse.iconPngUrl ? (
                          <img
                            src={selectedUniverse.iconPngUrl}
                            alt=""
                            className="h-10 w-10 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
                          />
                        ) : null}
                      </div>
                      <h4 dir="auto" className="mt-4 font-serif text-2xl font-semibold text-white">
                        {selectedUniverse.name || "Untitled Universe"}
                      </h4>
                      {selectedUniverse.description ? (
                        <p
                          dir="auto"
                          className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]"
                        >
                          {selectedUniverse.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ------------------------------------------------------------
                LIST 2: ASSIGN EXISTING PRODUCTS (READ-ONLY, NO COLOR FILTER)
               ------------------------------------------------------------ */}
            {detailTab === "products" ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-4">
                  <p className="text-xs leading-relaxed text-white/75">{t.productsNotice}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: "all", label: `${t.allFilter} (${products.length})` },
                          {
                            id: "assigned",
                            label: `${t.assignedOnly} (${selectedUniverse.productIds.length})`,
                          },
                          {
                            id: "unassigned",
                            label: `${t.unassignedOnly} (${Math.max(
                              0,
                              products.length - selectedUniverse.productIds.length
                            )})`,
                          },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setProductAssignFilter(f.id)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                            productAssignFilter === f.id
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
                        className="h-9 w-56 rounded-full border border-white/15 bg-black/60 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-10 text-center text-sm text-white/60">
                    {t.noProducts}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedUniverse.productIds.includes(product.id);
                      const otherNames = registry.universes
                        .filter(
                          (u) =>
                            u.id !== selectedUniverse.id &&
                            u.productIds.includes(product.id)
                        )
                        .map((u) => u.name || u.slug);

                      return (
                        <ReadonlyStorefrontProductCard
                          key={product.id}
                          product={product}
                          isSelected={isSelected}
                          otherUniverseNames={otherNames}
                          onToggle={() =>
                            handleToggleProductInUniverse(selectedUniverse.id, product.id)
                          }
                          labels={{
                            selected: t.selectedInUniverse,
                            add: t.addToUniverse,
                            alsoIn: t.alsoIn,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* ------------------------------------------------------------
                LIST 3: ASSIGN EXISTING OFFER BANNERS (READ-ONLY, NO COLOR FILTER)
               ------------------------------------------------------------ */}
            {detailTab === "offers" ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-4">
                  <p className="text-xs leading-relaxed text-white/75">{t.offersNotice}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      [
                        { id: "all", label: `${t.allFilter} (${offers.length})` },
                        {
                          id: "assigned",
                          label: `${t.assignedOnly} (${selectedUniverse.offerIds.length})`,
                        },
                        {
                          id: "unassigned",
                          label: `${t.unassignedOnly} (${Math.max(
                            0,
                            offers.length - selectedUniverse.offerIds.length
                          )})`,
                        },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOfferAssignFilter(f.id)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                          offerAssignFilter === f.id
                            ? "bg-white text-black"
                            : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOffers.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-[#0b0815] p-10 text-center text-sm text-white/60">
                    {t.noOffers}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {filteredOffers.map((offer) => {
                      const isSelected = selectedUniverse.offerIds.includes(offer.id);
                      const otherNames = registry.universes
                        .filter(
                          (u) =>
                            u.id !== selectedUniverse.id && u.offerIds.includes(offer.id)
                        )
                        .map((u) => u.name || u.slug);

                      return (
                        <div
                          key={offer.id}
                          className={
                            offer.kind === "PROMO_BANNER" ? "md:col-span-3" : undefined
                          }
                        >
                          <ReadonlyStorefrontOfferBanner
                            offer={offer}
                            isSelected={isSelected}
                            otherUniverseNames={otherNames}
                            onToggle={() =>
                              handleToggleOfferInUniverse(selectedUniverse.id, offer.id)
                            }
                            labels={{
                              selected: t.selectedInUniverse,
                              add: t.addToUniverse,
                              alsoIn: t.alsoIn,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* ============================================================
          CREATE NEW UNIVERSE MODAL (CLEAN ISOLATED DATA)
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

            <form onSubmit={handleCreateUniverse} className="mt-5 space-y-4">
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
                    placeholder={t.newNamePlaceholder}
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm text-white focus:border-white/45 focus:outline-none"
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
                    placeholder="cyber-space"
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white focus:border-white/45 focus:outline-none"
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
                  placeholder={t.newTaglinePlaceholder}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white focus:border-white/45 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">
                  {t.descriptionLabel}
                </label>
                <textarea
                  rows={2}
                  dir="auto"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t.newDescPlaceholder}
                  className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white focus:border-white/45 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.colorLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-white/15 bg-transparent"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-10 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    {t.pngLabel}
                  </label>
                  <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/25">
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>{newIconPng ? "PNG ✓" : t.pngUpload}</span>
                    <input
                      type="file"
                      accept=".png,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handlePngUpload(
                          file,
                          (dataUrl) => setNewIconPng(dataUrl),
                          (msg) => setNewPngError(msg || null)
                        );
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {newPngError ? (
                    <p className="mt-1 text-[11px] text-red-300">{newPngError}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75 hover:bg-white/10"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-full bg-fuchsia-500 px-5 text-xs font-bold text-white hover:bg-fuchsia-400"
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
