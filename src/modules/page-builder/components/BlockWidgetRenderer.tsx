/**
 * @file src/modules/page-builder/components/BlockWidgetRenderer.tsx
 * @purpose Shared Block & Widget renderer used by both the Live Storefront Homepage and the Visual Editor Canvas.
 */

"use client";

import type { BundleSummaryDTO } from "@modules/bundles";
import { LoadoutsSection } from "@modules/bundles";
import type { ProductSummaryDTO } from "@modules/catalog";
import { ProductCard } from "@modules/catalog";
import type { UniverseDTO } from "@modules/universes";
import { UniverseShowcaseGrid } from "@modules/universes";
import { ShieldCheck, Sparkles, Truck, Zap } from "lucide-react";
import Link from "next/link";

export type WidgetKind =
  | "UNIVERSE_CARDS"
  | "PRODUCT_CARDS"
  | "LOADOUT_CARDS"
  | "PROMO_BANNER"
  | "TEXT_BLOCK"
  | "FEATURE_PILLS"
  | "DIVIDER";

export interface BlockWidget {
  id: string;
  kind: WidgetKind;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  accentColor?: string;
}

export interface BlockConfig {
  eyebrow?: string;
  columns?: 1 | 2 | 3 | 4;
  cardHeight?: "compact" | "medium" | "tall";
  borderRadius?: "sharp" | "rounded" | "pill";
  paddingY?: "sm" | "md" | "lg";
  bgColor?: string;
  accentColor?: string;
  widgets?: BlockWidget[];
}

export interface RenderedBlock {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  visible: boolean;
  config: BlockConfig;
}

interface BlockWidgetRendererProps {
  block: RenderedBlock;
  universes: UniverseDTO[];
  products: ProductSummaryDTO[];
  loadouts: BundleSummaryDTO[];
  isEmptyEditorPlaceholder?: boolean;
}

const PADDING_MAP = {
  sm: "py-4",
  md: "py-8",
  lg: "py-14",
} as const;

const COLS_MAP: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const RADIUS_MAP = {
  sharp: "rounded-md",
  rounded: "rounded-2xl",
  pill: "rounded-[28px]",
} as const;

export function BlockWidgetRenderer({
  block,
  universes,
  products,
  loadouts,
  isEmptyEditorPlaceholder = false,
}: BlockWidgetRendererProps) {
  const cfg = block.config ?? {};
  const widgets = cfg.widgets ?? [];
  const cols = cfg.columns ?? 4;
  const padClass = PADDING_MAP[cfg.paddingY ?? "md"];
  const radiusClass = RADIUS_MAP[cfg.borderRadius ?? "rounded"];
  const accent = cfg.accentColor || "var(--color-accent)";

  // Legacy/Built-in quick blocks when no custom widgets array is defined
  if (widgets.length === 0 && block.type === "UNIVERSE_QUICK_BAR") {
    return <UniverseShowcaseGrid universes={universes} />;
  }
  if (widgets.length === 0 && block.type === "FEATURED_BUNDLES") {
    return (
      <LoadoutsSection
        title={block.title}
        subtitle={block.subtitle}
        loadouts={loadouts}
      />
    );
  }

  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 ${padClass} transition-colors`}
      style={
        cfg.bgColor && cfg.bgColor !== "transparent"
          ? { backgroundColor: cfg.bgColor, borderRadius: "24px" }
          : undefined
      }
    >
      {/* Customizable Block Header (Eyebrow + Title + Subtitle) */}
      {cfg.eyebrow || block.title || block.subtitle ? (
        <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            {cfg.eyebrow ? (
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: accent }}
              >
                {cfg.eyebrow}
              </p>
            ) : null}
            {block.title ? (
              <h2 className="mt-1 font-serif text-2xl font-semibold text-white md:text-3xl">
                {block.title}
              </h2>
            ) : null}
          </div>
          {block.subtitle ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {block.subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Empty Block Dropzone */}
      {widgets.length === 0 ? (
        isEmptyEditorPlaceholder ? (
          <div className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400/35 bg-cyan-500/[0.04] text-center">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            <p className="mt-2 text-xs font-semibold text-cyan-200">
              Empty Block — Drag &amp; Drop any Widget here
            </p>
          </div>
        ) : null
      ) : (
        <div className="space-y-6">
          {widgets.map((widget) => {
            if (widget.kind === "UNIVERSE_CARDS") {
              return (
                <div key={widget.id} className="-mx-4">
                  <UniverseShowcaseGrid universes={universes} />
                </div>
              );
            }

            if (widget.kind === "PRODUCT_CARDS") {
              return (
                <div
                  key={widget.id}
                  className={`grid gap-5 ${COLS_MAP[cols]}`}
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              );
            }

            if (widget.kind === "LOADOUT_CARDS") {
              return (
                <div key={widget.id} className="-mx-4">
                  <LoadoutsSection
                    title={null}
                    subtitle={null}
                    loadouts={loadouts}
                  />
                </div>
              );
            }

            if (widget.kind === "PROMO_BANNER") {
              const wAccent = widget.accentColor || accent;
              return (
                <div
                  key={widget.id}
                  className={`flex flex-col items-start justify-between gap-4 border border-white/15 p-7 md:flex-row md:items-center ${radiusClass}`}
                  style={{
                    background: `linear-gradient(135deg, #07050c 0%, ${wAccent}33 100%)`,
                  }}
                >
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-white md:text-2xl">
                      {widget.heading || "Midnight Cairo Drop"}
                    </h3>
                    <p className="mt-1 text-xs text-white/75">
                      {widget.body || "Upgrade your bedroom setup with limited-run textiles."}
                    </p>
                  </div>
                  <Link
                    href={widget.ctaUrl || "/universes/cars"}
                    className="shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: wAccent }}
                  >
                    {widget.ctaLabel || "Claim Yours"}
                  </Link>
                </div>
              );
            }

            if (widget.kind === "TEXT_BLOCK") {
              return (
                <div
                  key={widget.id}
                  className={`border border-white/10 bg-[var(--color-surface-card)] p-6 text-center ${radiusClass}`}
                >
                  <h3 className="font-serif text-lg font-semibold text-white">
                    {widget.heading || "Built for Cairo & New Cairo"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {widget.body ||
                      "High-craft dark-mode bedsheets engineered to transform your bedroom into your personal Universe."}
                  </p>
                </div>
              );
            }

            if (widget.kind === "FEATURE_PILLS") {
              return (
                <div
                  key={widget.id}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                >
                  {[
                    { icon: <Truck className="h-4 w-4" />, text: "1-2 Days Cairo & New Cairo" },
                    { icon: <ShieldCheck className="h-4 w-4" />, text: "COD & Online Payments" },
                    { icon: <Zap className="h-4 w-4" />, text: "300TC Luxury Dark Cotton" },
                  ].map((pill) => (
                    <div
                      key={pill.text}
                      className={`flex items-center justify-center gap-2.5 border border-white/10 bg-black/50 px-4 py-3 text-xs font-semibold text-white/85 ${radiusClass}`}
                    >
                      <span style={{ color: accent }}>{pill.icon}</span>
                      <span>{pill.text}</span>
                    </div>
                  ))}
                </div>
              );
            }

            if (widget.kind === "DIVIDER") {
              return (
                <div
                  key={widget.id}
                  className="my-2 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              );
            }

            return null;
          })}
        </div>
      )}
    </section>
  );
}
