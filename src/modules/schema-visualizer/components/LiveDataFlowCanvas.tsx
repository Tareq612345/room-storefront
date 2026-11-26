/**
 * @file src/modules/schema-visualizer/components/LiveDataFlowCanvas.tsx
 * @purpose Ultra-wide interactive Live Data Flow & Value Tracer for /schema/: fetches real Supabase rows and isolated organizer registries to trace any product, universe, or collection from Admin writer -> Isolated Data Store -> API Reader -> Storefront Pages.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Layers,
  Package,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Store,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Lang = "en" | "ar";
type TracedEntityKind = "product" | "universe" | "package";

interface TracedUniverse {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  accentColor: string;
  iconPngUrl?: string | null;
  isActive: boolean;
  productIds: string[];
  offerIds: string[];
  updatedAt?: string;
}

interface TracedProduct {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  basePrice: number;
  stock: number;
  isVaulted: boolean;
  accentColor: string;
  universeSlug?: string;
  cardImageUrl?: string;
  detailLayout?: string;
  isActive: boolean;
  updatedAt?: string;
}

interface TracedPackage {
  id: string;
  slug: string;
  kind: string;
  name: string;
  tagline?: string;
  accentColor: string;
  pricingMode?: string;
  finalPrice?: number | null;
  bannerImageUrl?: string;
  heroImageUrl?: string;
  productIds: string[];
  isActive: boolean;
  updatedAt?: string;
}

interface LiveFlowSnapshot {
  fetchedAt: string;
  universes: TracedUniverse[];
  products: TracedProduct[];
  packages: TracedPackage[];
  storeConfig: { name: string; defaultAccentColor: string; updatedAt?: string } | null;
  homeSectionsCount: number;
  legacyCounts: {
    universes: number;
    products: number;
    bundles: number;
    orders: number;
    users: number;
    shippingZones: number;
  };
  hasIsolatedUniverseRow: boolean;
  hasIsolatedProductRow: boolean;
  hasIsolatedPackageRow: boolean;
}

interface SelectedTrace {
  kind: TracedEntityKind;
  id: string;
}

const COPY = {
  ar: {
    heading: "متتبع حركة الداتا الحية (Live Data Flow)",
    subheading:
      "يعرض المسار الفعلي لكل قيمة من شاشة الإدارة ← المخزن المعزول في Supabase ← دوال القراءة ← صفحات الموقع. اضغط على أي منتج أو يونيفيرس أو كوليكشن لتتبع مساره وقيمه الحية.",
    searchPlaceholder: "ابحث باسم أو slug لأي منتج أو يونيفيرس أو كوليكشن لتتبع مساره...",
    refresh: "تحديث الداتا الحية",
    lastSync: "آخر مزامنة",
    stage1: "1. أنظمة التعديل (Writers)",
    stage2: "2. المخازن الفعلية في Supabase",
    stage3: "3. دوال القراءة الوسيطة (APIs)",
    stage4: "4. صفحات الموقع المستهلكة",
    isolatedTag: "مخزن معزول",
    legacyTag: "جداول الموقع الأساسية",
    active: "مفعّل",
    paused: "معطّل",
    clickToTrace: "اضغط على أي عنصر في العمود (2) لتتبع مساره بالكامل",
    inspectorTitle: "تفاصيل السجل المتتبَّع وقيمه الفعلية",
    clearTrace: "إلغاء التتبع",
    writtenBy: "مصدر التعديل",
    storedIn: "مكان الحفظ الفعلي",
    readVia: "دالة القراءة",
    appearsOn: "يظهر حالياً في",
    notVisiblePaused: "لا يظهر في الموقع لأنه معطّل مؤقتاً",
    openAdmin: "فتح في الإدارة",
    openLive: "معاينة في الموقع",
    rawJson: "القيم الفعلية المخزنة (Live JSON)",
    loading: "جاري سحب البيانات الفعلية من Supabase...",
    counts: {
      universes: "يونيفيرسز",
      products: "منتجات",
      packages: "باكدجات وكوليكشنز",
      homeSections: "أقسام الرئيسية",
      orders: "طلبات",
    },
  },
  en: {
    heading: "Live End-to-End Data Flow Tracer",
    subheading:
      "Displays live values moving from Admin Writers → Isolated Supabase Stores → Data Manager APIs → Storefront Pages. Click any product, universe, or collection to trace its full live path.",
    searchPlaceholder: "Search any product, universe, or collection by name or slug...",
    refresh: "Refresh Live Data",
    lastSync: "Last synced",
    stage1: "1. Admin Writers",
    stage2: "2. Live Supabase Stores",
    stage3: "3. Reader APIs",
    stage4: "4. Storefront Pages",
    isolatedTag: "Isolated Store",
    legacyTag: "Core DB Tables",
    active: "Active",
    paused: "Paused",
    clickToTrace: "Click any live item in Column 2 to trace its full path & values",
    inspectorTitle: "Live Traced Record & Values",
    clearTrace: "Clear Trace",
    writtenBy: "Written By",
    storedIn: "Stored In",
    readVia: "Read Via API",
    appearsOn: "Currently Consumed By",
    notVisiblePaused: "Hidden from Storefront (currently paused)",
    openAdmin: "Open in Admin",
    openLive: "Open Live Page",
    rawJson: "Live Stored Values (JSON)",
    loading: "Fetching live data from Supabase...",
    counts: {
      universes: "Universes",
      products: "Products",
      packages: "Packages & Collections",
      homeSections: "Home Sections",
      orders: "Orders",
    },
  },
} as const;

export function LiveDataFlowCanvas({ lang }: { lang: Lang }) {
  const t = COPY[lang];

  const [snapshot, setSnapshot] = useState<LiveFlowSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [trace, setTrace] = useState<SelectedTrace | null>(null);

  const loadLiveSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const [
        isolatedRows,
        homeRows,
        stores,
        legacyUnivs,
        legacyProds,
        legacyBundles,
        orders,
        users,
        zones,
      ] = await Promise.all([
        sbSelect<{ id: string; pageKey: string; config: unknown; updatedAt: string }>(
          "page_sections",
          "select=id,pageKey,config,updatedAt&pageKey=in.(__isolated_universe_organizer_v1__,__isolated_product_organizer_v1__,__isolated_package_organizer_v1__)"
        ),
        sbSelect<{ id: string }>(
          "page_sections",
          "select=id&pageKey=eq.home"
        ),
        sbSelect<{ name: string; defaultAccentColor: string; updatedAt: string }>(
          "store_configs",
          "select=name,defaultAccentColor,updatedAt&slug=eq.room-egypt"
        ),
        sbSelect<{ id: string }>("universes", "select=id"),
        sbSelect<{ id: string }>("products", "select=id"),
        sbSelect<{ id: string }>("bundles", "select=id"),
        sbSelect<{ id: string }>("orders", "select=id"),
        sbSelect<{ id: string }>("users", "select=id"),
        sbSelect<{ id: string }>("shipping_zones", "select=id"),
      ]);

      const uRow = isolatedRows.find(
        (r) => r.pageKey === "__isolated_universe_organizer_v1__"
      );
      const pRow = isolatedRows.find(
        (r) => r.pageKey === "__isolated_product_organizer_v1__"
      );
      const kRow = isolatedRows.find(
        (r) => r.pageKey === "__isolated_package_organizer_v1__"
      );

      const uCfg = (uRow?.config ?? {}) as { universes?: TracedUniverse[] };
      const pCfg = (pRow?.config ?? {}) as { products?: TracedProduct[] };
      const kCfg = (kRow?.config ?? {}) as { packages?: TracedPackage[] };

      const universes = Array.isArray(uCfg.universes) ? uCfg.universes : [];
      const products = Array.isArray(pCfg.products) ? pCfg.products : [];
      const packages = Array.isArray(kCfg.packages) ? kCfg.packages : [];

      setSnapshot({
        fetchedAt: new Date().toLocaleTimeString(),
        universes,
        products,
        packages,
        storeConfig: stores[0] ?? null,
        homeSectionsCount: homeRows.length,
        legacyCounts: {
          universes: legacyUnivs.length,
          products: legacyProds.length,
          bundles: legacyBundles.length,
          orders: orders.length,
          users: users.length,
          shippingZones: zones.length,
        },
        hasIsolatedUniverseRow: Boolean(uRow),
        hasIsolatedProductRow: Boolean(pRow),
        hasIsolatedPackageRow: Boolean(kRow),
      });

      setTrace((prev) => {
        if (prev) return prev;
        if (products[0]) return { kind: "product", id: products[0].id };
        if (universes[0]) return { kind: "universe", id: universes[0].id };
        return null;
      });
    } catch {
      // Keep last snapshot
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLiveSnapshot();
  }, [loadLiveSnapshot]);

  const q = search.trim().toLowerCase();

  const filteredUniverses = useMemo(
    () =>
      (snapshot?.universes ?? []).filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.slug.toLowerCase().includes(q)
      ),
    [snapshot?.universes, q]
  );

  const filteredProducts = useMemo(
    () =>
      (snapshot?.products ?? []).filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      ),
    [snapshot?.products, q]
  );

  const filteredPackages = useMemo(
    () =>
      (snapshot?.packages ?? []).filter(
        (k) =>
          !q ||
          k.name.toLowerCase().includes(q) ||
          k.slug.toLowerCase().includes(q)
      ),
    [snapshot?.packages, q]
  );

  const tracedSummary = useMemo(() => {
    if (!snapshot || !trace) return null;

    if (trace.kind === "product") {
      const prod = snapshot.products.find((p) => p.id === trace.id);
      if (!prod) return null;

      const parentUniverses = snapshot.universes.filter((u) =>
        u.productIds.includes(prod.id)
      );
      const parentPackages = snapshot.packages.filter((k) =>
        k.productIds.includes(prod.id)
      );

      return {
        kind: "product" as const,
        title: prod.name,
        slug: prod.slug,
        accent: prod.accentColor,
        isActive: prod.isActive,
        writerLabel: "Product Organizer (/admin/products/)",
        writerHref: "/admin/products/",
        storeLabel:
          "Supabase: page_sections [id=porg_isolated_registry_v1, pageKey=__isolated_product_organizer_v1__] + localStorage (room_isolated_product_organizer_v1)",
        apiLabel:
          "fetchResolvedProductsForStorefront() & fetchResolvedProductDetail(slug)",
        liveHref: `/product/?slug=${encodeURIComponent(prod.slug)}`,
        consumers: [
          {
            label: "Homepage Fresh Drops (/)",
            href: "/",
            active: prod.isActive,
          },
          {
            label: `Inner Product Page (/product/?slug=${prod.slug})`,
            href: `/product/?slug=${encodeURIComponent(prod.slug)}`,
            active: prod.isActive,
          },
          ...parentUniverses.map((u) => ({
            label: `Universe: ${u.name}`,
            href:
              ["cars", "gaming", "anime"].includes(u.slug)
                ? `/universes/${u.slug}`
                : `/universe/?slug=${encodeURIComponent(u.slug)}`,
            active: prod.isActive && u.isActive,
          })),
          ...parentPackages.map((k) => ({
            label: `Collection/Pack: ${k.name}`,
            href: `/package/?slug=${encodeURIComponent(k.slug)}`,
            active: prod.isActive && k.isActive,
          })),
        ],
        raw: prod,
      };
    }

    if (trace.kind === "universe") {
      const univ = snapshot.universes.find((u) => u.id === trace.id);
      if (!univ) return null;

      const memberProducts = snapshot.products.filter((p) =>
        univ.productIds.includes(p.id)
      );
      const memberPackages = snapshot.packages.filter((k) =>
        univ.offerIds.includes(k.id)
      );
      const href = ["cars", "gaming", "anime"].includes(univ.slug)
        ? `/universes/${univ.slug}`
        : `/universe/?slug=${encodeURIComponent(univ.slug)}`;

      return {
        kind: "universe" as const,
        title: univ.name,
        slug: univ.slug,
        accent: univ.accentColor,
        isActive: univ.isActive,
        writerLabel: "Universe Organizer (/admin/universes/)",
        writerHref: "/admin/universes/",
        storeLabel:
          "Supabase: page_sections [id=uorg_isolated_registry_v1, pageKey=__isolated_universe_organizer_v1__] + localStorage (room_isolated_universe_organizer_v1)",
        apiLabel:
          "fetchResolvedUniversesForStorefront() & fetchResolvedUniverseDetail(slug)",
        liveHref: href,
        consumers: [
          {
            label: "Homepage Universe Grid & Star Header (/)",
            href: "/",
            active: univ.isActive,
          },
          {
            label: `Universe Page (${href}) • ${memberProducts.length} products • ${memberPackages.length} packs`,
            href,
            active: univ.isActive,
          },
        ],
        raw: univ,
      };
    }

    const pkg = snapshot.packages.find((k) => k.id === trace.id);
    if (!pkg) return null;
    const parentUniverses = snapshot.universes.filter((u) =>
      u.offerIds.includes(pkg.id)
    );
    const memberProducts = snapshot.products.filter((p) =>
      pkg.productIds.includes(p.id)
    );

    return {
      kind: "package" as const,
      title: pkg.name,
      slug: pkg.slug,
      accent: pkg.accentColor,
      isActive: pkg.isActive,
      writerLabel: "Packages & Collections Organizer (/admin/packages/)",
      writerHref: "/admin/packages/",
      storeLabel:
        "Supabase: page_sections [id=korg_isolated_registry_v1, pageKey=__isolated_package_organizer_v1__] + localStorage (room_isolated_package_organizer_v1)",
      apiLabel:
        "fetchResolvedPackagesForStorefront() & fetchResolvedPackageDetail(slug)",
      liveHref: `/package/?slug=${encodeURIComponent(pkg.slug)}`,
      consumers: [
        {
          label: "Homepage Loadouts & Collections (/)",
          href: "/",
          active: pkg.isActive,
        },
        {
          label: `Detail Page (/package/?slug=${pkg.slug}) • ${memberProducts.length} products`,
          href: `/package/?slug=${encodeURIComponent(pkg.slug)}`,
          active: pkg.isActive,
        },
        ...parentUniverses.map((u) => ({
          label: `Inside Universe: ${u.name}`,
          href:
            ["cars", "gaming", "anime"].includes(u.slug)
              ? `/universes/${u.slug}`
              : `/universe/?slug=${encodeURIComponent(u.slug)}`,
          active: pkg.isActive && u.isActive,
        })),
      ],
      raw: pkg,
    };
  }, [snapshot, trace]);

  return (
    <div className="flex-1 space-y-5 overflow-x-auto bg-[#040308] p-4 md:p-6">
      {/* Top Tracer Bar */}
      <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-[#080612]/90 p-4 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-cyan-300" />
            <h2 className="font-serif text-base font-semibold text-white">
              {t.heading}
            </h2>
            {snapshot ? (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                {t.lastSync}: {snapshot.fetchedAt}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            {t.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 w-72 rounded-full border border-white/15 bg-black/60 pl-9 pr-4 text-xs text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadLiveSnapshot()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* Live Traced Summary Banner (when an item is clicked) */}
      {tracedSummary ? (
        <div
          className="mx-auto max-w-[1720px] rounded-2xl border bg-[#090714]/95 p-5 shadow-2xl"
          style={{
            borderColor: `${tracedSummary.accent}88`,
            boxShadow: `0 0 32px ${tracedSummary.accent}22`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 rounded-full border border-white/40"
                style={{ backgroundColor: tracedSummary.accent }}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    {t.inspectorTitle}
                  </span>
                  <span className="font-serif text-base font-semibold text-white">
                    {tracedSummary.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      tracedSummary.isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    {tracedSummary.isActive ? t.active : t.paused}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-white/50" dir="ltr">
                  slug: {tracedSummary.slug}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={tracedSummary.writerHref}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-[11px] font-bold text-white hover:bg-white/20"
              >
                <Sparkles className="h-3 w-3" />
                <span>{t.openAdmin}</span>
              </Link>
              <Link
                href={tracedSummary.liveHref}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-bold text-black hover:opacity-90"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{t.openLive}</span>
              </Link>
              <button
                type="button"
                onClick={() => setTrace(null)}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-white/15 px-3 text-[11px] text-white/70 hover:text-white"
              >
                <X className="h-3 w-3" />
                <span>{t.clearTrace}</span>
              </button>
            </div>
          </div>

          {/* 4-Step Traced Path Cards */}
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4" dir="ltr">
            <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/[0.06] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
                1. {t.writtenBy}
              </p>
              <p className="mt-1.5 font-mono text-xs font-semibold text-white">
                {tracedSummary.writerLabel}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                2. {t.storedIn}
              </p>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-white/90">
                {tracedSummary.storeLabel}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                3. {t.readVia}
              </p>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-white/90">
                {tracedSummary.apiLabel}
              </p>
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                4. {t.appearsOn}
              </p>
              {!tracedSummary.isActive ? (
                <p className="mt-1.5 text-xs text-amber-200">{t.notVisiblePaused}</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {tracedSummary.consumers.map((c) => (
                    <Link
                      key={c.label}
                      href={c.href}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold ${
                        c.active
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                          : "border-white/15 bg-white/5 text-white/50"
                      }`}
                    >
                      {c.active ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      <span>{c.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Raw JSON */}
          <details className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3" dir="ltr">
            <summary className="cursor-pointer font-mono text-[11px] font-bold text-cyan-300">
              {t.rawJson}
            </summary>
            <pre className="mt-2 max-h-56 overflow-auto font-mono text-[11px] leading-relaxed text-white/80">
              {JSON.stringify(tracedSummary.raw, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      {/* ============================================================
          ULTRA-WIDE 4-STAGE LIVE DATA FLOW BOARD
         ============================================================ */}
      {loading && !snapshot ? (
        <div className="mx-auto max-w-[1720px] rounded-3xl border border-white/10 bg-[#080612] p-16 text-center text-sm text-white/60">
          {t.loading}
        </div>
      ) : snapshot ? (
        <div
          dir="ltr"
          className="mx-auto max-w-[1720px] overflow-x-auto rounded-3xl border border-white/10 p-6"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        >
          <div className="grid min-w-[1380px] grid-cols-12 items-start gap-5">
            {/* COLUMN 1: WRITERS (2 cols) */}
            <div className="col-span-3 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">
                  {t.stage1}
                </h3>
              </div>

              {[
                {
                  title: "Universe Organizer",
                  route: "/admin/universes/",
                  target: "__isolated_universe_organizer_v1__",
                  color: "#c94b99",
                  active: trace?.kind === "universe",
                },
                {
                  title: "Product Organizer",
                  route: "/admin/products/",
                  target: "__isolated_product_organizer_v1__",
                  color: "#6366f1",
                  active: trace?.kind === "product",
                },
                {
                  title: "Packages & Collections",
                  route: "/admin/packages/",
                  target: "__isolated_package_organizer_v1__",
                  color: "#f59e0b",
                  active: trace?.kind === "package",
                },
                {
                  title: "Legacy Admin & Visual Editor",
                  route: "/admin/ & /admin/editor/",
                  target: "store_configs, page_sections(home), orders",
                  color: "#38bdf8",
                  active: false,
                },
              ].map((w) => (
                <div
                  key={w.route}
                  className="rounded-2xl border bg-[#0b0816]/95 p-4 transition-all"
                  style={{
                    borderColor: w.active ? w.color : "rgba(255,255,255,0.12)",
                    boxShadow: w.active ? `0 0 24px ${w.color}33` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{w.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white/45" />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-cyan-300">{w.route}</p>
                  <p className="mt-2 truncate rounded-lg bg-black/50 px-2.5 py-1 font-mono text-[10px] text-white/65">
                    writes → {w.target}
                  </p>
                </div>
              ))}
            </div>

            {/* COLUMN 2: LIVE SUPABASE STORES WITH ACTUAL VALUES (5 cols) */}
            <div className="col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-300" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    {t.stage2}
                  </h3>
                </div>
                <span className="text-[10px] text-white/50">{t.clickToTrace}</span>
              </div>

              {/* Isolated Universes Store */}
              <div className="rounded-2xl border border-fuchsia-400/30 bg-[#0b0816]/95 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold text-fuchsia-200">
                      <ShieldCheck className="h-3 w-3" />
                      {t.isolatedTag}
                    </span>
                    <h4 className="mt-1 font-mono text-xs font-bold text-white">
                      uorg_isolated_registry_v1 ({filteredUniverses.length})
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-white/45">
                    __isolated_universe_organizer_v1__
                  </span>
                </div>

                <div className="space-y-1.5">
                  {filteredUniverses.map((u) => {
                    const isTraced = trace?.kind === "universe" && trace.id === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setTrace({ kind: "universe", id: u.id })}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                          isTraced
                            ? "border-fuchsia-400 bg-fuchsia-500/20"
                            : "border-white/10 bg-black/45 hover:border-white/30"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: u.accentColor }}
                          />
                          <span className="truncate text-xs font-semibold text-white">
                            {u.name}
                          </span>
                          <span className="font-mono text-[10px] text-white/45">
                            /{u.slug}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[10px]">
                          {u.iconPngUrl ? (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">
                              PNG
                            </span>
                          ) : null}
                          <span className="text-white/65">
                            {u.productIds.length}P • {u.offerIds.length}O
                          </span>
                          {u.isActive ? (
                            <Eye className="h-3 w-3 text-emerald-300" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-amber-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Isolated Products Store */}
              <div className="rounded-2xl border border-indigo-400/30 bg-[#0b0816]/95 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200">
                      <Package className="h-3 w-3" />
                      {t.isolatedTag}
                    </span>
                    <h4 className="mt-1 font-mono text-xs font-bold text-white">
                      porg_isolated_registry_v1 ({filteredProducts.length})
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-white/45">
                    __isolated_product_organizer_v1__
                  </span>
                </div>

                <div className="space-y-1.5">
                  {filteredProducts.map((p) => {
                    const isTraced = trace?.kind === "product" && trace.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTrace({ kind: "product", id: p.id })}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                          isTraced
                            ? "border-indigo-400 bg-indigo-500/20"
                            : "border-white/10 bg-black/45 hover:border-white/30"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: p.accentColor }}
                          />
                          <span className="truncate text-xs font-semibold text-white">
                            {p.name}
                          </span>
                          <span className="font-mono text-[10px] text-white/45">
                            /{p.slug}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 font-mono text-[10px]">
                          <span className="font-bold text-cyan-200">
                            {formatEgp(p.basePrice)}
                          </span>
                          <span
                            className={
                              p.isVaulted || p.stock <= 0
                                ? "text-red-300"
                                : "text-emerald-300"
                            }
                          >
                            qty:{p.stock}
                          </span>
                          {p.isActive ? (
                            <Eye className="h-3 w-3 text-emerald-300" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-amber-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Isolated Packages & Collections Store */}
              <div className="rounded-2xl border border-amber-400/30 bg-[#0b0816]/95 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                      <Layers className="h-3 w-3" />
                      {t.isolatedTag}
                    </span>
                    <h4 className="mt-1 font-mono text-xs font-bold text-white">
                      korg_isolated_registry_v1 ({filteredPackages.length})
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-white/45">
                    __isolated_package_organizer_v1__
                  </span>
                </div>

                <div className="space-y-1.5">
                  {filteredPackages.map((k) => {
                    const isTraced = trace?.kind === "package" && trace.id === k.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setTrace({ kind: "package", id: k.id })}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                          isTraced
                            ? "border-amber-400 bg-amber-500/20"
                            : "border-white/10 bg-black/45 hover:border-white/30"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: k.accentColor }}
                          />
                          <span className="truncate text-xs font-semibold text-white">
                            {k.name}
                          </span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/70">
                            {k.kind}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 font-mono text-[10px]">
                          <span className="text-white/75">
                            {k.productIds.length} items
                          </span>
                          {k.finalPrice !== null && k.finalPrice !== undefined ? (
                            <span className="font-bold text-amber-200">
                              {formatEgp(k.finalPrice)}
                            </span>
                          ) : null}
                          {k.isActive ? (
                            <Eye className="h-3 w-3 text-emerald-300" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-amber-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Core Legacy Tables Summary */}
              <div className="rounded-2xl border border-white/15 bg-[#0b0816]/95 p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/75">
                  {t.legacyTag}
                </span>
                <div className="mt-2.5 grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="rounded-lg bg-black/50 p-2">
                    <span className="text-white/45">store_configs:</span>{" "}
                    <span className="font-bold text-white">
                      {snapshot.storeConfig?.name ?? "ROOM"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/50 p-2">
                    <span className="text-white/45">home sections:</span>{" "}
                    <span className="font-bold text-cyan-300">
                      {snapshot.homeSectionsCount}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/50 p-2">
                    <span className="text-white/45">orders:</span>{" "}
                    <span className="font-bold text-emerald-300">
                      {snapshot.legacyCounts.orders}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/50 p-2">
                    <span className="text-white/45">users:</span>{" "}
                    <span className="font-bold text-white">
                      {snapshot.legacyCounts.users}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/50 p-2">
                    <span className="text-white/45">zones:</span>{" "}
                    <span className="font-bold text-white">
                      {snapshot.legacyCounts.shippingZones}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/50 p-2">
                    <span className="text-white/45">legacy rows:</span>{" "}
                    <span className="font-bold text-white/70">
                      {snapshot.legacyCounts.universes}U /{" "}
                      {snapshot.legacyCounts.products}P /{" "}
                      {snapshot.legacyCounts.bundles}B
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: READER APIs (2 cols) */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Server className="h-4 w-4 text-cyan-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                  {t.stage3}
                </h3>
              </div>

              {[
                {
                  mod: "@modules/universe-organizer",
                  fns: [
                    "fetchResolvedUniversesForStorefront()",
                    "fetchResolvedUniverseDetail(slug)",
                  ],
                  color: "#c94b99",
                  active: trace?.kind === "universe",
                },
                {
                  mod: "@modules/product-organizer",
                  fns: [
                    "fetchResolvedProductsForStorefront()",
                    "fetchResolvedProductDetail(slug)",
                  ],
                  color: "#6366f1",
                  active: trace?.kind === "product",
                },
                {
                  mod: "@modules/package-organizer",
                  fns: [
                    "fetchResolvedPackagesForStorefront()",
                    "fetchResolvedPackageDetail(slug)",
                  ],
                  color: "#f59e0b",
                  active: trace?.kind === "package",
                },
                {
                  mod: "@shared/db/supabase-rest",
                  fns: ["sbSelect(home sections, theme, orders)"],
                  color: "#38bdf8",
                  active: false,
                },
              ].map((api) => (
                <div
                  key={api.mod}
                  className="rounded-2xl border bg-[#0b0816]/95 p-3.5 transition-all"
                  style={{
                    borderColor: api.active ? api.color : "rgba(255,255,255,0.12)",
                    boxShadow: api.active ? `0 0 22px ${api.color}33` : undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-white">
                    <GitBranch className="h-3.5 w-3.5" style={{ color: api.color }} />
                    <span className="truncate">{api.mod}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {api.fns.map((fn) => (
                      <div
                        key={fn}
                        className="truncate rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] text-cyan-200"
                      >
                        {fn}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* COLUMN 4: STOREFRONT PAGES (2 cols) */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Store className="h-4 w-4 text-amber-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  {t.stage4}
                </h3>
              </div>

              {[
                {
                  title: "Homepage (/)",
                  href: "/",
                  summary: `${snapshot.universes.filter((u) => u.isActive).length} ${t.counts.universes} • ${snapshot.products.filter((p) => p.isActive).length} ${t.counts.products} • ${snapshot.packages.filter((k) => k.isActive).length} ${t.counts.packages}`,
                  highlighted: Boolean(trace),
                },
                {
                  title: "Universe Pages",
                  href: "/universes/cars",
                  summary: "/universes/[slug] & /universe/?slug=...",
                  highlighted: trace?.kind === "universe" || trace?.kind === "product" || trace?.kind === "package",
                },
                {
                  title: "Product Detail Page",
                  href: snapshot.products[0]
                    ? `/product/?slug=${encodeURIComponent(snapshot.products[0].slug)}`
                    : "/product/",
                  summary: "/product/?slug=...",
                  highlighted: trace?.kind === "product",
                },
                {
                  title: "Package / Collection Page",
                  href: snapshot.packages[0]
                    ? `/package/?slug=${encodeURIComponent(snapshot.packages[0].slug)}`
                    : "/package/",
                  summary: "/package/?slug=...",
                  highlighted: trace?.kind === "package" || trace?.kind === "product",
                },
              ].map((page) => (
                <Link
                  key={page.title}
                  href={page.href}
                  className={`block rounded-2xl border bg-[#0b0816]/95 p-3.5 transition-all hover:border-white/40 ${
                    page.highlighted
                      ? "border-emerald-400/55 shadow-[0_0_20px_rgba(16,185,129,0.16)]"
                      : "border-white/12"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{page.title}</span>
                    <ExternalLink className="h-3 w-3 text-white/55" />
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-white/65">
                    {page.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
