/**
 * @file src/modules/page-builder/components/VisualEditorClient.tsx
 * @purpose Shopify-style Visual Page Editor (/admin/editor/): Split-screen live Storefront preview with Desktop/Mobile switcher, Drag & Drop section reordering (both in sidebar & on canvas), live title/subtitle editing, and Supabase persistence.
 */

"use client";

import type { BundleSummaryDTO } from "@modules/bundles";
import { LoadoutsSection } from "@modules/bundles";
import type { ProductSummaryDTO } from "@modules/catalog";
import { FreshDropsSection } from "@modules/catalog";
import type { UniverseDTO } from "@modules/universes";
import { UniverseShowcaseGrid, UniverseStarHeader } from "@modules/universes";
import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Languages,
  Monitor,
  Save,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface VisualEditorClientProps {
  storeId: string;
  initialUniverses: UniverseDTO[];
  initialFreshDrops: ProductSummaryDTO[];
  initialLoadouts: BundleSummaryDTO[];
}

interface EditorSection {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  visible: boolean;
  isPersisted: boolean;
}

const DEFAULT_SECTIONS: EditorSection[] = [
  {
    id: "sec_univ",
    type: "UNIVERSE_QUICK_BAR",
    title: "Choose Your Universe",
    subtitle: "High-craft themed bedsheets & room loadouts",
    visible: true,
    isPersisted: false,
  },
  {
    id: "sec_fresh",
    type: "NEW_ARRIVALS",
    title: "Fresh Drops",
    subtitle: "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
    visible: true,
    isPersisted: false,
  },
  {
    id: "sec_loadouts",
    type: "FEATURED_BUNDLES",
    title: "Signature Loadouts",
    subtitle: "Full room setups bundled for maximum drip & instant savings",
    visible: true,
    isPersisted: false,
  },
];

const COPY = {
  ar: {
    title: "محرر ROOM البصري",
    subtitle: "اسحب الأقسام لتغيير ترتيبها أو اضغط لتعديلها مباشرة",
    backAdmin: "لوحة الأدمن",
    viewLive: "المتجر المباشر",
    savePublish: "حفظ ونشر",
    saving: "جاري الحفظ...",
    saved: "تم النشر!",
    sectionsTree: "أقسام الصفحة الرئيسية (اسحب للترتيب)",
    inspector: "تعديل القسم المحدد",
    sectionTitle: "عنوان القسم",
    sectionSub: "الوصف الفرعي",
    visibility: "الحالة في المتجر",
    visible: "ظاهر",
    hidden: "مخفي",
    dragHint: "اسحب لتبديل المكان",
  },
  en: {
    title: "ROOM Visual Editor",
    subtitle: "Drag & drop sections to reorder or click any block to edit live",
    backAdmin: "Admin Panel",
    viewLive: "Live Store",
    savePublish: "Save & Publish",
    saving: "Saving...",
    saved: "Published!",
    sectionsTree: "Homepage Sections (Drag to reorder)",
    inspector: "Selected Section Inspector",
    sectionTitle: "Section Title",
    sectionSub: "Subtitle",
    visibility: "Storefront Visibility",
    visible: "Visible",
    hidden: "Hidden",
    dragHint: "Drag to reorder",
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

  const [sections, setSections] = useState<EditorSection[]>(DEFAULT_SECTIONS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SECTIONS[0]?.id ?? "");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await sbSelect<{
          id: string;
          type: string;
          title: string | null;
          subtitle: string | null;
          isVisible: boolean;
          sortOrder: number;
        }>(
          "page_sections",
          "select=id,type,title,subtitle,isVisible,sortOrder&pageKey=eq.home&order=sortOrder.asc"
        );
        if (!active || rows.length === 0) return;

        const loaded: EditorSection[] = rows
          .filter((r) =>
            ["UNIVERSE_QUICK_BAR", "NEW_ARRALS", "NEW_ARRIVALS", "FEATURED_BUNDLES"].includes(r.type)
          )
          .map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title ?? r.type,
            subtitle: r.subtitle ?? "",
            visible: r.isVisible,
            isPersisted: true,
          }));

        if (loaded.length > 0) {
          setSections(loaded);
          setSelectedId(loaded[0]?.id ?? "");
        }
      } catch {
        // Keep default sections
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedSection = sections.find((s) => s.id === selectedId) ?? sections[0] ?? null;

  const handleDropAt = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      if (!moved) return prev;
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedIndex(null);
  };

  const updateSelected = (patch: Partial<EditorSection>) => {
    if (!selectedSection) return;
    setSections((prev) =>
      prev.map((s) => (s.id === selectedSection.id ? { ...s, ...patch } : s))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const updatedSections = await Promise.all(
        sections.map(async (s, idx) => {
          if (s.isPersisted) {
            await sbPatch("page_sections", `id=eq.${encodeURIComponent(s.id)}`, {
              title: s.title,
              subtitle: s.subtitle,
              isVisible: s.visible,
              sortOrder: idx + 1,
              updatedAt: nowIso,
            });
            return s;
          } else {
            const newId = generateClientId("sec");
            await sbInsert("page_sections", {
              id: newId,
              storeId,
              pageKey: "home",
              type: s.type,
              title: s.title,
              subtitle: s.subtitle,
              sortOrder: idx + 1,
              isVisible: s.visible,
              updatedAt: nowIso,
            });
            return { ...s, id: newId, isPersisted: true };
          }
        })
      );
      setSections(updatedSections);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore network errors
    } finally {
      setSaving(false);
    }
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

        {/* Viewport & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center rounded-full border border-white/15 bg-black/50 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`rounded-full p-1.5 transition-colors ${
                viewport === "desktop" ? "bg-white text-black" : "text-white/60"
              }`}
              title="Desktop View"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`rounded-full p-1.5 transition-colors ${
                viewport === "mobile" ? "bg-white text-black" : "text-white/60"
              }`}
              title="Mobile View"
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
            onClick={() => void handleSaveAll()}
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

      {/* Split-Screen Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Draggable Section Tree + Inspector */}
        <aside className="flex w-80 shrink-0 flex-col border-e border-white/10 bg-[#080611] overflow-y-auto">
          <div className="p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/55">
              {t.sectionsTree}
            </p>
            <div className="space-y-2">
              {sections.map((sec, idx) => {
                const isSelected = sec.id === selectedSection?.id;
                return (
                  <div
                    key={sec.id}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropAt(idx)}
                    onClick={() => setSelectedId(sec.id)}
                    className={`flex cursor-grab active:cursor-grabbing items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-cyan-400/70 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    } ${draggedIndex === idx ? "opacity-45" : "opacity-100"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-4 w-4 shrink-0 text-white/40" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">
                          {sec.title}
                        </p>
                        <p className="truncate font-mono text-[10px] text-white/45" dir="ltr">
                          {sec.type}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSections((prev) =>
                          prev.map((x) =>
                            x.id === sec.id ? { ...x, visible: !x.visible } : x
                          )
                        );
                      }}
                      className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                      title={sec.visible ? t.visible : t.hidden}
                    >
                      {sec.visible ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-white/35" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Section Inspector */}
          {selectedSection ? (
            <div className="mt-auto border-t border-white/10 bg-black/40 p-4 space-y-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                {t.inspector}
              </p>

              <div>
                <label className="mb-1 block text-[11px] text-white/65">
                  {t.sectionTitle}
                </label>
                <input
                  value={selectedSection.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  className="h-9 w-full rounded-lg border border-white/15 bg-black/60 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-white/65">
                  {t.sectionSub}
                </label>
                <input
                  value={selectedSection.subtitle}
                  onChange={(e) => updateSelected({ subtitle: e.target.value })}
                  className="h-9 w-full rounded-lg border border-white/15 bg-black/60 px-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-white/70">{t.visibility}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateSelected({ visible: !selectedSection.visible })
                  }
                  className={`rounded-full px-3.5 py-1 text-[11px] font-bold ${
                    selectedSection.visible
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/10 text-white/45"
                  }`}
                >
                  {selectedSection.visible ? t.visible : t.hidden}
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        {/* Center Live Storefront Canvas */}
        <main
          dir="ltr"
          className="flex-1 overflow-y-auto bg-[#020105] p-4 md:p-8"
        >
          <div
            className={`mx-auto min-h-full rounded-3xl border border-white/15 transition-all duration-300 overflow-hidden ${
              viewport === "mobile" ? "max-w-[390px]" : "max-w-6xl"
            }`}
            style={{ background: "var(--color-bg-canvas-gradient)" }}
          >
            <UniverseStarHeader universes={initialUniverses} />

            <div className="space-y-2 pb-10">
              {sections.map((sec, idx) => {
                const isSelected = sec.id === selectedSection?.id;
                return (
                  <div
                    key={sec.id}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropAt(idx)}
                    onClick={() => setSelectedId(sec.id)}
                    className={`group relative cursor-pointer transition-all ${
                      !sec.visible ? "opacity-30 grayscale" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-cyan-400/80 ring-inset"
                        : "hover:ring-1 hover:ring-white/30 hover:ring-inset"
                    }`}
                  >
                    {/* Floating Section Pill on Canvas */}
                    <div className="pointer-events-none absolute left-4 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-2.5 py-1 text-[10px] font-semibold text-white/85 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                      <GripVertical className="h-3 w-3 text-cyan-300" />
                      <span>
                        {sec.title} ({t.dragHint})
                      </span>
                    </div>

                    {sec.type === "UNIVERSE_QUICK_BAR" ? (
                      <UniverseShowcaseGrid universes={initialUniverses} />
                    ) : sec.type === "NEW_ARRIVALS" ? (
                      <FreshDropsSection
                        title={sec.title}
                        subtitle={sec.subtitle}
                        products={initialFreshDrops}
                      />
                    ) : sec.type === "FEATURED_BUNDLES" ? (
                      <LoadoutsSection
                        title={sec.title}
                        subtitle={sec.subtitle}
                        loadouts={initialLoadouts}
                      />
                    ) : null}
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
