/**
 * @file src/modules/schema-visualizer/components/SchemaExplorerClient.tsx
 * @purpose Futuristic interactive Database Schema Visualizer with AR/EN toggle, draggable model nodes, animated SVG relation cables, domain filters, enum vault, and live field inspector.
 */

"use client";

import {
  Check,
  Copy,
  Database,
  GitBranch,
  Key,
  Languages,
  Layers,
  Link2,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { ModelMeta, SchemaMeta } from "../schema";

interface SchemaExplorerClientProps {
  meta: SchemaMeta;
}

type Lang = "en" | "ar";

const DOMAIN_COLORS: Record<string, string> = {
  "Core & Multi-Tenant": "#38bdf8",
  Universes: "#c94b99",
  "Dynamic Page Builder": "#a855f7",
  "Catalog & A+ Story": "#6366f1",
  "Loadouts (Bundles)": "#f59e0b",
  "Orders & Cairo Shipping": "#ef4444",
  "Loyalty & Rewards": "#22c55e",
};

const DOMAIN_LABELS_AR: Record<string, string> = {
  ALL: "الكل",
  "Core & Multi-Tenant": "الأساس وتعدد المتاجر",
  Universes: "الأقسام (Universes)",
  "Dynamic Page Builder": "بناء الصفحة الرئيسية",
  "Catalog & A+ Story": "الكتالوج وقصة المنتج",
  "Loadouts (Bundles)": "الباقات (Loadouts)",
  "Orders & Cairo Shipping": "الطلبات وشحن القاهرة",
  "Loyalty & Rewards": "نقاط الولاء",
};

const MODEL_PURPOSE_AR: Record<string, string> = {
  StoreConfig: "إعدادات المتجر والألوان والعملة وتعدد المتاجر (storeId)",
  User: "بيانات العملاء والموظفين والمديرين",
  Universe: "الأقسام الرئيسية (Cars, Gaming, Anime) بألوانها وصورها",
  Product: "المنتجات الأساسية وأسعارها وحالتها",
  ProductVariant: "المقاسات والألوان والمخزون والسعر لكل نسخة",
  ProductStoryBlock: "بلوكات القصة المتسلسلة للمنتج بنظام Oraimo A+",
  Bundle: "باقات الغرفة الكاملة (Loadouts) ونوع الخصم",
  BundleItem: "المنتجات المكونة لكل باقة وكمياتها",
  PageSection: "أقسام الصفحة الرئيسية الديناميكية القابلة للترتيب",
  ShippingZone: "مناطق الشحن في القاهرة والقاهرة الجديدة وتكلفتها",
  Order: "الطلبات وحالات الدفع (COD / أونلاين) وحالة التوصيل",
  OrderItem: "تفاصيل المنتجات والباقات داخل كل طلب",
  LoyaltyAccount: "حساب نقاط الولاء والمستويات وكود الإحالة",
};

const COPY = {
  en: {
    title: "ROOM // DB SCHEMA",
    liveSynced: "Live Synced",
    tables: "Tables",
    relations: "Relations",
    fields: "Fields",
    searchPlaceholder: "Search model, field, table...",
    enums: "Enums",
    reset: "Reset",
    storefront: "Storefront",
    moreFields: (n: number) => `+${n} more fields (click to inspect)`,
    pgTable: "PostgreSQL Table",
    columns: "Columns",
    relationsTitle: "Relations",
    indexesTitle: "Performance Indexes",
    enumsTitle: "PostgreSQL Enums",
    copyTooltip: "Copy Prisma model snippet",
  },
  ar: {
    title: "ROOM // هيكل قاعدة البيانات",
    liveSynced: "مزامنة حية",
    tables: "جداول",
    relations: "علاقات",
    fields: "حقول",
    searchPlaceholder: "ابحث عن جدول أو حقل...",
    enums: "التعدادات",
    reset: "إعادة ضبط",
    storefront: "المتجر",
    moreFields: (n: number) => `+${n} حقول إضافية (اضغط للتفاصيل)`,
    pgTable: "اسم الجدول في PostgreSQL",
    columns: "الأعمدة",
    relationsTitle: "العلاقات المرتبطة",
    indexesTitle: "فهارس الأداء",
    enumsTitle: "التعدادات (PostgreSQL Enums)",
    copyTooltip: "نسخ كود الجدول",
  },
} as const;

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] ?? "#38bdf8";
}

export function SchemaExplorerClient({ meta }: SchemaExplorerClientProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const t = COPY[lang];

  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() =>
    Object.fromEntries(meta.models.map((m) => [m.name, { ...m.position }]))
  );

  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    "Product"
  );
  const [hoveredModelName, setHoveredModelName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState<string>("ALL");
  const [showEnums, setShowEnums] = useState(false);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  const dragRef = useRef<{
    modelName: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const domains = useMemo(() => {
    const set = new Set(meta.models.map((m) => m.domain));
    return ["ALL", ...Array.from(set)];
  }, [meta.models]);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return meta.models.filter((m) => {
      const matchesDomain = activeDomain === "ALL" || m.domain === activeDomain;
      if (!matchesDomain) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.tableName.toLowerCase().includes(q) ||
        m.fields.some((f) => f.name.toLowerCase().includes(q))
      );
    });
  }, [meta.models, activeDomain, searchQuery]);

  const visibleModelNames = useMemo(
    () => new Set(filteredModels.map((m) => m.name)),
    [filteredModels]
  );

  const focusModelName = hoveredModelName ?? selectedModelName;

  const connectedToFocus = useMemo(() => {
    const set = new Set<string>();
    if (!focusModelName) return set;
    set.add(focusModelName);
    for (const edge of meta.edges) {
      if (edge.from === focusModelName) set.add(edge.to);
      if (edge.to === focusModelName) set.add(edge.from);
    }
    return set;
  }, [focusModelName, meta.edges]);

  const selectedModel: ModelMeta | null = useMemo(
    () => meta.models.find((m) => m.name === selectedModelName) ?? null,
    [meta.models, selectedModelName]
  );

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    modelName: string
  ) => {
    e.stopPropagation();
    const pos = positions[modelName] ?? { x: 0, y: 0 };
    dragRef.current = {
      modelName,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    setSelectedModelName(modelName);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { modelName, startX, startY, origX, origY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setPositions((prev) => ({
      ...prev,
      [modelName]: {
        x: Math.max(20, origX + dx),
        y: Math.max(20, origY + dy),
      },
    }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleResetLayout = () => {
    setPositions(
      Object.fromEntries(meta.models.map((m) => [m.name, { ...m.position }]))
    );
  };

  const handleCopyModelSummary = (model: ModelMeta) => {
    const summary = [
      `// Table: ${model.tableName} (${model.domain})`,
      `model ${model.name} {`,
      ...model.fields
        .filter((f) => !f.isModelRelation)
        .map((f) => `  ${f.name} ${f.rawType}${f.isId ? " @id" : ""}`),
      `}`,
    ].join("\n");
    navigator.clipboard.writeText(summary);
    setCopiedModel(model.name);
    setTimeout(() => setCopiedModel(null), 1800);
  };

  const formatDomainLabel = (domain: string) =>
    lang === "ar" ? DOMAIN_LABELS_AR[domain] ?? domain : domain;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative flex min-h-screen flex-col bg-[#040308] text-white"
    >
      {/* Top Cyber-Tech HUD Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <Database className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base font-semibold tracking-[0.12em] text-white">
                  {t.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  {t.liveSynced}
                </span>
              </div>
              <p className="text-[11px] text-white/55">
                {meta.provider} • {meta.stats.modelsCount} {t.tables} •{" "}
                {meta.stats.edgesCount} {t.relations} • {meta.stats.fieldsCount}{" "}
                {t.fields}
              </p>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-9 w-56 rounded-full border border-white/15 bg-black/60 pl-9 pr-4 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
              />
            </div>

            {/* AR / EN Toggle Button */}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/25"
            >
              <Languages className="h-3.5 w-3.5" />
              {lang === "ar" ? "English" : "عربي"}
            </button>

            <button
              type="button"
              onClick={() => setShowEnums((v) => !v)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                showEnums
                  ? "border-purple-400/60 bg-purple-500/20 text-purple-200"
                  : "border-white/15 bg-white/5 text-white/80 hover:border-white/35"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              {t.enums} ({meta.stats.enumsCount})
            </button>

            <button
              type="button"
              onClick={handleResetLayout}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/80 transition-colors hover:border-white/35"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.reset}
            </button>

            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.storefront}
            </Link>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="mx-auto mt-3 flex max-w-[1600px] items-center gap-2 overflow-x-auto pb-1">
          {domains.map((domain) => {
            const active = activeDomain === domain;
            const color =
              domain === "ALL" ? "#ffffff" : getDomainColor(domain);
            return (
              <button
                key={domain}
                type="button"
                onClick={() => setActiveDomain(domain)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                  active
                    ? "border-white/50 bg-white/15 text-white"
                    : "border-white/10 bg-black/40 text-white/60 hover:border-white/25 hover:text-white"
                }`}
              >
                <span
                  className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {formatDomainLabel(domain)}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Interactive Workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Draggable Node Graph Canvas (always LTR for coordinate math) */}
        <div
          dir="ltr"
          className="relative flex-1 overflow-auto"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        >
          <div className="relative min-h-[1080px] min-w-[1380px] p-6">
            {/* Animated SVG Relation Cables */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {meta.edges.map((edge) => {
                if (
                  !visibleModelNames.has(edge.from) ||
                  !visibleModelNames.has(edge.to)
                ) {
                  return null;
                }
                const fromPos = positions[edge.from];
                const toPos = positions[edge.to];
                if (!fromPos || !toPos) return null;

                const x1 = fromPos.x + 135;
                const y1 = fromPos.y + 42;
                const x2 = toPos.x + 135;
                const y2 = toPos.y + 42;
                const cx = (x1 + x2) / 2;

                const isHighlighted =
                  focusModelName &&
                  (edge.from === focusModelName || edge.to === focusModelName);
                const strokeColor = isHighlighted
                  ? getDomainColor(
                      meta.models.find((m) => m.name === edge.from)?.domain ??
                        ""
                    )
                  : "rgba(255,255,255,0.16)";

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2.2 : 1.1}
                      strokeDasharray={isHighlighted ? "8 6" : "4 6"}
                      className={
                        isHighlighted ? "animate-schema-cable" : "opacity-60"
                      }
                    />
                    {isHighlighted ? (
                      <circle cx={x2} cy={y2} r={4} fill={strokeColor} />
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {/* Draggable Model Nodes */}
            {filteredModels.map((model) => {
              const pos = positions[model.name] ?? model.position;
              const domainColor = getDomainColor(model.domain);
              const isSelected = selectedModelName === model.name;
              const isDimmed =
                focusModelName !== null && !connectedToFocus.has(model.name);
              const scalarFields = model.fields.filter(
                (f) => !f.isModelRelation
              );

              return (
                <div
                  key={model.name}
                  onPointerDown={(e) => handlePointerDown(e, model.name)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onMouseEnter={() => setHoveredModelName(model.name)}
                  onMouseLeave={() => setHoveredModelName(null)}
                  style={{
                    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                    borderColor: isSelected
                      ? domainColor
                      : "rgba(255,255,255,0.14)",
                    boxShadow: isSelected
                      ? `0 0 28px ${domainColor}44`
                      : "0 12px 30px rgba(0,0,0,0.65)",
                  }}
                  className={`absolute left-0 top-0 w-[270px] cursor-grab active:cursor-grabbing select-none rounded-2xl border bg-[#0b0816]/95 backdrop-blur-md transition-opacity duration-300 ${
                    isDimmed ? "opacity-35" : "opacity-100"
                  }`}
                >
                  {/* Node Header */}
                  <div
                    className="flex items-center justify-between rounded-t-2xl border-b border-white/10 px-3.5 py-2.5"
                    style={{
                      background: `linear-gradient(90deg, ${domainColor}24 0%, transparent 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Table2
                        className="h-3.5 w-3.5"
                        style={{ color: domainColor }}
                      />
                      <span className="text-xs font-bold tracking-wide text-white">
                        {model.name}
                      </span>
                    </div>
                    <span className="rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
                      {model.tableName}
                    </span>
                  </div>

                  {/* Preview Top Fields */}
                  <div className="divide-y divide-white/5 px-3.5 py-1.5">
                    {scalarFields.slice(0, 6).map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between py-1 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {field.isId ? (
                            <Key className="h-3 w-3 shrink-0 text-amber-400" />
                          ) : field.isForeignKey ? (
                            <Link2 className="h-3 w-3 shrink-0 text-cyan-400" />
                          ) : (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" />
                          )}
                          <span className="truncate font-mono text-white/90">
                            {field.name}
                          </span>
                        </div>
                        <span className="ml-2 shrink-0 font-mono text-[10px] text-white/45">
                          {field.rawType}
                        </span>
                      </div>
                    ))}
                    {scalarFields.length > 6 ? (
                      <div className="py-1 text-center text-[10px] font-medium text-white/45">
                        {t.moreFields(scalarFields.length - 6)}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right/Left Side Tech Inspector Panel */}
        {selectedModel ? (
          <aside className="z-30 flex w-full max-w-sm shrink-0 flex-col border-s border-white/10 bg-[#080611]/95 backdrop-blur-xl">
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
                  style={{
                    backgroundColor: getDomainColor(selectedModel.domain),
                  }}
                >
                  {formatDomainLabel(selectedModel.domain)}
                </span>
                <h2 className="mt-2 font-serif text-xl font-semibold text-white">
                  {selectedModel.name}
                </h2>
                {lang === "ar" && MODEL_PURPOSE_AR[selectedModel.name] ? (
                  <p className="mt-1 text-xs leading-relaxed text-white/75">
                    {MODEL_PURPOSE_AR[selectedModel.name]}
                  </p>
                ) : null}
                <p className="mt-1 font-mono text-xs text-white/55">
                  {t.pgTable}:{" "}
                  <span className="text-cyan-300">{selectedModel.tableName}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyModelSummary(selectedModel)}
                  className="rounded-lg border border-white/15 p-2 text-white/70 hover:border-white/35 hover:text-white"
                  title={t.copyTooltip}
                >
                  {copiedModel === selectedModel.name ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModelName(null)}
                  className="rounded-lg border border-white/15 p-2 text-white/70 hover:border-white/35 hover:text-white"
                  aria-label="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* All Fields */}
              <div>
                <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {t.columns} (
                  {
                    selectedModel.fields.filter((f) => !f.isModelRelation)
                      .length
                  }
                  )
                </h3>
                <div className="space-y-1.5">
                  {selectedModel.fields
                    .filter((f) => !f.isModelRelation)
                    .map((field) => (
                      <div
                        key={field.name}
                        dir="ltr"
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {field.isId ? (
                            <Key className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          ) : field.isForeignKey ? (
                            <Link2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          ) : (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                          )}
                          <span className="truncate font-mono text-white">
                            {field.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {field.isUnique ? (
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                              UQ
                            </span>
                          ) : null}
                          <span className="font-mono text-[11px] text-cyan-300/90">
                            {field.rawType}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Relations */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <GitBranch className="h-3.5 w-3.5" />
                  {t.relationsTitle}
                </h3>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {meta.edges
                    .filter(
                      (e) =>
                        e.from === selectedModel.name ||
                        e.to === selectedModel.name
                    )
                    .map((edge) => {
                      const target =
                        edge.from === selectedModel.name ? edge.to : edge.from;
                      const dir =
                        edge.from === selectedModel.name ? "→" : "←";
                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => setSelectedModelName(target)}
                          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-white/85 transition-colors hover:border-cyan-400/60 hover:text-cyan-200"
                        >
                          {dir} {target}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Indexes */}
              {selectedModel.indexes.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                    {t.indexesTitle}
                  </h3>
                  <div className="space-y-1" dir="ltr">
                    {selectedModel.indexes.map((idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-white/70"
                      >
                        [{idx}]
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}

        {/* Enums Vault Overlay Drawer */}
        {showEnums ? (
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto border-t border-purple-400/30 bg-[#080612]/95 p-6 backdrop-blur-xl shadow-2xl">
            <div className="mx-auto max-w-[1500px]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-white">
                  {t.enumsTitle} ({meta.enums.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowEnums(false)}
                  className="rounded-full border border-white/15 p-1.5 text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div
                dir="ltr"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {meta.enums.map((en) => (
                  <div
                    key={en.name}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <h3 className="font-mono text-xs font-bold text-purple-300">
                      enum {en.name}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {en.values.map((v) => (
                        <span
                          key={v}
                          className="rounded-md border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[10px] text-white/80"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
