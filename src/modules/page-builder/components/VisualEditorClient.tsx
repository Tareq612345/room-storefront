/**
 * @file src/modules/page-builder/components/VisualEditorClient.tsx
 * @purpose Complete Shopify-style Visual Block & Theme Studio (/admin/editor/): Create unlimited empty Blocks, Drag & Drop Widgets into Blocks, control Grid Columns/Sizes/Colors/Titles, and edit full site Theme & Universe colors live with Supabase sync.
 */

"use client";

import type { BundleSummaryDTO } from "@modules/bundles";
import type { ProductSummaryDTO } from "@modules/catalog";
import type { UniverseDTO } from "@modules/universes";
import { UniverseStarHeader } from "@modules/universes";
import { sbDelete, sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  Languages,
  Layers,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Shapes,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BlockWidgetRenderer,
  type BlockConfig,
  type BlockWidget,
  type RenderedBlock,
  type WidgetKind,
} from "./BlockWidgetRenderer";

interface VisualEditorClientProps {
  storeId: string;
  initialUniverses: UniverseDTO[];
  initialFreshDrops: ProductSummaryDTO[];
  initialLoadouts: BundleSummaryDTO[];
}

interface EditorBlock extends RenderedBlock {
  isPersisted: boolean;
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

const WIDGET_PALETTE: {
  kind: WidgetKind;
  arLabel: string;
  enLabel: string;
  arDesc: string;
  enDesc: string;
}[] = [
  {
    kind: "UNIVERSE_CARDS",
    arLabel: "بطاقات الأقسام الـ 3",
    enLabel: "Universe Cards",
    arDesc: "عرض الأقسام بتدرجاتها",
    enDesc: "3-card Universe showcase",
  },
  {
    kind: "PRODUCT_CARDS",
    arLabel: "شبكة المنتجات",
    enLabel: "Products Grid",
    arDesc: "كروت المنتجات بـ 1-4 أعمدة",
    enDesc: "Product cards (1-4 cols)",
  },
  {
    kind: "LOADOUT_CARDS",
    arLabel: "بطاقات الباقات (Loadouts)",
    enLabel: "Loadouts Grid",
    arDesc: "باقات الغرفة الكاملة",
    enDesc: "Curated room bundles",
  },
  {
    kind: "PROMO_BANNER",
    arLabel: "بانر ترويجي + زر",
    enLabel: "Promo Banner + CTA",
    arDesc: "بانر عرض ملون بزر مخصص",
    enDesc: "Accent banner with CTA",
  },
  {
    kind: "TEXT_BLOCK",
    arLabel: "عنصر نص وعنوان",
    enLabel: "Text & Heading",
    arDesc: "عنوان ونص تعريفي مع تحكم في اللون والمحاذاة",
    enDesc: "Heading & copy with color and alignment",
  },
  {
    kind: "CTA_BUTTON",
    arLabel: "عنصر زر مخصص",
    enLabel: "Custom CTA Button",
    arDesc: "زر تتحكم في لونه ونصه والرابط الذي يفتح عند الضغط",
    enDesc: "Button with custom label, color, and destination link",
  },
  {
    kind: "FEATURE_PILLS",
    arLabel: "شريط مميزات المتجر",
    enLabel: "Feature Pills",
    arDesc: "التوصيل والدفع والخامة",
    enDesc: "Delivery, COD & quality",
  },
  {
    kind: "DIVIDER",
    arLabel: "خط فاصل مضيء",
    enLabel: "Glow Divider",
    arDesc: "فاصل أنيق بين الأقسام",
    enDesc: "Subtle gradient divider",
  },
];

const DEFAULT_BLOCKS: EditorBlock[] = [
  {
    id: "sec_univ",
    type: "UNIVERSE_QUICK_BAR",
    title: "",
    subtitle: "",
    visible: true,
    isPersisted: false,
    config: {
      eyebrow: "",
      columns: 3,
      paddingY: "sm",
      borderRadius: "rounded",
      widgets: [{ id: "w_univ", kind: "UNIVERSE_CARDS" }],
    },
  },
  {
    id: "sec_fresh",
    type: "NEW_ARRIVALS",
    title: "Fresh Drops",
    subtitle: "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
    visible: true,
    isPersisted: false,
    config: {
      eyebrow: "New Arrivals",
      columns: 4,
      paddingY: "md",
      borderRadius: "rounded",
      widgets: [{ id: "w_prod", kind: "PRODUCT_CARDS" }],
    },
  },
  {
    id: "sec_loadouts",
    type: "FEATURED_BUNDLES",
    title: "Signature Loadouts",
    subtitle: "Full room setups bundled for maximum drip & instant savings",
    visible: true,
    isPersisted: false,
    config: {
      eyebrow: "Room Bundles",
      columns: 3,
      paddingY: "md",
      borderRadius: "rounded",
      widgets: [{ id: "w_load", kind: "LOADOUT_CARDS" }],
    },
  },
];

const COPY = {
  ar: {
    title: "استوديو ROOM البصري",
    subtitle: "أضف بلوكات، اسحب العناصر داخلها، وتحكم في كل الألوان والمقاسات",
    backAdmin: "الأدمن",
    viewLive: "المتجر",
    savePublish: "حفظ ونشر للجميع",
    saving: "جاري النشر...",
    saved: "تم النشر!",
    tabBlocks: "البلوكات",
    tabWidgets: "العناصر",
    tabColors: "الألوان والثيم",
    addEmptyBlock: "+ إضافة بلوك جديد (فارغ)",
    emptyBlockName: "بلوك جديد",
    blockInspector: "تخصيص البلوك المحدد",
    eyebrowLabel: "الاسم العلوي (فوق العنوان)",
    titleLabel: "العنوان الرئيسي",
    subtitleLabel: "الوصف الفرعي",
    columnsLabel: "عدد الأعمدة (الصفوف)",
    paddingLabel: "المساحة الرأسية",
    radiusLabel: "استدارة الحواف",
    bgLabel: "خلفية البلوك",
    accentLabel: "لون البلوك",
    widgetsInBlock: "العناصر داخل هذا البلوك",
    noWidgets: "هذا البلوك فارغ. اسحب أي عنصر من تبويب (العناصر) أو اضغط لإضافته.",
    dragWidgetHint: "اسحب أي عنصر وأفلته داخل أي بلوك على المعاينة، أو اضغط + لإضافته للبلوك المحدد",
    addToSelected: "+ أضف للبلوك",
    siteColorsTitle: "ألوان الموقع بالكامل",
    universeColorsTitle: "ألوان الأقسام (Universes)",
    presetsTitle: "قوالب الإيفنتات",
    presetPlaceholder: "اسم الإيفنت (مثل: رمضان)",
    savePreset: "حفظ كثيم",
    restoreDefault: "استرجاع ثيم ROOM الأساسي",
    apply: "تطبيق",
  },
  en: {
    title: "ROOM Visual Studio",
    subtitle: "Add empty blocks, drag widgets inside them, and control all colors & grids live",
    backAdmin: "Admin",
    viewLive: "Store",
    savePublish: "Save & Publish",
    saving: "Publishing...",
    saved: "Published!",
    tabBlocks: "Blocks",
    tabWidgets: "Widgets",
    tabColors: "Colors & Theme",
    addEmptyBlock: "+ Add Empty Block",
    emptyBlockName: "New Block",
    blockInspector: "Selected Block Settings",
    eyebrowLabel: "Top Eyebrow Label",
    titleLabel: "Section Title",
    subtitleLabel: "Subtitle",
    columnsLabel: "Grid Columns (Rows)",
    paddingLabel: "Vertical Spacing",
    radiusLabel: "Corner Radius",
    bgLabel: "Block Background",
    accentLabel: "Block Accent",
    widgetsInBlock: "Widgets Inside This Block",
    noWidgets: "Block is empty. Drag any widget from the Widgets tab or click + to add.",
    dragWidgetHint: "Drag any widget directly onto a block on the canvas, or click + to add to selected block",
    addToSelected: "+ Add to Block",
    siteColorsTitle: "Site Canvas & Home Accent",
    universeColorsTitle: "Universe Accent Colors",
    presetsTitle: "Event Theme Presets",
    presetPlaceholder: "Event name (e.g. Ramadan)",
    savePreset: "Save Preset",
    restoreDefault: "Restore ROOM Default",
    apply: "Apply",
  },
} as const;

export function VisualEditorClient({
  storeId,
  initialUniverses,
  initialFreshDrops,
  initialLoadouts,
}: VisualEditorClientProps) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = COPY[lang];

  const [sidebarTab, setSidebarTab] = useState<"blocks" | "widgets" | "colors">("blocks");
  const [blocks, setBlocks] = useState<EditorBlock[]>(DEFAULT_BLOCKS);
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_BLOCKS[0]?.id ?? "");

  const [dragBlockIdx, setDragBlockIdx] = useState<number | null>(null);
  const [dragWidgetKind, setDragWidgetKind] = useState<WidgetKind | null>(null);

  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openHintId, setOpenHintId] = useState<string | null>(null);

  // Live Theme & Universe Colors
  const [universes, setUniverses] = useState<UniverseDTO[]>(initialUniverses);
  const [bgPrimary, setBgPrimary] = useState("#05030a");
  const [bgSecondary, setBgSecondary] = useState("#0b0617");
  const [bgElevated, setBgElevated] = useState("#140b29");
  const [defaultAccent, setDefaultAccent] = useState("#ffffff");
  const [presets, setPresets] = useState<ThemePreset[]>([ROOM_DEFAULT_PRESET]);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rows, sbStores, sbUnivs] = await Promise.all([
          sbSelect<{
            id: string;
            type: string;
            title: string | null;
            subtitle: string | null;
            isVisible: boolean;
            sortOrder: number;
            config: BlockConfig | null;
          }>(
            "page_sections",
            "select=id,type,title,subtitle,isVisible,sortOrder,config&pageKey=eq.home&order=sortOrder.asc"
          ),
          sbSelect<{
            defaultAccentColor: string;
            themeTokens: {
              bgPrimary?: string;
              bgSecondary?: string;
              bgElevated?: string;
              presets?: ThemePreset[];
            };
          }>(
            "store_configs",
            "select=defaultAccentColor,themeTokens&slug=eq.room-egypt"
          ),
          sbSelect<{ id: string; slug: string; accentColor: string; name: string; tagline: string | null }>(
            "universes",
            "select=id,slug,accentColor,name,tagline&order=sortOrder.asc"
          ),
        ]);

        if (!active) return;

        if (rows.length > 0) {
          const loaded: EditorBlock[] = rows.map((r) => {
            const cfg = r.config && typeof r.config === "object" ? r.config : {};
            const hasWidgets = Array.isArray(cfg.widgets);
            const fallbackWidgets: BlockWidget[] = hasWidgets
              ? (cfg.widgets ?? [])
              : r.type === "UNIVERSE_QUICK_BAR"
                ? [{ id: `${r.id}_w`, kind: "UNIVERSE_CARDS" }]
                : r.type === "NEW_ARRIVALS"
                  ? [{ id: `${r.id}_w`, kind: "PRODUCT_CARDS" }]
                  : r.type === "FEATURED_BUNDLES"
                    ? [{ id: `${r.id}_w`, kind: "LOADOUT_CARDS" }]
                    : [];

            return {
              id: r.id,
              type: r.type,
              title: r.title ?? "",
              subtitle: r.subtitle ?? "",
              visible: r.isVisible,
              isPersisted: true,
              config: {
                columns: 4,
                paddingY: "md",
                borderRadius: "rounded",
                ...cfg,
                widgets: fallbackWidgets,
              },
            };
          });
          setBlocks(loaded);
          setSelectedId(loaded[0]?.id ?? "");
        }

        if (sbStores[0]) {
          const st = sbStores[0];
          setDefaultAccent(st.defaultAccentColor);
          if (st.themeTokens?.bgPrimary) setBgPrimary(st.themeTokens.bgPrimary);
          if (st.themeTokens?.bgSecondary) setBgSecondary(st.themeTokens.bgSecondary);
          if (st.themeTokens?.bgElevated) setBgElevated(st.themeTokens.bgElevated);
          const savedP = st.themeTokens?.presets ?? [];
          setPresets([
            ROOM_DEFAULT_PRESET,
            ...savedP.filter((p) => p.id !== ROOM_DEFAULT_PRESET.id),
          ]);
        }

        if (sbUnivs.length > 0) {
          setUniverses((prev) =>
            prev.map((u) => {
              const m = sbUnivs.find((s) => s.slug === u.slug);
              return m
                ? {
                    ...u,
                    accentColor: m.accentColor,
                    name: m.name,
                    tagline: m.tagline,
                  }
                : u;
            })
          );
        }
      } catch {
        // Keep initial props
      }
    })();
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
          className={`mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
            isOpen
              ? "border-cyan-400 bg-cyan-500/25 text-cyan-200"
              : "border-white/25 bg-white/5 text-white/60 hover:border-cyan-400/60 hover:text-cyan-200"
          }`}
          aria-label="Info"
        >
          <Info className="h-2.5 w-2.5" />
        </button>
        {isOpen ? (
          <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-cyan-400/35 bg-[#090714] p-2.5 text-[11px] font-normal leading-relaxed text-white/95 shadow-2xl">
            {lang === "ar" ? ar : en}
          </span>
        ) : null}
      </span>
    );
  };

  const renderWidgetPreview = (kind: WidgetKind) => {
    if (kind === "UNIVERSE_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {["#d92323", "#6366f1", "#c94b99"].map((c) => (
            <div
              key={c}
              className="flex h-11 items-end rounded-md p-1"
              style={{ background: `linear-gradient(180deg, #07050c 0%, ${c} 100%)` }}
            >
              <div className="h-2 w-full rounded-sm bg-black/65" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PRODUCT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1">
              <div className="h-5 rounded-sm bg-white/10" />
              <div className="mt-1 h-1.5 w-3/4 rounded bg-white/30" />
              <div className="mt-1 flex justify-between">
                <div className="h-1.5 w-1/3 rounded bg-white/50" />
                <div className="h-1.5 w-1/3 rounded bg-cyan-400/70" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (kind === "LOADOUT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1.5">
              <div className="flex justify-between">
                <div className="h-1.5 w-6 rounded bg-white/25" />
                <div className="h-1.5 w-6 rounded bg-pink-500/70" />
              </div>
              <div className="mt-1.5 h-2 w-4/5 rounded bg-white/40" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-white/70" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PROMO_BANNER") {
      return (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-gradient-to-r from-[#090612] to-[#c94b99]/35 px-2.5 py-2.5">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded bg-white/70" />
            <div className="h-1.5 w-28 rounded bg-white/30" />
          </div>
          <div className="h-4 w-12 rounded-full bg-[#c94b99]" />
        </div>
      );
    }
    if (kind === "TEXT_BLOCK") {
      return (
        <div className="mt-2 flex flex-col items-center rounded-lg border border-white/10 bg-black/50 px-3 py-2.5">
          <div className="h-2 w-24 rounded bg-white/70" />
          <div className="mt-1.5 h-1.5 w-36 rounded bg-white/30" />
        </div>
      );
    }
    if (kind === "CTA_BUTTON") {
      return (
        <div className="mt-2 flex justify-center rounded-lg border border-white/10 bg-black/50 py-2.5">
          <div className="h-4 w-24 rounded-full bg-cyan-400/80" />
        </div>
      );
    }
    if (kind === "FEATURE_PILLS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-5 items-center justify-center rounded border border-white/10 bg-[#120e1c]">
              <div className="h-1.5 w-8 rounded bg-white/45" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-2 flex h-6 items-center rounded-lg bg-black/50 px-3">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    );
  };

  return () => {
      active = false;
    };
  }, []);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? blocks[0] ?? null;

  const handleAddEmptyBlock = () => {
    const newBlock: EditorBlock = {
      id: generateClientId("blk"),
      type: "CATEGORY_SPOTLIGHT",
      title: t.emptyBlockName,
      subtitle: "",
      visible: true,
      isPersisted: false,
      config: {
        eyebrow: "CUSTOM SECTION",
        columns: 3,
        paddingY: "md",
        borderRadius: "rounded",
        widgets: [],
      },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
    setSidebarTab("widgets");
    setTimeout(() => {
      document
        .querySelector(`[data-block-id="${newBlock.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const handleDeleteBlock = (block: EditorBlock) => {
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    if (block.isPersisted) {
      setDeletedBlockIds((prev) => [...prev, block.id]);
    }
  };

  const addWidgetToBlock = (blockId: string, kind: WidgetKind) => {
    const newWidget: BlockWidget = {
      id: generateClientId("w"),
      kind,
      heading:
        kind === "PROMO_BANNER"
          ? "Midnight Cairo Drop"
          : kind === "TEXT_BLOCK"
            ? "Crafted for Your Universe"
            : undefined,
      body:
        kind === "PROMO_BANNER"
          ? "Limited-run dark textiles with express Cairo delivery."
          : kind === "TEXT_BLOCK"
            ? "Transform your bedroom into a personal Universe."
            : undefined,
      ctaLabel:
        kind === "PROMO_BANNER"
          ? "Claim Yours"
          : kind === "CTA_BUTTON"
            ? "Explore Universe →"
            : undefined,
      ctaUrl:
        kind === "PROMO_BANNER" || kind === "CTA_BUTTON"
          ? "/universes/cars"
          : undefined,
      accentColor:
        kind === "PROMO_BANNER" || kind === "CTA_BUTTON"
          ? "#c94b99"
          : undefined,
      textColor:
        kind === "PROMO_BANNER" || kind === "CTA_BUTTON" || kind === "TEXT_BLOCK"
          ? "#ffffff"
          : undefined,
    };

    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              config: {
                ...b.config,
                widgets: [...(b.config.widgets ?? []), newWidget],
              },
            }
          : b
      )
    );
    setSelectedId(blockId);
  };

  const removeWidgetFromBlock = (blockId: string, widgetId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              config: {
                ...b.config,
                widgets: (b.config.widgets ?? []).filter((w) => w.id !== widgetId),
              },
            }
          : b
      )
    );
  };

  const updateWidget = (
    blockId: string,
    widgetId: string,
    patch: Partial<BlockWidget>
  ) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              config: {
                ...b.config,
                widgets: (b.config.widgets ?? []).map((w) =>
                  w.id === widgetId ? { ...w, ...patch } : w
                ),
              },
            }
          : b
      )
    );
  };

  const updateSelectedBlock = (patch: Partial<EditorBlock>) => {
    if (!selectedBlock) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlock.id ? { ...b, ...patch } : b))
    );
  };

  const updateSelectedConfig = (patch: Partial<BlockConfig>) => {
    if (!selectedBlock) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selectedBlock.id
          ? { ...b, config: { ...b.config, ...patch } }
          : b
      )
    );
  };

  const handleCanvasDrop = (targetIdx: number, targetBlockId: string) => {
    if (dragWidgetKind) {
      addWidgetToBlock(targetBlockId, dragWidgetKind);
      setDragWidgetKind(null);
      return;
    }
    if (dragBlockIdx !== null && dragBlockIdx !== targetIdx) {
      setBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragBlockIdx, 1);
        if (!moved) return prev;
        next.splice(targetIdx, 0, moved);
        return next;
      });
    }
    setDragBlockIdx(null);
  };

  const handleApplyPreset = (preset: ThemePreset) => {
    setBgPrimary(preset.bgPrimary);
    setBgSecondary(preset.bgSecondary);
    setBgElevated(preset.bgElevated);
    setDefaultAccent(preset.defaultAccent);
    setUniverses((prev) =>
      prev.map((u) => ({
        ...u,
        accentColor: preset.universeColors[u.slug] ?? u.accentColor,
      }))
    );
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const univColors: Record<string, string> = {};
    for (const u of universes) univColors[u.slug] = u.accentColor;

    setPresets((prev) => [
      ...prev,
      {
        id: generateClientId("preset"),
        name: newPresetName.trim(),
        bgPrimary,
        bgSecondary,
        bgElevated,
        defaultAccent,
        universeColors: univColors,
      },
    ]);
    setNewPresetName("");
  };

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();

      // 1. Delete removed persisted blocks
      if (deletedBlockIds.length > 0) {
        await Promise.all(
          deletedBlockIds.map((id) =>
            sbDelete("page_sections", `id=eq.${encodeURIComponent(id)}`)
          )
        );
        setDeletedBlockIds([]);
      }

      // 2. Save all Blocks & Widgets to page_sections
      const savedBlocks = await Promise.all(
        blocks.map(async (b, idx) => {
          if (b.isPersisted) {
            await sbPatch("page_sections", `id=eq.${encodeURIComponent(b.id)}`, {
              title: b.title,
              subtitle: b.subtitle,
              isVisible: b.visible,
              sortOrder: idx + 1,
              config: b.config,
              updatedAt: nowIso,
            });
            return b;
          } else {
            const newId = generateClientId("sec");
            await sbInsert("page_sections", {
              id: newId,
              storeId,
              pageKey: "home",
              type: b.type,
              title: b.title,
              subtitle: b.subtitle,
              sortOrder: idx + 1,
              isVisible: b.visible,
              config: b.config,
              updatedAt: nowIso,
            });
            return { ...b, id: newId, isPersisted: true };
          }
        })
      );
      setBlocks(savedBlocks);

      // 3. Save Full Site Colors & Presets to store_configs + universes
      await Promise.all([
        sbPatch("store_configs", "slug=eq.room-egypt", {
          defaultAccentColor: defaultAccent,
          themeTokens: {
            bgPrimary,
            bgSecondary,
            bgElevated,
            defaultAccent,
            presets: presets.filter((p) => !p.isDefault),
          },
          updatedAt: nowIso,
        }),
        ...universes.map((u) =>
          sbPatch("universes", `slug=eq.${encodeURIComponent(u.slug)}`, {
            accentColor: u.accentColor,
            updatedAt: nowIso,
          })
        ),
      ]);

      const univMap: Record<string, string> = {};
      for (const u of universes) univMap[u.slug] = u.accentColor;
      localStorage.setItem(
        "room_theme_snapshot_v1",
        JSON.stringify({
          bgPrimary,
          bgSecondary,
          bgElevated,
          defaultAccent,
          universes: univMap,
        })
      );
      localStorage.removeItem("room_live_universes_v1");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore network errors
    } finally {
      setSaving(false);
    }
  };

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
          className={`mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
            isOpen
              ? "border-cyan-400 bg-cyan-500/25 text-cyan-200"
              : "border-white/25 bg-white/5 text-white/60 hover:border-cyan-400/60 hover:text-cyan-200"
          }`}
          aria-label="Info"
        >
          <Info className="h-2.5 w-2.5" />
        </button>
        {isOpen ? (
          <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-cyan-400/35 bg-[#090714] p-2.5 text-[11px] font-normal leading-relaxed text-white/95 shadow-2xl">
            {lang === "ar" ? ar : en}
          </span>
        ) : null}
      </span>
    );
  };

  const renderWidgetPreview = (kind: WidgetKind) => {
    if (kind === "UNIVERSE_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {["#d92323", "#6366f1", "#c94b99"].map((c) => (
            <div
              key={c}
              className="flex h-11 items-end rounded-md p-1"
              style={{ background: `linear-gradient(180deg, #07050c 0%, ${c} 100%)` }}
            >
              <div className="h-2 w-full rounded-sm bg-black/65" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PRODUCT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1">
              <div className="h-5 rounded-sm bg-white/10" />
              <div className="mt-1 h-1.5 w-3/4 rounded bg-white/30" />
              <div className="mt-1 flex justify-between">
                <div className="h-1.5 w-1/3 rounded bg-white/50" />
                <div className="h-1.5 w-1/3 rounded bg-cyan-400/70" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (kind === "LOADOUT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1.5">
              <div className="flex justify-between">
                <div className="h-1.5 w-6 rounded bg-white/25" />
                <div className="h-1.5 w-6 rounded bg-pink-500/70" />
              </div>
              <div className="mt-1.5 h-2 w-4/5 rounded bg-white/40" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-white/70" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PROMO_BANNER") {
      return (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-gradient-to-r from-[#090612] to-[#c94b99]/35 px-2.5 py-2.5">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded bg-white/70" />
            <div className="h-1.5 w-28 rounded bg-white/30" />
          </div>
          <div className="h-4 w-12 rounded-full bg-[#c94b99]" />
        </div>
      );
    }
    if (kind === "TEXT_BLOCK") {
      return (
        <div className="mt-2 flex flex-col items-center rounded-lg border border-white/10 bg-black/50 px-3 py-2.5">
          <div className="h-2 w-24 rounded bg-white/70" />
          <div className="mt-1.5 h-1.5 w-36 rounded bg-white/30" />
        </div>
      );
    }
    if (kind === "CTA_BUTTON") {
      return (
        <div className="mt-2 flex justify-center rounded-lg border border-white/10 bg-black/50 py-2.5">
          <div className="h-4 w-24 rounded-full bg-cyan-400/80" />
        </div>
      );
    }
    if (kind === "FEATURE_PILLS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-5 items-center justify-center rounded border border-white/10 bg-[#120e1c]">
              <div className="h-1.5 w-8 rounded bg-white/45" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-2 flex h-6 items-center rounded-lg bg-black/50 px-3">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    );
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="flex h-screen flex-col overflow-hidden bg-[#040308] text-white"
    >
      {/* Top Studio Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#080612] px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.backAdmin}</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <h1 className="font-serif text-sm font-semibold tracking-wider">
                {t.title}
              </h1>
            </div>
            <p className="hidden text-[11px] text-white/50 sm:block">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-white/15 bg-black/50 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              aria-label="Desktop View"
              title="Desktop View"
              className={`rounded-full p-1.5 ${
                viewport === "desktop" ? "bg-white text-black" : "text-white/60"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              aria-label="Mobile View"
              title="Mobile View"
              className={`rounded-full p-1.5 ${
                viewport === "mobile" ? "bg-white text-black" : "text-white/60"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLang((p) => (p === "ar" ? "en" : "ar"))}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-200"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>

          <Link
            href="/"
            className="hidden h-9 items-center rounded-full border border-white/15 px-3.5 text-xs font-semibold text-white/80 hover:text-white sm:inline-flex"
          >
            {t.viewLive}
          </Link>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveAndPublish()}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-5 text-xs font-bold uppercase tracking-wider transition-all ${
              saved
                ? "bg-emerald-500 text-black"
                : "bg-white text-black hover:opacity-90"
            }`}
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? t.saving : saved ? t.saved : t.savePublish}</span>
          </button>
        </div>
      </header>

      {/* Split-Screen Studio */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Studio Sidebar */}
        <aside className="flex w-80 sm:w-96 shrink-0 flex-col border-e border-white/10 bg-[#080611]">
          {/* Sidebar Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 border-b border-white/10 p-2">
            {[
              { id: "blocks" as const, label: t.tabBlocks, icon: <Layers className="h-3.5 w-3.5" /> },
              { id: "widgets" as const, label: t.tabWidgets, icon: <Shapes className="h-3.5 w-3.5" /> },
              { id: "colors" as const, label: t.tabColors, icon: <Palette className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSidebarTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition-colors ${
                  sidebarTab === tab.id
                    ? "bg-white text-black"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* TAB 1: BLOCKS & BLOCK INSPECTOR */}
            {sidebarTab === "blocks" ? (
              <>
                <button
                  type="button"
                  onClick={handleAddEmptyBlock}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-400/50 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addEmptyBlock}</span>
                </button>

                <div className="space-y-2">
                  {blocks.map((blk, idx) => {
                    const isSelected = blk.id === selectedBlock?.id;
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
          className={`mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
            isOpen
              ? "border-cyan-400 bg-cyan-500/25 text-cyan-200"
              : "border-white/25 bg-white/5 text-white/60 hover:border-cyan-400/60 hover:text-cyan-200"
          }`}
          aria-label="Info"
        >
          <Info className="h-2.5 w-2.5" />
        </button>
        {isOpen ? (
          <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-cyan-400/35 bg-[#090714] p-2.5 text-[11px] font-normal leading-relaxed text-white/95 shadow-2xl">
            {lang === "ar" ? ar : en}
          </span>
        ) : null}
      </span>
    );
  };

  const renderWidgetPreview = (kind: WidgetKind) => {
    if (kind === "UNIVERSE_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {["#d92323", "#6366f1", "#c94b99"].map((c) => (
            <div
              key={c}
              className="flex h-11 items-end rounded-md p-1"
              style={{ background: `linear-gradient(180deg, #07050c 0%, ${c} 100%)` }}
            >
              <div className="h-2 w-full rounded-sm bg-black/65" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PRODUCT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1">
              <div className="h-5 rounded-sm bg-white/10" />
              <div className="mt-1 h-1.5 w-3/4 rounded bg-white/30" />
              <div className="mt-1 flex justify-between">
                <div className="h-1.5 w-1/3 rounded bg-white/50" />
                <div className="h-1.5 w-1/3 rounded bg-cyan-400/70" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (kind === "LOADOUT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1.5">
              <div className="flex justify-between">
                <div className="h-1.5 w-6 rounded bg-white/25" />
                <div className="h-1.5 w-6 rounded bg-pink-500/70" />
              </div>
              <div className="mt-1.5 h-2 w-4/5 rounded bg-white/40" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-white/70" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PROMO_BANNER") {
      return (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-gradient-to-r from-[#090612] to-[#c94b99]/35 px-2.5 py-2.5">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded bg-white/70" />
            <div className="h-1.5 w-28 rounded bg-white/30" />
          </div>
          <div className="h-4 w-12 rounded-full bg-[#c94b99]" />
        </div>
      );
    }
    if (kind === "TEXT_BLOCK") {
      return (
        <div className="mt-2 flex flex-col items-center rounded-lg border border-white/10 bg-black/50 px-3 py-2.5">
          <div className="h-2 w-24 rounded bg-white/70" />
          <div className="mt-1.5 h-1.5 w-36 rounded bg-white/30" />
        </div>
      );
    }
    if (kind === "CTA_BUTTON") {
      return (
        <div className="mt-2 flex justify-center rounded-lg border border-white/10 bg-black/50 py-2.5">
          <div className="h-4 w-24 rounded-full bg-cyan-400/80" />
        </div>
      );
    }
    if (kind === "FEATURE_PILLS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-5 items-center justify-center rounded border border-white/10 bg-[#120e1c]">
              <div className="h-1.5 w-8 rounded bg-white/45" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-2 flex h-6 items-center rounded-lg bg-black/50 px-3">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    );
  };

  return (
                      <div
                        key={blk.id}
                        draggable
                        onDragStart={() => setDragBlockIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleCanvasDrop(idx, blk.id)}
                        onClick={() => setSelectedId(blk.id)}
                        className={`flex cursor-grab items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                          isSelected
                            ? "border-cyan-400/70 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="h-4 w-4 shrink-0 text-white/40" />
                          <div className="min-w-0">
                            <p dir="auto" className="truncate text-xs font-semibold text-white">
                              {blk.title || blk.config.eyebrow || blk.type}
                            </p>
                            <p dir="ltr" className="text-[10px] text-white/45">
                              {(blk.config.widgets ?? []).length} elements • {blk.config.columns ?? 4} cols
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={blk.visible ? "Hide Block" : "Show Block"}
                            title={blk.visible ? "Hide Block" : "Show Block"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setBlocks((prev) =>
                                prev.map((x) =>
                                  x.id === blk.id ? { ...x, visible: !x.visible } : x
                                )
                              );
                            }}
                            className="rounded-lg p-1 text-white/60 hover:bg-white/10"
                          >
                            {blk.visible ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-300" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-white/35" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Delete Block"
                            title="Delete Block"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(blk);
                            }}
                            className="rounded-lg p-1 text-red-300/70 hover:bg-red-500/20 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Block Visual Inspector */}
                {selectedBlock ? (
                  <div className="space-y-3.5 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      {t.blockInspector}
                    </p>

                    <div>
                      <label className="mb-1 block text-[11px] text-white/65">
                        {t.eyebrowLabel}
                        <InfoHint
                          id="ed-eyebrow"
                          ar="النص الصغير الملون الذي يظهر أعلى عنوان القسم في الرئيسية (مثل New Arrivals)."
                          en="Small accent label shown directly above the section heading."
                        />
                      </label>
                      <input
                        dir="auto"
                        value={selectedBlock.config.eyebrow ?? ""}
                        onChange={(e) =>
                          updateSelectedConfig({ eyebrow: e.target.value })
                        }
                        placeholder="e.g. New Arrivals"
                        className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-white/65">
                        {t.titleLabel}
                        <InfoHint
                          id="ed-title"
                          ar="العنوان الرئيسي الكبير للقسم على الصفحة الرئيسية."
                          en="Main display heading for this block on the Homepage."
                        />
                      </label>
                      <input
                        dir="auto"
                        value={selectedBlock.title}
                        onChange={(e) =>
                          updateSelectedBlock({ title: e.target.value })
                        }
                        className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-white/65">
                        {t.subtitleLabel}
                        <InfoHint
                          id="ed-sub"
                          ar="الوصف القصير الذي يظهر بجانب أو أسفل عنوان القسم (يكتب عربي من اليمين وإنجليزي من الشمال تلقائياً)."
                          en="Short supporting description (auto-detects Arabic RTL & English LTR)."
                        />
                      </label>
                      <input
                        dir="auto"
                        value={selectedBlock.subtitle}
                        onChange={(e) =>
                          updateSelectedBlock({ subtitle: e.target.value })
                        }
                        className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2.5 text-xs"
                      />
                    </div>

                    {/* Grid Columns (1, 2, 3, 4) */}
                    <div>
                      <label className="mb-1 block text-[11px] text-white/65">
                        {t.columnsLabel}
                        <InfoHint
                          id="ed-cols"
                          ar="يحدد عدد البطاقات في كل صف (مثلاً 2 يجعل 4 منتجات تظهر في صفّين)."
                          en="Sets cards per row (e.g. choosing 2 arranges 4 products into 2 rows)."
                        />
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([1, 2, 3, 4] as const).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => updateSelectedConfig({ columns: col })}
                            className={`rounded-lg py-1.5 text-xs font-bold ${
                              (selectedBlock.config.columns ?? 4) === col
                                ? "bg-white text-black"
                                : "border border-white/15 text-white/70"
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Padding & Radius */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-white/65">
                          {t.paddingLabel}
                        </label>
                        <select
                          value={selectedBlock.config.paddingY ?? "md"}
                          onChange={(e) =>
                            updateSelectedConfig({
                              paddingY: e.target.value as "sm" | "md" | "lg",
                            })
                          }
                          className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                        >
                          <option value="sm">Compact</option>
                          <option value="md">Medium</option>
                          <option value="lg">Spacious</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-white/65">
                          {t.radiusLabel}
                        </label>
                        <select
                          value={selectedBlock.config.borderRadius ?? "rounded"}
                          onChange={(e) =>
                            updateSelectedConfig({
                              borderRadius: e.target.value as "sharp" | "rounded" | "pill",
                            })
                          }
                          className="h-8 w-full rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                        >
                          <option value="sharp">Sharp</option>
                          <option value="rounded">Rounded</option>
                          <option value="pill">Pill</option>
                        </select>
                      </div>
                    </div>

                    {/* Block Colors */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-white/65">
                          {t.bgLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBlock.config.bgColor || "#07050c"}
                            onChange={(e) =>
                              updateSelectedConfig({ bgColor: e.target.value })
                            }
                            className="h-7 w-10 rounded border border-white/15 bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => updateSelectedConfig({ bgColor: "transparent" })}
                            className="text-[10px] text-white/50 hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-white/65">
                          {t.accentLabel}
                        </label>
                        <input
                          type="color"
                          value={selectedBlock.config.accentColor || defaultAccent}
                          onChange={(e) =>
                            updateSelectedConfig({ accentColor: e.target.value })
                          }
                          className="h-7 w-10 rounded border border-white/15 bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Widgets Inside Selected Block */}
                    <div className="border-t border-white/10 pt-3">
                      <p className="mb-2 text-[11px] font-bold text-white/65">
                        {t.widgetsInBlock}
                      </p>
                      {(selectedBlock.config.widgets ?? []).length === 0 ? (
                        <p className="text-[11px] text-white/45">{t.noWidgets}</p>
                      ) : (
                        <div className="space-y-2">
                          {(selectedBlock.config.widgets ?? []).map((w) => (
                            <div
                              key={w.id}
                              className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-cyan-300">
                                  {w.kind}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeWidgetFromBlock(selectedBlock.id, w.id)
                                  }
                                  className="text-red-300/70 hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              {w.kind === "PROMO_BANNER" ||
                              w.kind === "TEXT_BLOCK" ||
                              w.kind === "CTA_BUTTON" ? (
                                <div className="space-y-1.5">
                                  {w.kind !== "CTA_BUTTON" ? (
                                    <>
                                      <input
                                        dir="auto"
                                        value={w.heading ?? ""}
                                        onChange={(e) =>
                                          updateWidget(selectedBlock.id, w.id, {
                                            heading: e.target.value,
                                          })
                                        }
                                        placeholder="Heading / العنوان"
                                        className="h-7 w-full rounded border border-white/15 bg-black/50 px-2 text-[11px]"
                                      />
                                      <input
                                        dir="auto"
                                        value={w.body ?? ""}
                                        onChange={(e) =>
                                          updateWidget(selectedBlock.id, w.id, {
                                            body: e.target.value,
                                          })
                                        }
                                        placeholder="Body text / النص"
                                        className="h-7 w-full rounded border border-white/15 bg-black/50 px-2 text-[11px]"
                                      />
                                    </>
                                  ) : null}

                                  {w.kind === "PROMO_BANNER" || w.kind === "CTA_BUTTON" ? (
                                    <div className="space-y-1.5">
                                      <div className="flex gap-1.5">
                                        <input
                                          dir="auto"
                                          value={w.ctaLabel ?? ""}
                                          onChange={(e) =>
                                            updateWidget(selectedBlock.id, w.id, {
                                              ctaLabel: e.target.value,
                                            })
                                          }
                                          placeholder="Button text / نص الزر"
                                          className="h-7 flex-1 rounded border border-white/15 bg-black/50 px-2 text-[11px]"
                                        />
                                        <input
                                          type="color"
                                          value={w.accentColor || "#c94b99"}
                                          onChange={(e) =>
                                            updateWidget(selectedBlock.id, w.id, {
                                              accentColor: e.target.value,
                                            })
                                          }
                                          title="Button Color"
                                          className="h-7 w-9 rounded border border-white/15 bg-transparent"
                                        />
                                        <input
                                          type="color"
                                          value={w.textColor || "#ffffff"}
                                          onChange={(e) =>
                                            updateWidget(selectedBlock.id, w.id, {
                                              textColor: e.target.value,
                                            })
                                          }
                                          title="Text Color"
                                          className="h-7 w-9 rounded border border-white/15 bg-transparent"
                                        />
                                      </div>

                                      <select
                                        value={
                                          ["/", "/universes/cars", "/universes/gaming", "/universes/anime", "/admin/"].includes(
                                            w.ctaUrl || ""
                                          )
                                            ? w.ctaUrl
                                            : "custom"
                                        }
                                        onChange={(e) => {
                                          if (e.target.value !== "custom") {
                                            updateWidget(selectedBlock.id, w.id, {
                                              ctaUrl: e.target.value,
                                            });
                                          }
                                        }}
                                        className="h-7 w-full rounded border border-white/15 bg-black/50 px-2 text-[11px]"
                                      >
                                        <option value="/universes/cars">→ Cars Universe (/universes/cars)</option>
                                        <option value="/universes/gaming">→ Gaming Universe (/universes/gaming)</option>
                                        <option value="/universes/anime">→ Anime Universe (/universes/anime)</option>
                                        <option value="/">→ Home (/)</option>
                                        <option value="custom">→ Custom URL</option>
                                      </select>

                                      <input
                                        dir="ltr"
                                        value={w.ctaUrl ?? ""}
                                        onChange={(e) =>
                                          updateWidget(selectedBlock.id, w.id, {
                                            ctaUrl: e.target.value,
                                          })
                                        }
                                        placeholder="Destination URL (e.g. /universes/anime)"
                                        className="h-7 w-full rounded border border-white/15 bg-black/50 px-2 font-mono text-[10px]"
                                      />
                                    </div>
                                  ) : null}

                                  {w.kind === "TEXT_BLOCK" || w.kind === "CTA_BUTTON" ? (
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                      <div className="flex gap-1">
                                        {(["left", "center", "right"] as const).map((al) => (
                                          <button
                                            key={al}
                                            type="button"
                                            onClick={() =>
                                              updateWidget(selectedBlock.id, w.id, { align: al })
                                            }
                                            className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                                              (w.align ?? "center") === al
                                                ? "bg-white text-black font-bold"
                                                : "border border-white/15 text-white/60"
                                            }`}
                                          >
                                            {al}
                                          </button>
                                        ))}
                                      </div>
                                      <input
                                        type="color"
                                        value={w.textColor || "#ffffff"}
                                        onChange={(e) =>
                                          updateWidget(selectedBlock.id, w.id, {
                                            textColor: e.target.value,
                                          })
                                        }
                                        title="Text Color"
                                        className="h-6 w-8 rounded border border-white/15 bg-transparent"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* TAB 2: WIDGET PALETTE (Live Visual Thumbnails + Drag into any Block) */}
            {sidebarTab === "widgets" ? (
              <div className="space-y-3">
                {selectedBlock ? (
                  <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-[11px]">
                    <span className="text-white/70">
                      {lang === "ar" ? "الإضافة إلى البلوك: " : "Target Block: "}
                    </span>
                    <span dir="auto" className="font-bold text-cyan-200">
                      {selectedBlock.title || selectedBlock.config.eyebrow || selectedBlock.type}
                    </span>
                  </div>
                ) : null}
                <p className="text-[11px] leading-relaxed text-white/60">
                  {t.dragWidgetHint}
                </p>
                {WIDGET_PALETTE.map((item) => (
                  <div
                    key={item.kind}
                    draggable
                    onDragStart={() => setDragWidgetKind(item.kind)}
                    onDragEnd={() => setDragWidgetKind(null)}
                    className="cursor-grab active:cursor-grabbing rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-cyan-400/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">
                          {lang === "ar" ? item.arLabel : item.enLabel}
                          <InfoHint
                            id={`w-hint-${item.kind}`}
                            ar={item.arDesc}
                            en={item.enDesc}
                          />
                        </p>
                      </div>
                      {selectedBlock ? (
                        <button
                          type="button"
                          onClick={() => addWidgetToBlock(selectedBlock.id, item.kind)}
                          className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/25"
                        >
                          {t.addToSelected}
                        </button>
                      ) : null}
                    </div>
                    {renderWidgetPreview(item.kind)}
                  </div>
                ))}
              </div>
            ) : null}

            {/* TAB 3: FULL SITE COLORS & EVENT THEME PRESETS */}
            {sidebarTab === "colors" ? (
              <div className="space-y-5">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs font-bold text-white">
                    {t.siteColorsTitle}
                    <InfoHint
                      id="ed-site-colors"
                      ar="تغيّر خلفية الموقع بالكامل ولون التمييز في الرئيسية فوراً عند النشر."
                      en="Controls the full site canvas gradient and Home accent color."
                    />
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Home Accent", val: defaultAccent, set: setDefaultAccent },
                      { label: "Canvas Top", val: bgPrimary, set: setBgPrimary },
                      { label: "Canvas Mid", val: bgSecondary, set: setBgSecondary },
                      { label: "Canvas Bottom", val: bgElevated, set: setBgElevated },
                    ].map((c) => (
                      <div key={c.label}>
                        <label className="mb-1 block text-[10px] text-white/60">
                          {c.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={c.val}
                            onChange={(e) => c.set(e.target.value)}
                            className="h-7 w-10 rounded border border-white/15 bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-white/70" dir="ltr">
                            {c.val}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs font-bold text-white">
                    {t.universeColorsTitle}
                    <InfoHint
                      id="ed-univ-colors"
                      ar="تغيّر ألوان كل قسم على البطاقات الثلاث وصفحات الأقسام والمنتجات ونجمة MY ROOM."
                      en="Updates each Universe's card gradient, page header, products, and MY ROOM star."
                    />
                  </p>
                  {universes.map((u) => (
                    <div key={u.id} className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{u.name}</span>
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
                  ))}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{t.presetsTitle}</p>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(ROOM_DEFAULT_PRESET)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t.restoreDefault}
                    </button>
                  </div>

                  <form onSubmit={handleSavePreset} className="flex gap-2">
                    <input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder={t.presetPlaceholder}
                      className="h-8 flex-1 rounded-lg border border-white/15 bg-black/60 px-2.5 text-xs"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-3 text-[10px] font-bold text-black"
                    >
                      <BookmarkPlus className="h-3 w-3" />
                      {t.savePreset}
                    </button>
                  </form>

                  <div className="space-y-2">
                    {presets.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <span className="text-xs font-semibold">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black"
                        >
                          {t.apply}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Center Live Storefront Canvas */}
        <main dir="ltr" className="flex-1 overflow-y-auto bg-[#020105] p-4 md:p-8">
          <div
            className={`mx-auto min-h-full overflow-hidden rounded-3xl border border-white/15 transition-all duration-300 ${
              viewport === "mobile" ? "max-w-[390px]" : "max-w-6xl"
            }`}
            style={
              {
                background: `linear-gradient(180deg, ${bgPrimary} 0%, ${bgSecondary} 45%, ${bgElevated} 100%)`,
                "--color-accent": defaultAccent,
              } as React.CSSProperties
            }
          >
            <UniverseStarHeader universes={universes} />

            <div className="space-y-2 pb-12">
              {blocks.map((blk, idx) => {
                const isSelected = blk.id === selectedBlock?.id;
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
          className={`mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
            isOpen
              ? "border-cyan-400 bg-cyan-500/25 text-cyan-200"
              : "border-white/25 bg-white/5 text-white/60 hover:border-cyan-400/60 hover:text-cyan-200"
          }`}
          aria-label="Info"
        >
          <Info className="h-2.5 w-2.5" />
        </button>
        {isOpen ? (
          <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-cyan-400/35 bg-[#090714] p-2.5 text-[11px] font-normal leading-relaxed text-white/95 shadow-2xl">
            {lang === "ar" ? ar : en}
          </span>
        ) : null}
      </span>
    );
  };

  const renderWidgetPreview = (kind: WidgetKind) => {
    if (kind === "UNIVERSE_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {["#d92323", "#6366f1", "#c94b99"].map((c) => (
            <div
              key={c}
              className="flex h-11 items-end rounded-md p-1"
              style={{ background: `linear-gradient(180deg, #07050c 0%, ${c} 100%)` }}
            >
              <div className="h-2 w-full rounded-sm bg-black/65" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PRODUCT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1">
              <div className="h-5 rounded-sm bg-white/10" />
              <div className="mt-1 h-1.5 w-3/4 rounded bg-white/30" />
              <div className="mt-1 flex justify-between">
                <div className="h-1.5 w-1/3 rounded bg-white/50" />
                <div className="h-1.5 w-1/3 rounded bg-cyan-400/70" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (kind === "LOADOUT_CARDS") {
      return (
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-md border border-white/10 bg-[#120e1c] p-1.5">
              <div className="flex justify-between">
                <div className="h-1.5 w-6 rounded bg-white/25" />
                <div className="h-1.5 w-6 rounded bg-pink-500/70" />
              </div>
              <div className="mt-1.5 h-2 w-4/5 rounded bg-white/40" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-white/70" />
            </div>
          ))}
        </div>
      );
    }
    if (kind === "PROMO_BANNER") {
      return (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-gradient-to-r from-[#090612] to-[#c94b99]/35 px-2.5 py-2.5">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded bg-white/70" />
            <div className="h-1.5 w-28 rounded bg-white/30" />
          </div>
          <div className="h-4 w-12 rounded-full bg-[#c94b99]" />
        </div>
      );
    }
    if (kind === "TEXT_BLOCK") {
      return (
        <div className="mt-2 flex flex-col items-center rounded-lg border border-white/10 bg-black/50 px-3 py-2.5">
          <div className="h-2 w-24 rounded bg-white/70" />
          <div className="mt-1.5 h-1.5 w-36 rounded bg-white/30" />
        </div>
      );
    }
    if (kind === "CTA_BUTTON") {
      return (
        <div className="mt-2 flex justify-center rounded-lg border border-white/10 bg-black/50 py-2.5">
          <div className="h-4 w-24 rounded-full bg-cyan-400/80" />
        </div>
      );
    }
    if (kind === "FEATURE_PILLS") {
      return (
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-black/50 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-5 items-center justify-center rounded border border-white/10 bg-[#120e1c]">
              <div className="h-1.5 w-8 rounded bg-white/45" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-2 flex h-6 items-center rounded-lg bg-black/50 px-3">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    );
  };

  return (
                  <div
                    key={blk.id}
                    draggable
                    onDragStart={() => setDragBlockIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleCanvasDrop(idx, blk.id)}
                    onClick={() => {
                      setSelectedId(blk.id);
                      setSidebarTab("blocks");
                    }}
                    className={`group relative cursor-pointer transition-all ${
                      !blk.visible ? "opacity-30 grayscale" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-cyan-400/80 ring-inset"
                        : "hover:ring-1 hover:ring-white/30 hover:ring-inset"
                    }`}
                  >
                    <div className="pointer-events-none absolute left-4 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-2.5 py-1 text-[10px] font-semibold text-white/85 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                      <GripVertical className="h-3 w-3 text-cyan-300" />
                      <span>{blk.title || blk.config.eyebrow || blk.type}</span>
                    </div>

                    <BlockWidgetRenderer
                      block={blk}
                      universes={universes}
                      products={initialFreshDrops}
                      loadouts={initialLoadouts}
                      isEmptyEditorPlaceholder
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
