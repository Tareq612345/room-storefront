/**
 * @file src/modules/home-composer/components/HomeComposerClient.tsx
 * @purpose Isolated Homepage Composer Studio (/admin/home/ & /admin/editor/): 2-pane split workspace with independent scrollbars — left unified Editor & 5 connected Vault panels + right naturally proportioned scaled Storefront Preview (Desktop 1280px scaled or Mobile 390px).
 */

"use client";

import {
  ActionButtonView,
  ReadingTextBlockView,
} from "@modules/element-organizer";
import { StorefrontPackageBannerCard } from "@modules/package-organizer";
import { StorefrontProductBannerCard } from "@modules/product-organizer";
import { StorefrontUniverseCard } from "@modules/universe-organizer";
import { UniverseStarHeader } from "@modules/universes";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Languages,
  Layers,
  LayoutGrid,
  ListChecks,
  Minus,
  Monitor,
  MousePointerClick,
  Package,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchHomeComposerAdminSnapshot,
  saveIsolatedHomepageRegistry,
  type ComposerVaultsData,
} from "../client-api";
import { DEFAULT_DIVIDER_CONFIG, createEmptyHomeBlock } from "../helpers";
import type {
  BlockPlacedItem,
  DesktopCols,
  DividerStyleConfig,
  HomeBlock,
  HomepageRegistry,
  ItemAlign,
  ItemWidth,
  MobileCols,
  PlacedItemKind,
} from "../schema";
import { HomeComposerBlockRenderer } from "./HomeComposerBlockRenderer";

interface HomeComposerClientProps {
  initialStoreId: string;
  initialRegistry: HomepageRegistry;
}

type EditorSubTab = "catalog" | "items" | "layout";
type SideCatalogTab =
  | "universes"
  | "products"
  | "packages"
  | "text"
  | "buttons";

type Lang = "ar" | "en";

const COPY = {
  ar: {
    title: "منسّق الصفحة الرئيسية المعزول",
    subtitle: "تحكم كامل في البلوكات والأعمدة والمحاذاة مع معاينة طبيعية حية",
    saveBtn: "حفظ الرئيسية",
    savingBtn: "جاري الحفظ...",
    savedBtn: "تم الحفظ!",
    refreshVaults: "تحديث المستودعات",
    starHeaderOn: "شريط النجوم: ظاهر",
    starHeaderOff: "شريط النجوم: مخفي",
    blocksHeading: "البلوكات",
    addBlock: "+ بلوك",
    editorTabs: {
      catalog: "القوايم الـ 5 (+ إضافة)",
      items: "عناصر البلوك",
      layout: "تنسيق البلوك والأعمدة",
    },
    blockHeaderSection: "عنوان البلوك (بنفس تنسيق ومقاس الموقع)",
    eyebrowLabel: "الاسم العلوي (Eyebrow)",
    titleLabel: "العنوان الرئيسي (Title)",
    subtitleLabel: "الوصف الفرعي (Subtitle)",
    headerAlignLabel: "محاذاة العنوان",
    layoutSection: "الأعمدة والاتجاه والمساحات",
    startDirLabel: "البداية من",
    dirLeft: "اليسار (LTR)",
    dirRight: "اليمين (RTL)",
    mobileColsLabel: "أعمدة الموبايل",
    desktopColsLabel: "أعمدة الديسكتوب",
    autoCol: "تلقائي",
    containerWidthLabel: "عرض البلوك",
    gapLabel: "المسافات (Gap)",
    padLabel: "الارتفاع الداخلي",
    radiusLabel: "حواف البلوك",
    bgColorLabel: "خلفية البلوك",
    placedItemsHeading: "العناصر الموضوعة داخل البلوك",
    emptyItems: "هذا البلوك فارغ. افتح تبويب (القوايم الـ 5) لإضافة عناصر إليه.",
    itemWidthLabel: "العرض",
    itemAlignLabel: "المكان",
    sideTabs: {
      universes: "اليونيفيرسز",
      products: "المنتجات",
      packages: "الكوليكشنز",
      text: "نصوص القراءة",
      buttons: "أزرار وفاصل",
    },
    addToBlock: "+ ضف للبلوك",
    dividerSection: "إضافة خط فاصل قابل للتعديل",
    addDividerBtn: "إضافة الخط الفاصل للبلوك",
    dividerEditSelected: "تعديل الخط الفاصل المحدد",
    openElementsVault: "إنشاء / تعديل النصوص والأزرار",
    previewHeading: "المعاينة الحية للواجهة بالتنسيق الطبيعي للشاشة",
    noBlockSelected: "اختر أو أنشئ بلوكاً للبدء",
    hiddenBadge: "مخفي",
  },
  en: {
    title: "Isolated Homepage Composer",
    subtitle: "Compose Blocks, grids, alignment & vault cards with natural scaled preview",
    saveBtn: "Save Homepage",
    savingBtn: "Saving...",
    savedBtn: "Saved!",
    refreshVaults: "Sync Vaults",
    starHeaderOn: "Star Header: ON",
    starHeaderOff: "Star Header: OFF",
    blocksHeading: "Blocks",
    addBlock: "+ Block",
    editorTabs: {
      catalog: "5 Vault Lists (+ Add)",
      items: "Block Items",
      layout: "Block & Grid Style",
    },
    blockHeaderSection: "Block Typography Header",
    eyebrowLabel: "Eyebrow",
    titleLabel: "Main Title",
    subtitleLabel: "Subtitle",
    headerAlignLabel: "Header Alignment",
    layoutSection: "Grid Columns & Spacing",
    startDirLabel: "Start From",
    dirLeft: "Left (LTR)",
    dirRight: "Right (RTL)",
    mobileColsLabel: "Mobile Columns",
    desktopColsLabel: "Desktop Columns",
    autoCol: "Auto",
    containerWidthLabel: "Container Width",
    gapLabel: "Gap",
    padLabel: "Padding Y",
    radiusLabel: "Border Radius",
    bgColorLabel: "Background Color",
    placedItemsHeading: "Placed Items Inside Block",
    emptyItems: "No items yet. Switch to (5 Vault Lists) to add items to this block.",
    itemWidthLabel: "Width",
    itemAlignLabel: "Align",
    sideTabs: {
      universes: "Universes",
      products: "Products",
      packages: "Collections",
      text: "Text Cards",
      buttons: "Buttons & Line",
    },
    addToBlock: "+ Add",
    dividerSection: "Add Customizable Divider Line",
    addDividerBtn: "Add Divider to Block",
    dividerEditSelected: "Edit Selected Divider",
    openElementsVault: "Open Text & Buttons Studio",
    previewHeading: "Natural Proportions Storefront Preview",
    noBlockSelected: "Select or add a Block to edit",
    hiddenBadge: "Hidden",
  },
} as const;

export function HomeComposerClient({
  initialStoreId,
  initialRegistry,
}: HomeComposerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];

  const [storeId, setStoreId] = useState(initialStoreId);
  const [registry, setRegistry] = useState<HomepageRegistry>(initialRegistry);
  const [vaults, setVaults] = useState<ComposerVaultsData>({
    universes: [],
    products: [],
    packages: [],
    elements: { schemaVersion: 1, updatedAt: "", textBlocks: [], buttons: [] },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedBlockId, setSelectedBlockId] = useState<string>(
    initialRegistry.blocks[0]?.id ?? ""
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorSubTab>("catalog");
  const [sideTab, setSideTab] = useState<SideCatalogTab>("universes");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [previewZoom, setPreviewZoom] = useState<number>(0.68);
  const [draftDivider, setDraftDivider] = useState<DividerStyleConfig>(
    DEFAULT_DIVIDER_CONFIG
  );

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await fetchHomeComposerAdminSnapshot();
      setStoreId(snap.storeId);
      setRegistry(snap.registry);
      setVaults(snap.vaults);
      setSelectedBlockId((prev) =>
        snap.registry.blocks.some((b) => b.id === prev)
          ? prev
          : snap.registry.blocks[0]?.id ?? ""
      );
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const activeBlock =
    registry.blocks.find((b) => b.id === selectedBlockId) ??
    registry.blocks[0] ??
    null;

  const selectedPlacedItem =
    activeBlock?.items.find((i) => i.id === selectedItemId) ?? null;

  const updateBlock = (id: string, patch: Partial<HomeBlock>) => {
    setRegistry((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const handleAddBlock = () => {
    const created = createEmptyHomeBlock(registry.blocks.length + 1);
    setRegistry((prev) => ({
      ...prev,
      blocks: [...prev.blocks, created],
    }));
    setSelectedBlockId(created.id);
    setSelectedItemId(null);
  };

  const handleDuplicateBlock = (blk: HomeBlock) => {
    const cloned: HomeBlock = {
      ...blk,
      id: `blk_${Date.now().toString(36)}`,
      internalName: `${blk.internalName} (Copy)`,
      sortOrder: registry.blocks.length + 1,
      items: blk.items.map((it, idx) => ({
        ...it,
        id: `pi_${Date.now().toString(36)}_${idx}`,
      })),
    };
    setRegistry((prev) => ({
      ...prev,
      blocks: [...prev.blocks, cloned],
    }));
    setSelectedBlockId(cloned.id);
  };

  const handleMoveBlock = (idx: number, dir: -1 | 1) => {
    const swap = idx + dir;
    if (swap < 0 || swap >= registry.blocks.length) return;
    const next = [...registry.blocks];
    const tmp = next[idx]!;
    next[idx] = next[swap]!;
    next[swap] = tmp;
    setRegistry((prev) => ({
      ...prev,
      blocks: next.map((b, i) => ({ ...b, sortOrder: i + 1 })),
    }));
  };

  const handleDeleteBlock = (id: string) => {
    const rem = registry.blocks
      .filter((b) => b.id !== id)
      .map((b, i) => ({ ...b, sortOrder: i + 1 }));
    setRegistry((prev) => ({ ...prev, blocks: rem }));
    if (selectedBlockId === id) {
      setSelectedBlockId(rem[0]?.id ?? "");
      setSelectedItemId(null);
    }
  };

  const handlePlaceItem = (
    kind: PlacedItemKind,
    refId: string,
    dividerConfig?: DividerStyleConfig
  ) => {
    if (!activeBlock) return;
    const defaultWidth: ItemWidth =
      kind === "DIVIDER"
        ? "full"
        : kind === "TEXT_BLOCK" || kind === "BUTTON"
          ? "fit"
          : "auto";
    const newItem: BlockPlacedItem = {
      id: `pi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      kind,
      refId,
      width: defaultWidth,
      align: "center",
      ...(dividerConfig ? { dividerConfig: { ...dividerConfig } } : {}),
    };
    updateBlock(activeBlock.id, { items: [...activeBlock.items, newItem] });
    setSelectedItemId(newItem.id);
  };

  const updatePlacedItem = (itemId: string, patch: Partial<BlockPlacedItem>) => {
    if (!activeBlock) return;
    updateBlock(activeBlock.id, {
      items: activeBlock.items.map((it) =>
        it.id === itemId ? { ...it, ...patch } : it
      ),
    });
  };

  const movePlacedItem = (idx: number, dir: -1 | 1) => {
    if (!activeBlock) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= activeBlock.items.length) return;
    const next = [...activeBlock.items];
    const tmp = next[idx]!;
    next[idx] = next[swap]!;
    next[swap] = tmp;
    updateBlock(activeBlock.id, { items: next });
  };

  const removePlacedItem = (itemId: string) => {
    if (!activeBlock) return;
    updateBlock(activeBlock.id, {
      items: activeBlock.items.filter((it) => it.id !== itemId),
    });
    if (selectedItemId === itemId) setSelectedItemId(null);
  };

  const describePlacedItem = (item: BlockPlacedItem): string => {
    if (item.kind === "UNIVERSE_CARD") {
      return (
        vaults.universes.find((u) => u.id === item.refId)?.name ??
        `Universe (${item.refId})`
      );
    }
    if (item.kind === "PRODUCT_CARD") {
      return (
        vaults.products.find((p) => p.id === item.refId)?.name ??
        `Product (${item.refId})`
      );
    }
    if (item.kind === "PACKAGE_CARD") {
      return (
        vaults.packages.find((k) => k.id === item.refId)?.name ??
        `Collection (${item.refId})`
      );
    }
    if (item.kind === "TEXT_BLOCK") {
      return (
        vaults.elements.textBlocks.find((tb) => tb.id === item.refId)?.name ??
        `Text Card (${item.refId})`
      );
    }
    if (item.kind === "BUTTON") {
      return (
        vaults.elements.buttons.find((b) => b.id === item.refId)?.name ??
        `Button (${item.refId})`
      );
    }
    return item.dividerConfig?.label
      ? `Divider: ${item.dividerConfig.label}`
      : "Divider Line";
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await saveIsolatedHomepageRegistry({ storeId, registry });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="flex min-h-screen flex-col bg-[#040308] text-white lg:h-screen lg:overflow-hidden"
    >
      {/* COMPACT TOP STUDIO HEADER */}
      <header className="shrink-0 border-b border-white/10 bg-[#070510]/95 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/10">
              <Layers className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <h1 className="font-serif text-sm font-semibold text-white md:text-base">
                {t.title}
              </h1>
              <p className="hidden text-[11px] text-white/50 sm:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Viewport Switch */}
            <div className="flex items-center rounded-full border border-white/15 bg-black/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold ${
                  viewport === "desktop" ? "bg-white text-black" : "text-white/70"
                }`}
              >
                <Monitor className="h-3 w-3" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold ${
                  viewport === "mobile" ? "bg-white text-black" : "text-white/70"
                }`}
              >
                <Smartphone className="h-3 w-3" />
                <span>Mobile</span>
              </button>
            </div>

            {/* Scaled Natural Preview Zoom Controls */}
            {viewport === "desktop" ? (
              <div className="flex items-center rounded-full border border-white/15 bg-white/5 px-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewZoom((z) => Math.max(0.45, +(z - 0.05).toFixed(2)))
                  }
                  className="p-1 text-white/70 hover:text-white"
                  title="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-1.5 font-mono text-[10px] text-white/80">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewZoom((z) => Math.min(1, +(z + 0.05).toFixed(2)))
                  }
                  className="p-1 text-white/70 hover:text-white"
                  title="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                setRegistry((prev) => ({
                  ...prev,
                  showStarHeader: !prev.showStarHeader,
                }))
              }
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold ${
                registry.showStarHeader
                  ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                  : "border-white/15 bg-white/5 text-white/55"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>
                {registry.showStarHeader ? t.starHeaderOn : t.starHeaderOff}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void loadSnapshot()}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/20"
              title={t.refreshVaults}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <Link
              href="/admin/elements/"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 text-[11px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/25"
            >
              <Type className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t.openElementsVault}</span>
            </Link>

            <Link
              href="/schema/"
              className="inline-flex h-8 items-center rounded-full border border-white/15 bg-white/5 px-2.5 text-white/80 hover:bg-white/15"
              title="Schema Map"
            >
              <Database className="h-3.5 w-3.5 text-cyan-300" />
            </Link>

            <button
              type="button"
              onClick={() => setLang((p) => (p === "ar" ? "en" : "ar"))}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11px] text-white/80"
            >
              <Languages className="h-3 w-3" />
              <span>{lang === "ar" ? "EN" : "ع"}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-bold text-black hover:opacity-90 disabled:opacity-60"
            >
              {savedToast ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>
                {saving ? t.savingBtn : savedToast ? t.savedBtn : t.saveBtn}
              </span>
            </button>

            <Link
              href="/"
              className="inline-flex h-8 items-center rounded-full border border-white/20 bg-white/10 px-3 text-white hover:bg-white/20"
              title="Open Storefront"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {errorMsg ? (
        <div className="shrink-0 border-b border-red-400/30 bg-red-500/15 px-4 py-2 text-xs text-red-200">
          {errorMsg}
        </div>
      ) : null}

      {/* =======================================================================
          2-PANE SPLIT WORKSPACE WITH TWO INDEPENDENT SCROLL CONTAINERS
         ======================================================================= */}
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
        {/* PANE 1 (EDIT & 5 VAULTS PICKER) — INDEPENDENT SCROLL */}
        <aside className="w-full shrink-0 border-b border-white/10 bg-[#080612] lg:h-full lg:w-[440px] lg:overflow-y-auto lg:border-b-0 lg:border-e xl:w-[480px]">
          <div className="space-y-4 p-4">
            {/* Compact Block Selector Stack */}
            <div className="rounded-2xl border border-white/10 bg-black/45 p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  {t.blocksHeading} ({registry.blocks.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-bold text-black hover:opacity-90"
                >
                  {t.addBlock}
                </button>
              </div>

              <div className="space-y-1.5">
                {registry.blocks.map((blk, idx) => {
                  const isSel = activeBlock?.id === blk.id;
                  return (
                    <div
                      key={blk.id}
                      onClick={() => {
                        setSelectedBlockId(blk.id);
                        setSelectedItemId(null);
                      }}
                      className={`cursor-pointer rounded-xl border px-3 py-2 transition-all ${
                        isSel
                          ? "border-emerald-400 bg-emerald-500/15"
                          : "border-white/10 bg-[#0a0814] hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-white">
                          {idx + 1}. {blk.title || blk.internalName}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/70">
                            {blk.items.length}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBlock(blk.id, { isVisible: !blk.isVisible });
                            }}
                            className="p-1 text-white/65 hover:text-white"
                          >
                            {blk.isVisible ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-300" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(idx, -1);
                            }}
                            className="p-0.5 text-white/60 hover:text-white"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(idx, 1);
                            }}
                            className="p-0.5 text-white/60 hover:text-white"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateBlock(blk);
                            }}
                            className="p-0.5 text-white/60 hover:text-cyan-300"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(blk.id);
                            }}
                            className="p-0.5 text-red-300 hover:text-red-200"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeBlock ? (
              <>
                {/* Unified Sidebar Mode Switch (Merged Controls + 5 Lists cleanly) */}
                <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/60 p-1">
                  <button
                    type="button"
                    onClick={() => setEditorTab("catalog")}
                    className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${
                      editorTab === "catalog"
                        ? "bg-fuchsia-500 text-white"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t.editorTabs.catalog}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("items")}
                    className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${
                      editorTab === "items"
                        ? "bg-amber-400 text-black"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    <ListChecks className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {t.editorTabs.items} ({activeBlock.items.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("layout")}
                    className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${
                      editorTab === "layout"
                        ? "bg-cyan-400 text-black"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t.editorTabs.layout}</span>
                  </button>
                </div>

                {/* TAB 1: MERGED 5 CONNECTED VAULT LISTS */}
                {editorTab === "catalog" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-black/55 p-1">
                      {(
                        [
                          { key: "universes", icon: Sparkles, count: vaults.universes.length },
                          { key: "products", icon: Package, count: vaults.products.length },
                          { key: "packages", icon: Layers, count: vaults.packages.length },
                          { key: "text", icon: Type, count: vaults.elements.textBlocks.length },
                          {
                            key: "buttons",
                            icon: MousePointerClick,
                            count: vaults.elements.buttons.length,
                          },
                        ] as const
                      ).map((tab) => {
                        const Icon = tab.icon;
                        const active = sideTab === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setSideTab(tab.key)}
                            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center transition-colors ${
                              active
                                ? "bg-white text-black"
                                : "text-white/65 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="truncate text-[9px] font-bold">
                              {t.sideTabs[tab.key]}
                            </span>
                            <span className="font-mono text-[9px] opacity-70">
                              ({tab.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      {sideTab === "universes" &&
                        vaults.universes.map((u) => (
                          <div
                            key={u.id}
                            className="space-y-2 rounded-2xl border border-white/10 bg-black/45 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-bold text-white">
                                {u.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePlaceItem("UNIVERSE_CARD", u.id)}
                                className="shrink-0 rounded-full bg-fuchsia-500 px-3 py-1 text-[10px] font-bold text-white hover:opacity-90"
                              >
                                {t.addToBlock}
                              </button>
                            </div>
                            <div className="pointer-events-none overflow-hidden rounded-xl">
                              <StorefrontUniverseCard universe={u} />
                            </div>
                          </div>
                        ))}

                      {sideTab === "products" &&
                        vaults.products.map((p) => (
                          <div
                            key={p.id}
                            className="space-y-2 rounded-2xl border border-white/10 bg-black/45 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-bold text-white">
                                {p.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePlaceItem("PRODUCT_CARD", p.id)}
                                className="shrink-0 rounded-full bg-indigo-500 px-3 py-1 text-[10px] font-bold text-white hover:opacity-90"
                              >
                                {t.addToBlock}
                              </button>
                            </div>
                            <div className="pointer-events-none overflow-hidden rounded-xl">
                              <StorefrontProductBannerCard product={p} />
                            </div>
                          </div>
                        ))}

                      {sideTab === "packages" &&
                        vaults.packages.map((k) => (
                          <div
                            key={k.id}
                            className="space-y-2 rounded-2xl border border-white/10 bg-black/45 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-bold text-white">
                                {k.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePlaceItem("PACKAGE_CARD", k.id)}
                                className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-black hover:opacity-90"
                              >
                                {t.addToBlock}
                              </button>
                            </div>
                            <div className="pointer-events-none overflow-hidden rounded-xl">
                              <StorefrontPackageBannerCard pkg={k} />
                            </div>
                          </div>
                        ))}

                      {sideTab === "text" && (
                        <div className="space-y-3">
                          <Link
                            href="/admin/elements/"
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 py-2 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/25"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{t.openElementsVault}</span>
                          </Link>
                          {vaults.elements.textBlocks.map((tb) => (
                            <div
                              key={tb.id}
                              className="space-y-2 rounded-2xl border border-white/10 bg-black/45 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-bold text-white">
                                  {tb.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handlePlaceItem("TEXT_BLOCK", tb.id)}
                                  className="shrink-0 rounded-full bg-fuchsia-500 px-3 py-1 text-[10px] font-bold text-white hover:opacity-90"
                                >
                                  {t.addToBlock}
                                </button>
                              </div>
                              <div className="pointer-events-none flex justify-center overflow-hidden rounded-xl bg-[#040308] p-2">
                                <ReadingTextBlockView
                                  block={tb}
                                  buttons={vaults.elements.buttons}
                                  interactive={false}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {sideTab === "buttons" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Link
                              href="/admin/elements/"
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{t.openElementsVault}</span>
                            </Link>
                            {vaults.elements.buttons.map((bt) => (
                              <div
                                key={bt.id}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/45 p-3"
                              >
                                <div className="pointer-events-none">
                                  <ActionButtonView button={bt} interactive={false} />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handlePlaceItem("BUTTON", bt.id)}
                                  className="shrink-0 rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold text-black hover:opacity-90"
                                >
                                  {t.addToBlock}
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2.5 rounded-2xl border border-amber-400/35 bg-amber-500/[0.06] p-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                              <Minus className="h-4 w-4" />
                              <span>{t.dividerSection}</span>
                            </div>

                            <input
                              value={draftDivider.label}
                              placeholder="Optional label on divider"
                              onChange={(e) =>
                                setDraftDivider((p) => ({
                                  ...p,
                                  label: e.target.value,
                                }))
                              }
                              className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2.5 text-xs text-white"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={draftDivider.style}
                                onChange={(e) =>
                                  setDraftDivider((p) => ({
                                    ...p,
                                    style: e.target.value as DividerStyleConfig["style"],
                                  }))
                                }
                                className="h-8 rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                              >
                                <option value="glow">Glow Gradient</option>
                                <option value="solid">Solid Line</option>
                                <option value="dashed">Dashed Line</option>
                              </select>
                              <select
                                value={draftDivider.width}
                                onChange={(e) =>
                                  setDraftDivider((p) => ({
                                    ...p,
                                    width: e.target.value as DividerStyleConfig["width"],
                                  }))
                                }
                                className="h-8 rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                              >
                                <option value="full">Width: 100%</option>
                                <option value="3/4">Width: 75%</option>
                                <option value="1/2">Width: 50%</option>
                                <option value="1/3">Width: 33%</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={String(draftDivider.thickness)}
                                onChange={(e) =>
                                  setDraftDivider((p) => ({
                                    ...p,
                                    thickness: Number(e.target.value) as 1 | 2 | 3,
                                  }))
                                }
                                className="h-8 rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                              >
                                <option value="1">1px</option>
                                <option value="2">2px</option>
                                <option value="3">3px</option>
                              </select>
                              <select
                                value={draftDivider.align}
                                onChange={(e) =>
                                  setDraftDivider((p) => ({
                                    ...p,
                                    align: e.target.value as DividerStyleConfig["align"],
                                  }))
                                }
                                className="h-8 rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                              >
                                <option value="center">Center</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                              </select>
                              <input
                                type="color"
                                value={draftDivider.color}
                                onChange={(e) =>
                                  setDraftDivider((p) => ({
                                    ...p,
                                    color: e.target.value,
                                  }))
                                }
                                className="h-8 w-full rounded-lg border border-white/15 bg-transparent"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handlePlaceItem("DIVIDER", "divider", draftDivider)
                              }
                              className="w-full rounded-full bg-amber-400 py-2 text-xs font-bold text-black hover:opacity-90"
                            >
                              {t.addDividerBtn}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* TAB 2: PLACED ITEMS ORDER, WIDTH, ALIGN & DIVIDER EDITOR */}
                {editorTab === "items" ? (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/45 p-3.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      {t.placedItemsHeading} ({activeBlock.items.length})
                    </h3>

                    {activeBlock.items.length === 0 ? (
                      <p className="rounded-xl border border-white/10 bg-black/40 p-4 text-center text-xs text-white/55">
                        {t.emptyItems}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeBlock.items.map((item, idx) => {
                          const isItemSel = selectedItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedItemId(item.id)}
                              className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                                isItemSel
                                  ? "border-cyan-400 bg-cyan-500/15"
                                  : "border-white/10 bg-[#0a0814] hover:border-white/25"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-[11px] font-bold text-white">
                                  {idx + 1}. {describePlacedItem(item)}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      movePlacedItem(idx, -1);
                                    }}
                                    className="p-0.5 text-white/60 hover:text-white"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      movePlacedItem(idx, 1);
                                    }}
                                    className="p-0.5 text-white/60 hover:text-white"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removePlacedItem(item.id);
                                    }}
                                    className="p-0.5 text-red-300 hover:text-red-200"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <select
                                  value={item.width}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    updatePlacedItem(item.id, {
                                      width: e.target.value as ItemWidth,
                                    })
                                  }
                                  className="h-7 rounded border border-white/15 bg-black/60 px-1.5 text-[10px] text-white"
                                >
                                  <option value="auto">{t.itemWidthLabel}: Auto (Grid)</option>
                                  <option value="fit">{t.itemWidthLabel}: Fit Content</option>
                                  <option value="1/3">{t.itemWidthLabel}: 1/3</option>
                                  <option value="1/2">{t.itemWidthLabel}: 1/2</option>
                                  <option value="2/3">{t.itemWidthLabel}: 2/3</option>
                                  <option value="full">{t.itemWidthLabel}: Full Row</option>
                                </select>
                                <select
                                  value={item.align}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    updatePlacedItem(item.id, {
                                      align: e.target.value as ItemAlign,
                                    })
                                  }
                                  className="h-7 rounded border border-white/15 bg-black/60 px-1.5 text-[10px] text-white"
                                >
                                  <option value="center">{t.itemAlignLabel}: Center</option>
                                  <option value="start">{t.itemAlignLabel}: Start</option>
                                  <option value="end">{t.itemAlignLabel}: End</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedPlacedItem?.kind === "DIVIDER" ? (
                      <div className="space-y-2 rounded-xl border border-amber-400/35 bg-amber-500/[0.06] p-3">
                        <p className="text-[10px] font-bold uppercase text-amber-200">
                          {t.dividerEditSelected}
                        </p>
                        <input
                          value={selectedPlacedItem.dividerConfig?.label ?? ""}
                          placeholder="Optional text on line"
                          onChange={(e) =>
                            updatePlacedItem(selectedPlacedItem.id, {
                              dividerConfig: {
                                ...(selectedPlacedItem.dividerConfig ??
                                  DEFAULT_DIVIDER_CONFIG),
                                label: e.target.value,
                              },
                            })
                          }
                          className="h-7 w-full rounded border border-white/15 bg-black/60 px-2 text-[11px] text-white"
                        />
                        <div className="grid grid-cols-3 gap-1.5">
                          <select
                            value={selectedPlacedItem.dividerConfig?.style ?? "glow"}
                            onChange={(e) =>
                              updatePlacedItem(selectedPlacedItem.id, {
                                dividerConfig: {
                                  ...(selectedPlacedItem.dividerConfig ??
                                    DEFAULT_DIVIDER_CONFIG),
                                  style: e.target.value as DividerStyleConfig["style"],
                                },
                              })
                            }
                            className="h-7 rounded border border-white/15 bg-black/60 px-1 text-[10px]"
                          >
                            <option value="glow">Glow</option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                          </select>
                          <select
                            value={selectedPlacedItem.dividerConfig?.width ?? "full"}
                            onChange={(e) =>
                              updatePlacedItem(selectedPlacedItem.id, {
                                dividerConfig: {
                                  ...(selectedPlacedItem.dividerConfig ??
                                    DEFAULT_DIVIDER_CONFIG),
                                  width: e.target.value as DividerStyleConfig["width"],
                                },
                              })
                            }
                            className="h-7 rounded border border-white/15 bg-black/60 px-1 text-[10px]"
                          >
                            <option value="full">100%</option>
                            <option value="3/4">75%</option>
                            <option value="1/2">50%</option>
                            <option value="1/3">33%</option>
                          </select>
                          <input
                            type="color"
                            value={
                              selectedPlacedItem.dividerConfig?.color ?? "#c94b99"
                            }
                            onChange={(e) =>
                              updatePlacedItem(selectedPlacedItem.id, {
                                dividerConfig: {
                                  ...(selectedPlacedItem.dividerConfig ??
                                    DEFAULT_DIVIDER_CONFIG),
                                  color: e.target.value,
                                },
                              })
                            }
                            className="h-7 w-full rounded border border-white/15 bg-transparent"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* TAB 3: BLOCK HEADER & RESPONSIVE GRID SETTINGS */}
                {editorTab === "layout" ? (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-black/45 p-3.5">
                    <div className="space-y-2.5">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        {t.blockHeaderSection}
                      </h3>
                      <div className="flex gap-2">
                        <input
                          value={activeBlock.eyebrow}
                          placeholder={t.eyebrowLabel}
                          onChange={(e) =>
                            updateBlock(activeBlock.id, { eyebrow: e.target.value })
                          }
                          className="h-8 flex-1 rounded-lg border border-white/15 bg-black/55 px-2.5 text-xs text-white"
                        />
                        <input
                          type="color"
                          value={activeBlock.eyebrowColor}
                          onChange={(e) =>
                            updateBlock(activeBlock.id, {
                              eyebrowColor: e.target.value,
                            })
                          }
                          className="h-8 w-9 rounded border border-white/15 bg-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={activeBlock.title}
                          placeholder={t.titleLabel}
                          onChange={(e) =>
                            updateBlock(activeBlock.id, { title: e.target.value })
                          }
                          className="h-8 flex-1 rounded-lg border border-white/15 bg-black/55 px-2.5 text-xs font-semibold text-white"
                        />
                        <input
                          type="color"
                          value={activeBlock.titleColor}
                          onChange={(e) =>
                            updateBlock(activeBlock.id, { titleColor: e.target.value })
                          }
                          className="h-8 w-9 rounded border border-white/15 bg-transparent"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={activeBlock.subtitle}
                        placeholder={t.subtitleLabel}
                        onChange={(e) =>
                          updateBlock(activeBlock.id, { subtitle: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/55 p-2 text-xs text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.headerAlignLabel}
                          </label>
                          <select
                            value={activeBlock.headerAlign}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                headerAlign: e.target.value as
                                  | "left"
                                  | "center"
                                  | "right",
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.startDirLabel}
                          </label>
                          <select
                            value={activeBlock.startDirection}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                startDirection: e.target.value as "ltr" | "rtl",
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                          >
                            <option value="ltr">{t.dirLeft}</option>
                            <option value="rtl">{t.dirRight}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 border-t border-white/10 pt-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        {t.layoutSection}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.desktopColsLabel}
                          </label>
                          <select
                            value={String(activeBlock.desktopCols)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              updateBlock(activeBlock.id, {
                                desktopCols: (raw === "auto"
                                  ? "auto"
                                  : Number(raw)) as DesktopCols,
                              });
                            }}
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                          >
                            <option value="auto">{t.autoCol}</option>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>
                                {n} Cols
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.mobileColsLabel}
                          </label>
                          <select
                            value={String(activeBlock.mobileCols)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              updateBlock(activeBlock.id, {
                                mobileCols: (raw === "auto"
                                  ? "auto"
                                  : Number(raw)) as MobileCols,
                              });
                            }}
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                          >
                            <option value="auto">{t.autoCol}</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n} Cols
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.containerWidthLabel}
                          </label>
                          <select
                            value={activeBlock.containerWidth}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                containerWidth: e.target.value as HomeBlock["containerWidth"],
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                          >
                            <option value="narrow">Narrow (4xl)</option>
                            <option value="standard">Standard (6xl)</option>
                            <option value="wide">Wide (7xl)</option>
                            <option value="full">Full Width</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.gapLabel}
                          </label>
                          <select
                            value={activeBlock.gap}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                gap: e.target.value as HomeBlock["gap"],
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white"
                          >
                            <option value="sm">Compact</option>
                            <option value="md">Standard</option>
                            <option value="lg">Wide</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.padLabel}
                          </label>
                          <select
                            value={activeBlock.paddingY}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                paddingY: e.target.value as HomeBlock["paddingY"],
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-1.5 text-xs text-white"
                          >
                            <option value="sm">SM</option>
                            <option value="md">MD</option>
                            <option value="lg">LG</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.radiusLabel}
                          </label>
                          <select
                            value={activeBlock.borderRadius}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                borderRadius: e.target.value as HomeBlock["borderRadius"],
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-1.5 text-xs text-white"
                          >
                            <option value="sharp">Sharp</option>
                            <option value="rounded">Rounded</option>
                            <option value="pill">Pill</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-white/55">
                            {t.bgColorLabel}
                          </label>
                          <input
                            dir="ltr"
                            value={activeBlock.bgColor}
                            onChange={(e) =>
                              updateBlock(activeBlock.id, {
                                bgColor: e.target.value,
                              })
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 font-mono text-[10px] text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/45 p-6 text-center text-xs text-white/50">
                {t.noBlockSelected}
              </div>
            )}
          </div>
        </aside>

        {/* PANE 2 (SCALED NATURAL PROPORTIONS LIVE PREVIEW) — INDEPENDENT SCROLL */}
        <main
          className="flex-1 bg-[#030207] p-4 md:p-6 lg:h-full lg:overflow-y-auto"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
            {t.previewHeading} •{" "}
            {viewport === "mobile"
              ? "Mobile (390px)"
              : `Desktop (1280px @ ${Math.round(previewZoom * 100)}%)`}
          </p>

          <div className="flex justify-center pb-10">
            <div
              className="overflow-hidden rounded-3xl border border-white/15 bg-[var(--color-bg-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
              style={
                viewport === "mobile"
                  ? { width: 390 }
                  : { width: 1280, zoom: previewZoom }
              }
            >
              {registry.showStarHeader ? (
                <UniverseStarHeader
                  universes={[]}
                  disableRemoteSync
                  customNodes={vaults.universes
                    .filter((u) => u.isActive)
                    .map((u) => ({
                      id: u.id,
                      slug: u.slug,
                      name: u.name,
                      iconPngUrl: u.iconPngUrl,
                    }))}
                />
              ) : null}

              {registry.blocks.map((blk) => {
                const isSelectedBlk = activeBlock?.id === blk.id;
                return (
                  <div
                    key={blk.id}
                    onClick={() => setSelectedBlockId(blk.id)}
                    className={`relative cursor-pointer transition-all ${
                      isSelectedBlk
                        ? "ring-2 ring-emerald-400/75"
                        : "hover:ring-1 hover:ring-white/25"
                    } ${!blk.isVisible ? "opacity-40" : ""}`}
                  >
                    {!blk.isVisible ? (
                      <span className="absolute right-3 top-3 z-20 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                        {t.hiddenBadge}
                      </span>
                    ) : null}
                    <HomeComposerBlockRenderer
                      block={blk}
                      vaults={vaults}
                      interactive={false}
                      forceMobilePreview={viewport === "mobile"}
                      selectedItemId={isSelectedBlk ? selectedItemId : null}
                      onSelectItem={(itemId) => {
                        setSelectedBlockId(blk.id);
                        setSelectedItemId(itemId);
                        setEditorTab("items");
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
