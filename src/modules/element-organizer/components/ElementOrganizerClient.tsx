/**
 * @file src/modules/element-organizer/components/ElementOrganizerClient.tsx
 * @purpose Dedicated Isolated Admin Elements Organizer (/admin/elements/): provides both Reading Text Card Creator (matching Universe pill glass aesthetic, 3 typography line sizes, and positioned buttons) and Standalone Reusable Buttons Creator on the same page.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Languages,
  MousePointerClick,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchElementOrganizerSnapshot,
  saveIsolatedElementRegistry,
} from "../client-api";
import { createEmptyButton, createEmptyTextBlock } from "../helpers";
import type {
  ButtonIcon,
  ButtonItem,
  ButtonPlacement,
  ButtonSize,
  ButtonVariant,
  ElementBorderRadius,
  ElementRegistry,
  ReadingTextLine,
  TextAlign,
  TextBlockItem,
  TextLineSize,
} from "../schema";
import { ActionButtonView } from "./ActionButtonView";
import { ReadingTextBlockView } from "./ReadingTextBlockView";

interface ElementOrganizerClientProps {
  initialStoreId: string;
  initialRegistry: ElementRegistry;
  initialHasPersistedRecord: boolean;
}

interface QuickRouteOption {
  label: string;
  href: string;
}

type StudioMode = "text" | "buttons";
type Lang = "ar" | "en";

const COPY = {
  ar: {
    title: "منظّم النصوص والبوتونز المعزول",
    subtitle:
      "إنشاء بطاقات قراءة بنفس ثيم كارد اليونيفيرس (بالمقاسات الثلاثة لكل سطر) + إنشاء أزرار مخصصة لإضافتها مباشرة في الصفحة الرئيسية أو داخل بطاقات القراءة.",
    textTab: "بطاقات القراءة (Reading Cards)",
    btnTab: "البوتونز المخصصة (Buttons)",
    saveBtn: "حفظ الكل في Supabase",
    savedBtn: "تم الحفظ بنجاح!",
    savingBtn: "جاري الحفظ...",
    homeStudioLink: "منسّق الرئيسية",
    schemaLink: "خريطة الداتا",
    storefrontLink: "معاينة المتجر",
    addTextBtn: "بطاقة قراءة جديدة",
    addBtnBtn: "زر جديد",
    previewLabel: "معاينة حية (مطابقة للواجهة تماماً)",
    blockName: "الاسم التعريفي في الإدارة",
    alignLabel: "اتجاه النص",
    radiusLabel: "حواف الكارد",
    padLabel: "المساحة الداخلية",
    bgTintLabel: "لون الخلفية الشفاف",
    linesHeading: "السطور (اختر مقاس كل سطر بشكل مستقل)",
    addLine: "إضافة سطر",
    lineTextPlaceholder: "اكتب نص السطر...",
    sizeEyebrow: "صغير علوي (Eyebrow)",
    sizeTitle: "عنوان رئيسي (Title)",
    sizeSubtitle: "وصف فرعي (Subtitle)",
    attachedBtnHeading: "إرفاق بوتون داخل الكارد (اختياري)",
    selectButton: "اختر البوتون",
    noButton: "بدون بوتون",
    placementLabel: "مكان البوتون داخل الكارد",
    btnName: "اسم الزر بالإدارة",
    btnLabel: "النص الظاهر على الزر",
    btnHref: "رابط الانتقال عند الضغط (URL)",
    quickRoute: "اختر مسار جاهز من المتجر",
    btnVariant: "شكل الزر",
    btnBgColor: "لون الزر",
    btnTextColor: "لون النص",
    btnSize: "المقاس",
    btnIcon: "الأيقونة",
    active: "مفعل",
    paused: "مخفي",
    deleteItem: "حذف",
  },
  en: {
    title: "Isolated Text Cards & Buttons Studio",
    subtitle:
      "Build frosted Reading Text Cards (per-line 3 typography scales + optional placed button) and Reusable CTA Buttons in one isolated vault.",
    textTab: "Reading Text Cards",
    btnTab: "Custom Buttons",
    saveBtn: "Save All to Supabase",
    savedBtn: "Saved!",
    savingBtn: "Saving...",
    homeStudioLink: "Home Composer",
    schemaLink: "Schema Map",
    storefrontLink: "Storefront",
    addTextBtn: "New Reading Card",
    addBtnBtn: "New Button",
    previewLabel: "Live WYSIWYG Preview",
    blockName: "Internal Label",
    alignLabel: "Text Alignment",
    radiusLabel: "Card Radius",
    padLabel: "Inner Padding",
    bgTintLabel: "Card Background Color",
    linesHeading: "Text Lines (set independent size per line)",
    addLine: "Add Line",
    lineTextPlaceholder: "Type line text...",
    sizeEyebrow: "Eyebrow (Small Upper)",
    sizeTitle: "Title (Large Serif)",
    sizeSubtitle: "Subtitle (Body)",
    attachedBtnHeading: "Button Inside Card (Optional)",
    selectButton: "Select Button",
    noButton: "No Button",
    placementLabel: "Button Placement",
    btnName: "Admin Name",
    btnLabel: "Button Label",
    btnHref: "Target Link (href)",
    quickRoute: "Quick Storefront Route Picker",
    btnVariant: "Button Style",
    btnBgColor: "Button Color",
    btnTextColor: "Text Color",
    btnSize: "Size",
    btnIcon: "Icon",
    active: "Active",
    paused: "Hidden",
    deleteItem: "Delete",
  },
} as const;

export function ElementOrganizerClient({
  initialStoreId,
  initialRegistry,
}: ElementOrganizerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];

  const [storeId, setStoreId] = useState(initialStoreId);
  const [registry, setRegistry] = useState<ElementRegistry>(initialRegistry);
  const [mode, setMode] = useState<StudioMode>("text");
  const [selectedTextId, setSelectedTextId] = useState<string>(
    initialRegistry.textBlocks[0]?.id ?? ""
  );
  const [selectedBtnId, setSelectedBtnId] = useState<string>(
    initialRegistry.buttons[0]?.id ?? ""
  );
  const [quickRoutes, setQuickRoutes] = useState<QuickRouteOption[]>([
    { label: "Homepage (/)", href: "/" },
  ]);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [snap, vaultRows] = await Promise.all([
          fetchElementOrganizerSnapshot(),
          sbSelect<{ pageKey: string; config: Record<string, unknown> }>(
            "page_sections",
            "select=pageKey,config&pageKey=in.(__isolated_universe_organizer_v1__,__isolated_product_organizer_v1__,__isolated_package_organizer_v1__)"
          ).catch(() => []),
        ]);

        if (!active) return;
        setStoreId(snap.storeId);
        setRegistry(snap.registry);
        setSelectedTextId((prev) =>
          snap.registry.textBlocks.some((x) => x.id === prev)
            ? prev
            : snap.registry.textBlocks[0]?.id ?? ""
        );
        setSelectedBtnId((prev) =>
          snap.registry.buttons.some((x) => x.id === prev)
            ? prev
            : snap.registry.buttons[0]?.id ?? ""
        );

        const routes: QuickRouteOption[] = [{ label: "Homepage (/)", href: "/" }];
        for (const r of vaultRows) {
          if (
            r.pageKey === "__isolated_universe_organizer_v1__" &&
            Array.isArray(r.config?.universes)
          ) {
            for (const u of r.config.universes as Array<{ slug?: string; name?: string }>) {
              if (u.slug) {
                routes.push({
                  label: `Universe: ${u.name ?? u.slug}`,
                  href: `/universe/?slug=${encodeURIComponent(u.slug)}`,
                });
              }
            }
          }
          if (
            r.pageKey === "__isolated_product_organizer_v1__" &&
            Array.isArray(r.config?.products)
          ) {
            for (const p of r.config.products as Array<{ slug?: string; name?: string }>) {
              if (p.slug) {
                routes.push({
                  label: `Product: ${p.name ?? p.slug}`,
                  href: `/product/?slug=${encodeURIComponent(p.slug)}`,
                });
              }
            }
          }
          if (
            r.pageKey === "__isolated_package_organizer_v1__" &&
            Array.isArray(r.config?.packages)
          ) {
            for (const k of r.config.packages as Array<{ slug?: string; name?: string }>) {
              if (k.slug) {
                routes.push({
                  label: `Collection: ${k.name ?? k.slug}`,
                  href: `/package/?slug=${encodeURIComponent(k.slug)}`,
                });
              }
            }
          }
        }
        setQuickRoutes(routes);
      } catch {
        // Keep initial SSR bootstrap
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedText =
    registry.textBlocks.find((x) => x.id === selectedTextId) ??
    registry.textBlocks[0] ??
    null;
  const selectedButton =
    registry.buttons.find((x) => x.id === selectedBtnId) ??
    registry.buttons[0] ??
    null;

  const persist = async (nextReg: ElementRegistry) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await saveIsolatedElementRegistry({ storeId, registry: nextReg });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateTextBlock = (id: string, patch: Partial<TextBlockItem>) => {
    setRegistry((prev) => ({
      ...prev,
      textBlocks: prev.textBlocks.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b
      ),
    }));
  };

  const updateTextLine = (
    blockId: string,
    lineId: string,
    patch: Partial<ReadingTextLine>
  ) => {
    const target = registry.textBlocks.find((b) => b.id === blockId);
    if (!target) return;
    updateTextBlock(blockId, {
      lines: target.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    });
  };

  const moveTextLine = (blockId: string, idx: number, dir: -1 | 1) => {
    const target = registry.textBlocks.find((b) => b.id === blockId);
    if (!target) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= target.lines.length) return;
    const next = [...target.lines];
    const tmp = next[idx]!;
    next[idx] = next[swapIdx]!;
    next[swapIdx] = tmp;
    updateTextBlock(blockId, { lines: next });
  };

  const addTextLine = (blockId: string) => {
    const target = registry.textBlocks.find((b) => b.id === blockId);
    if (!target) return;
    updateTextBlock(blockId, {
      lines: [
        ...target.lines,
        {
          id: `ln_${Date.now().toString(36)}`,
          text: "New line text",
          size: "subtitle",
          color: "#c4bfd4",
        },
      ],
    });
  };

  const removeTextLine = (blockId: string, lineId: string) => {
    const target = registry.textBlocks.find((b) => b.id === blockId);
    if (!target) return;
    updateTextBlock(blockId, {
      lines: target.lines.filter((l) => l.id !== lineId),
    });
  };

  const handleAddTextBlock = () => {
    const created = createEmptyTextBlock(registry.textBlocks.length + 1);
    setRegistry((prev) => ({
      ...prev,
      textBlocks: [...prev.textBlocks, created],
    }));
    setSelectedTextId(created.id);
    setMode("text");
  };

  const handleDeleteTextBlock = (id: string) => {
    const remaining = registry.textBlocks.filter((b) => b.id !== id);
    setRegistry((prev) => ({ ...prev, textBlocks: remaining }));
    if (selectedTextId === id) {
      setSelectedTextId(remaining[0]?.id ?? "");
    }
  };

  const updateButtonItem = (id: string, patch: Partial<ButtonItem>) => {
    setRegistry((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b
      ),
    }));
  };

  const handleAddButton = () => {
    const created = createEmptyButton(registry.buttons.length + 1);
    setRegistry((prev) => ({
      ...prev,
      buttons: [...prev.buttons, created],
    }));
    setSelectedBtnId(created.id);
    setMode("buttons");
  };

  const handleDeleteButton = (id: string) => {
    const remaining = registry.buttons.filter((b) => b.id !== id);
    setRegistry((prev) => ({ ...prev, buttons: remaining }));
    if (selectedBtnId === id) {
      setSelectedBtnId(remaining[0]?.id ?? "");
    }
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#040308] text-white"
    >
      {/* Top Studio Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "لوحة الإدارة" : "Admin"}</span>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/10">
              <Sparkles className="h-5 w-5 text-fuchsia-300" />
            </div>
            <div>
              <h1 className="font-serif text-base font-semibold text-white">
                {t.title}
              </h1>
              <p className="text-[11px] text-white/55">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switch between Reading Cards Studio & Buttons Studio */}
            <div className="flex items-center rounded-full border border-white/15 bg-black/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                  mode === "text"
                    ? "bg-fuchsia-500 text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                <span>{t.textTab}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("buttons")}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                  mode === "buttons"
                    ? "bg-cyan-400 text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                <span>{t.btnTab}</span>
              </button>
            </div>

            <Link
              href="/admin/home/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
            >
              <Home className="h-3.5 w-3.5" />
              <span>{t.homeStudioLink}</span>
            </Link>

            <Link
              href="/schema/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              <span className="hidden sm:inline">{t.schemaLink}</span>
            </Link>

            <button
              type="button"
              onClick={() => setLang((p) => (p === "ar" ? "en" : "ar"))}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/80 hover:bg-white/15"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "EN" : "ع"}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void persist(registry)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
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
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{t.storefrontLink}</span>
            </Link>
          </div>
        </div>
      </header>

      {errorMsg ? (
        <div className="mx-auto mt-4 max-w-[1600px] px-4">
          <div className="rounded-xl border border-red-400/35 bg-red-500/15 px-4 py-2.5 text-xs text-red-200">
            {errorMsg}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-12">
        {/* LEFT LIST PANEL (4 COLS) */}
        <aside className="space-y-4 lg:col-span-4">
          {mode === "text" ? (
            <div className="rounded-2xl border border-white/10 bg-[#080612] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                  {t.textTab} ({registry.textBlocks.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddTextBlock}
                  className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500 px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.addTextBtn}</span>
                </button>
              </div>

              <div className="space-y-2">
                {registry.textBlocks.map((b) => {
                  const isSel = selectedText?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedTextId(b.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSel
                          ? "border-fuchsia-400 bg-fuchsia-500/15"
                          : "border-white/10 bg-black/45 hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-white">
                          {b.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/70">
                            {b.lines.length}L
                          </span>
                          {b.isActive ? (
                            <Eye className="h-3.5 w-3.5 text-emerald-300" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-white/55">
                        {b.lines.map((l) => l.text).join(" • ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#080612] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {t.btnTab} ({registry.buttons.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="inline-flex items-center gap-1 rounded-full bg-cyan-400 px-3 py-1.5 text-[11px] font-bold text-black hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.addBtnBtn}</span>
                </button>
              </div>

              <div className="space-y-2">
                {registry.buttons.map((b) => {
                  const isSel = selectedButton?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBtnId(b.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSel
                          ? "border-cyan-400 bg-cyan-500/15"
                          : "border-white/10 bg-black/45 hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-white">
                          {b.name}
                        </span>
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-white/30"
                          style={{ backgroundColor: b.bgColor }}
                        />
                      </div>
                      <p className="mt-1 truncate font-mono text-[10px] text-white/55" dir="ltr">
                        {b.label} → {b.href}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT EDITOR + WYSIWYG PREVIEW (8 COLS) */}
        <main className="space-y-6 lg:col-span-8">
          {mode === "text" && selectedText ? (
            <>
              {/* Live Frosted Preview */}
              <div className="rounded-3xl border border-white/10 bg-[#080612] p-6">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-white/50">
                  {t.previewLabel}
                </p>
                <div
                  className="flex min-h-[160px] items-center justify-center rounded-2xl border border-white/10 p-6"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  <ReadingTextBlockView
                    block={selectedText}
                    buttons={registry.buttons}
                    interactive={false}
                  />
                </div>
              </div>

              {/* Editor Form */}
              <div className="space-y-5 rounded-3xl border border-white/10 bg-[#080612] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <input
                    value={selectedText.name}
                    onChange={(e) =>
                      updateTextBlock(selectedText.id, { name: e.target.value })
                    }
                    className="h-10 min-w-[240px] flex-1 rounded-xl border border-white/15 bg-black/50 px-3 text-sm font-bold text-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateTextBlock(selectedText.id, {
                          isActive: !selectedText.isActive,
                        })
                      }
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                        selectedText.isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-200"
                      }`}
                    >
                      {selectedText.isActive ? t.active : t.paused}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTextBlock(selectedText.id)}
                      className="rounded-full border border-red-400/30 p-2 text-red-300 hover:bg-red-500/20"
                      title={t.deleteItem}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Card Alignment, Radius, Padding, Bg */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.alignLabel}
                    </label>
                    <select
                      value={selectedText.align}
                      onChange={(e) =>
                        updateTextBlock(selectedText.id, {
                          align: e.target.value as TextAlign,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.radiusLabel}
                    </label>
                    <select
                      value={selectedText.borderRadius}
                      onChange={(e) =>
                        updateTextBlock(selectedText.id, {
                          borderRadius: e.target.value as ElementBorderRadius,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    >
                      <option value="rounded">Universe Pill (rounded-xl)</option>
                      <option value="sharp">Sharp (rounded-md)</option>
                      <option value="pill">Large Pill (rounded-3xl)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.padLabel}
                    </label>
                    <select
                      value={selectedText.paddingMode}
                      onChange={(e) =>
                        updateTextBlock(selectedText.id, {
                          paddingMode: e.target.value as "compact" | "comfortable",
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.bgTintLabel}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={selectedText.bgColor}
                      onChange={(e) =>
                        updateTextBlock(selectedText.id, { bgColor: e.target.value })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                {/* Per-line 3 typography scales */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white/80">
                      {t.linesHeading}
                    </h3>
                    <button
                      type="button"
                      onClick={() => addTextLine(selectedText.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-1 text-[11px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/25"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{t.addLine}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedText.lines.map((line, idx) => (
                      <div
                        key={line.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/45 p-3"
                      >
                        <input
                          value={line.text}
                          placeholder={t.lineTextPlaceholder}
                          onChange={(e) =>
                            updateTextLine(selectedText.id, line.id, {
                              text: e.target.value,
                            })
                          }
                          className="h-9 min-w-[200px] flex-1 rounded-lg border border-white/15 bg-black/60 px-3 text-xs text-white"
                        />
                        <select
                          value={line.size}
                          onChange={(e) =>
                            updateTextLine(selectedText.id, line.id, {
                              size: e.target.value as TextLineSize,
                            })
                          }
                          className="h-9 rounded-lg border border-white/15 bg-black/60 px-2.5 text-xs text-white"
                        >
                          <option value="eyebrow">{t.sizeEyebrow}</option>
                          <option value="title">{t.sizeTitle}</option>
                          <option value="subtitle">{t.sizeSubtitle}</option>
                        </select>
                        <input
                          type="color"
                          value={line.color.startsWith("#") ? line.color : "#ffffff"}
                          onChange={(e) =>
                            updateTextLine(selectedText.id, line.id, {
                              color: e.target.value,
                            })
                          }
                          className="h-9 w-10 rounded-lg border border-white/15 bg-transparent"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveTextLine(selectedText.id, idx, -1)}
                            className="rounded border border-white/15 p-1.5 text-white/65 hover:text-white"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTextLine(selectedText.id, idx, 1)}
                            className="rounded border border-white/15 p-1.5 text-white/65 hover:text-white"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTextLine(selectedText.id, line.id)}
                            className="rounded border border-red-400/25 p-1.5 text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Placed Button Inside Reading Card */}
                <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/80">
                      {t.attachedBtnHeading}
                    </label>
                    <select
                      value={selectedText.attachedButtonId ?? ""}
                      onChange={(e) =>
                        updateTextBlock(selectedText.id, {
                          attachedButtonId: e.target.value || null,
                          buttonPlacement: e.target.value
                            ? selectedText.buttonPlacement === "none"
                              ? "bottom-center"
                              : selectedText.buttonPlacement
                            : "none",
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    >
                      <option value="">{t.noButton}</option>
                      {registry.buttons.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/80">
                      {t.placementLabel}
                    </label>
                    <select
                      value={selectedText.buttonPlacement}
                      onChange={(e) =>
                        updateTextBlock(selectedText.id, {
                          buttonPlacement: e.target.value as ButtonPlacement,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    >
                      <option value="none">None</option>
                      <option value="bottom-start">Bottom Start</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-end">Bottom End</option>
                      <option value="top-end">Top End</option>
                      <option value="inline-end">Inline Next to Text</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : mode === "buttons" && selectedButton ? (
            <>
              {/* Live Button Preview */}
              <div className="rounded-3xl border border-white/10 bg-[#080612] p-6">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-white/50">
                  {t.previewLabel}
                </p>
                <div
                  className="flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 p-6"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  <ActionButtonView button={selectedButton} interactive={false} />
                </div>
              </div>

              {/* Button Form */}
              <div className="space-y-4 rounded-3xl border border-white/10 bg-[#080612] p-6">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <input
                    value={selectedButton.name}
                    onChange={(e) =>
                      updateButtonItem(selectedButton.id, { name: e.target.value })
                    }
                    placeholder={t.btnName}
                    className="h-10 flex-1 rounded-xl border border-white/15 bg-black/50 px-3 text-sm font-bold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteButton(selectedButton.id)}
                    className="rounded-full border border-red-400/30 p-2 text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {t.btnLabel}
                    </label>
                    <input
                      value={selectedButton.label}
                      onChange={(e) =>
                        updateButtonItem(selectedButton.id, { label: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/65">
                      {t.btnHref}
                    </label>
                    <input
                      dir="ltr"
                      value={selectedButton.href}
                      onChange={(e) =>
                        updateButtonItem(selectedButton.id, { href: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/65">
                    {t.quickRoute}
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        updateButtonItem(selectedButton.id, { href: e.target.value });
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                  >
                    <option value="">-- {t.quickRoute} --</option>
                    {quickRoutes.map((r) => (
                      <option key={`${r.label}:${r.href}`} value={r.href}>
                        {r.label} ({r.href})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.btnVariant}
                    </label>
                    <select
                      value={selectedButton.variant}
                      onChange={(e) =>
                        updateButtonItem(selectedButton.id, {
                          variant: e.target.value as ButtonVariant,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-2 text-xs text-white"
                    >
                      <option value="solid">Solid</option>
                      <option value="glow">Glow</option>
                      <option value="glass">Glass</option>
                      <option value="outline">Outline</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.radiusLabel}
                    </label>
                    <select
                      value={selectedButton.borderRadius}
                      onChange={(e) =>
                        updateButtonItem(selectedButton.id, {
                          borderRadius: e.target.value as ElementBorderRadius,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-2 text-xs text-white"
                    >
                      <option value="pill">Pill</option>
                      <option value="rounded">Rounded</option>
                      <option value="sharp">Sharp</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.btnSize}
                    </label>
                    <select
                      value={selectedButton.size}
                      onChange={(e) =>
                        updateButtonItem(selectedButton.id, {
                          size: e.target.value as ButtonSize,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-2 text-xs text-white"
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-white/60">
                      {t.btnIcon}
                    </label>
                    <select
                      value={selectedButton.icon}
                      onChange={(e) =>
                        updateButtonItem(selectedButton.id, {
                          icon: e.target.value as ButtonIcon,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-2 text-xs text-white"
                    >
                      <option value="arrow">Arrow →</option>
                      <option value="sparkles">Sparkles</option>
                      <option value="bag">Bag</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex-1 text-[10px] text-white/60">
                      {t.btnBgColor}
                      <input
                        type="color"
                        value={selectedButton.bgColor}
                        onChange={(e) =>
                          updateButtonItem(selectedButton.id, {
                            bgColor: e.target.value,
                          })
                        }
                        className="mt-1 block h-9 w-full rounded-lg border border-white/15 bg-transparent"
                      />
                    </label>
                    <label className="flex-1 text-[10px] text-white/60">
                      {t.btnTextColor}
                      <input
                        type="color"
                        value={selectedButton.textColor}
                        onChange={(e) =>
                          updateButtonItem(selectedButton.id, {
                            textColor: e.target.value,
                          })
                        }
                        className="mt-1 block h-9 w-full rounded-lg border border-white/15 bg-transparent"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
