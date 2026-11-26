/**
 * @file src/modules/home-composer/components/HomeComposerBlockRenderer.tsx
 * @purpose Shared WYSIWYG Block & Item Renderer used identically by both the Live Storefront Homepage (/) and the Isolated Homepage Composer Preview (/admin/home/).
 */

"use client";

import {
  ActionButtonView,
  ReadingTextBlockView,
} from "@modules/element-organizer";
import {
  StorefrontPackageBannerCard,
  getPackageHref,
} from "@modules/package-organizer";
import {
  StorefrontProductBannerCard,
  getProductHref,
} from "@modules/product-organizer";
import {
  StorefrontUniverseCard,
  getUniverseHref,
} from "@modules/universe-organizer";
import Link from "next/link";
import type { ComposerVaultsData } from "../client-api";
import type {
  BlockPlacedItem,
  DesktopCols,
  DividerStyleConfig,
  HomeBlock,
  ItemWidth,
  MobileCols,
} from "../schema";

interface HomeComposerBlockRendererProps {
  block: HomeBlock;
  vaults: ComposerVaultsData;
  interactive?: boolean;
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
  forceMobilePreview?: boolean;
}

const CONTAINER_WIDTH_CLASS: Record<HomeBlock["containerWidth"], string> = {
  narrow: "max-w-4xl",
  standard: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-full",
};

const PAD_Y_CLASS: Record<HomeBlock["paddingY"], string> = {
  sm: "py-4",
  md: "py-8 md:py-10",
  lg: "py-12 md:py-16",
};

const GAP_CLASS: Record<HomeBlock["gap"], string> = {
  sm: "gap-3",
  md: "gap-5 md:gap-6",
  lg: "gap-7 md:gap-8",
};

const RADIUS_CLASS: Record<HomeBlock["borderRadius"], string> = {
  sharp: "rounded-md",
  rounded: "rounded-2xl",
  pill: "rounded-[32px]",
};

const MOBILE_COLS_MAP: Record<Exclude<MobileCols, "auto">, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const DESKTOP_COLS_MAP: Record<Exclude<DesktopCols, "auto">, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

function resolveAutoDesktopCols(items: BlockPlacedItem[]): Exclude<DesktopCols, "auto"> {
  if (items.length <= 1) return 1;
  if (items.length === 2) return 2;
  if (items.length === 3) return 3;
  const hasOnlyCards = items.every(
    (i) => i.kind === "UNIVERSE_CARD" || i.kind === "PACKAGE_CARD"
  );
  if (hasOnlyCards && items.length <= 3) return 3;
  return 4;
}

function resolveAutoMobileCols(items: BlockPlacedItem[]): Exclude<MobileCols, "auto"> {
  const hasOnlySmall = items.every((i) => i.kind === "BUTTON" || i.kind === "DIVIDER");
  if (hasOnlySmall && items.length >= 2) return 2;
  return 1;
}

function resolveColSpanClass(width: ItemWidth, desktopCols: number, forceMobile: boolean): string {
  if (width === "full" || width === "fit") return "col-span-full";
  if (forceMobile) return "";
  if (width === "1/2") {
    if (desktopCols >= 4) return "lg:col-span-2";
    if (desktopCols === 3) return "lg:col-span-2";
    return "lg:col-span-1";
  }
  if (width === "2/3") {
    if (desktopCols >= 3) return "lg:col-span-2";
    return "col-span-full";
  }
  if (width === "1/3") return "lg:col-span-1";
  return "";
}

function resolveFlexJustify(align: BlockPlacedItem["align"]): string {
  if (align === "start") return "justify-start";
  if (align === "end") return "justify-end";
  return "justify-center";
}

function renderDivider(cfg: DividerStyleConfig) {
  const widthCls =
    cfg.width === "1/3"
      ? "w-1/3"
      : cfg.width === "1/2"
        ? "w-1/2"
        : cfg.width === "3/4"
          ? "w-3/4"
          : "w-full";

  const alignCls =
    cfg.align === "left"
      ? "mr-auto"
      : cfg.align === "right"
        ? "ml-auto"
        : "mx-auto";

  const lineStyle: React.CSSProperties =
    cfg.style === "glow"
      ? {
          height: `${cfg.thickness}px`,
          background: `linear-gradient(90deg, transparent 0%, ${cfg.color} 50%, transparent 100%)`,
          boxShadow: `0 0 16px ${cfg.color}55`,
        }
      : cfg.style === "dashed"
        ? {
            borderTop: `${cfg.thickness}px dashed ${cfg.color}`,
            height: 0,
          }
        : {
            height: `${cfg.thickness}px`,
            backgroundColor: cfg.color,
          };

  return (
    <div className={`flex items-center gap-3 py-2 ${widthCls} ${alignCls}`}>
      <div className="flex-1" style={lineStyle} />
      {cfg.label.trim() ? (
        <>
          <span
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
          <div className="flex-1" style={lineStyle} />
        </>
      ) : null}
    </div>
  );
}

export function HomeComposerBlockRenderer({
  block,
  vaults,
  interactive = true,
  selectedItemId,
  onSelectItem,
  forceMobilePreview = false,
}: HomeComposerBlockRendererProps) {
  const effectiveDesktopCols =
    block.desktopCols === "auto"
      ? resolveAutoDesktopCols(block.items)
      : block.desktopCols;
  const effectiveMobileCols =
    block.mobileCols === "auto"
      ? resolveAutoMobileCols(block.items)
      : block.mobileCols;

  const gridColsClass = forceMobilePreview
    ? MOBILE_COLS_MAP[effectiveMobileCols]
    : `${MOBILE_COLS_MAP[effectiveMobileCols]} ${DESKTOP_COLS_MAP[effectiveDesktopCols]}`;

  const containerCls = CONTAINER_WIDTH_CLASS[block.containerWidth];
  const padCls = PAD_Y_CLASS[block.paddingY];
  const gapCls = GAP_CLASS[block.gap];
  const radiusCls = RADIUS_CLASS[block.borderRadius];

  const headerAlignCls =
    block.headerAlign === "center"
      ? "items-center text-center"
      : block.headerAlign === "right"
        ? "items-end text-right"
        : "items-start text-left";

  return (
    <section
      dir={block.startDirection}
      className={`mx-auto w-full px-4 ${containerCls} ${padCls} transition-colors ${radiusCls}`}
      style={
        block.bgColor && block.bgColor !== "transparent"
          ? { backgroundColor: block.bgColor }
          : undefined
      }
    >
      {/* Block Eyebrow / Title / Subtitle matching Storefront typography scale */}
      {block.eyebrow || block.title || block.subtitle ? (
        <div className={`mb-6 flex flex-col gap-1.5 ${headerAlignCls}`}>
          {block.eyebrow ? (
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: block.eyebrowColor || "var(--color-accent)" }}
            >
              {block.eyebrow}
            </p>
          ) : null}
          {block.title ? (
            <h2
              dir="auto"
              className="font-serif text-2xl font-semibold md:text-3xl"
              style={{ color: block.titleColor || "#ffffff" }}
            >
              {block.title}
            </h2>
          ) : null}
          {block.subtitle ? (
            <p
              dir="auto"
              className="max-w-2xl text-sm text-[var(--color-text-secondary)]"
            >
              {block.subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Block Items Grid */}
      {block.items.length > 0 ? (
        <div
          className={`grid ${gridColsClass} ${gapCls} ${
            block.gridAlign === "center" ? "justify-items-stretch" : ""
          }`}
        >
          {block.items.map((item) => {
            const spanCls = resolveColSpanClass(
              item.width,
              effectiveDesktopCols,
              forceMobilePreview
            );
            const justifyCls = resolveFlexJustify(item.align);
            const isSelected = selectedItemId === item.id;

            let innerNode: React.ReactNode = null;

            if (item.kind === "UNIVERSE_CARD") {
              const univ = vaults.universes.find((u) => u.id === item.refId);
              if (!univ) return null;
              innerNode = interactive ? (
                <Link href={getUniverseHref(univ.slug)} className="block w-full">
                  <StorefrontUniverseCard universe={univ} />
                </Link>
              ) : (
                <div className="w-full">
                  <StorefrontUniverseCard universe={univ} />
                </div>
              );
            } else if (item.kind === "PRODUCT_CARD") {
              const prod = vaults.products.find((p) => p.id === item.refId);
              if (!prod) return null;
              innerNode = interactive ? (
                <Link href={getProductHref(prod.slug)} className="block w-full">
                  <StorefrontProductBannerCard product={prod} />
                </Link>
              ) : (
                <div className="w-full">
                  <StorefrontProductBannerCard product={prod} />
                </div>
              );
            } else if (item.kind === "PACKAGE_CARD") {
              const pkg = vaults.packages.find((k) => k.id === item.refId);
              if (!pkg) return null;
              innerNode = interactive ? (
                <Link href={getPackageHref(pkg.slug)} className="block w-full">
                  <StorefrontPackageBannerCard pkg={pkg} />
                </Link>
              ) : (
                <div className="w-full">
                  <StorefrontPackageBannerCard pkg={pkg} />
                </div>
              );
            } else if (item.kind === "TEXT_BLOCK") {
              const txt = vaults.elements.textBlocks.find((tb) => tb.id === item.refId);
              if (!txt) return null;
              const fullContainerWidth =
                item.width === "full" ||
                item.width === "2/3" ||
                item.width === "1/2" ||
                item.width === "1/3";
              innerNode = (
                <div className={`flex w-full ${justifyCls}`}>
                  <ReadingTextBlockView
                    block={txt}
                    buttons={vaults.elements.buttons}
                    interactive={interactive}
                    fullContainerWidth={fullContainerWidth}
                  />
                </div>
              );
            } else if (item.kind === "BUTTON") {
              const btn = vaults.elements.buttons.find((b) => b.id === item.refId);
              if (!btn) return null;
              innerNode = (
                <div className={`flex w-full items-center ${justifyCls}`}>
                  <ActionButtonView button={btn} interactive={interactive} />
                </div>
              );
            } else if (item.kind === "DIVIDER") {
              innerNode = renderDivider(
                item.dividerConfig ?? {
                  label: "",
                  color: "#c94b99",
                  thickness: 1,
                  width: "full",
                  style: "glow",
                  align: "center",
                }
              );
            }

            if (!innerNode) return null;

            return (
              <div
                key={item.id}
                onClick={
                  onSelectItem
                    ? (e) => {
                        e.stopPropagation();
                        onSelectItem(item.id);
                      }
                    : undefined
                }
                className={`${spanCls} flex items-center ${justifyCls} ${
                  onSelectItem
                    ? `cursor-pointer rounded-2xl transition-all ${
                        isSelected
                          ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#040308]"
                          : "hover:ring-1 hover:ring-white/25"
                      }`
                    : ""
                }`}
              >
                {innerNode}
              </div>
            );
          })}
        </div>
      ) : !interactive ? (
        <div className="flex h-28 items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-black/30 text-xs text-white/45">
          Empty Block — Select items from the 5 side panels to place here
        </div>
      ) : null}
    </section>
  );
}
