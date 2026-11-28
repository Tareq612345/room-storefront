/**
 * @file src/modules/product-organizer/components/ProductDetailClient.tsx
 * @purpose Inner Product Page (/product/?slug=...): keeps ROOM's luxury dark aesthetic while organizing sections in Oraimo's high-converting hierarchy: Gallery -> Title/Rating/Price/Discount -> Description Summary -> Color & Size Variants -> Qty & Dual Actions -> Trust Strip -> Full Overview & Box Contents -> Specs Table -> Interactive Reviews & Comments (#reviews).
 */

"use client";

import { trackStorefrontEvent } from "@modules/analytics";
import { useRoomBagStore } from "@modules/cart-checkout";
import { ProductReviewsSection } from "@modules/reviews";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchResolvedProductDetail } from "../client-api";
import type { OrganizedProduct, ProductVariantItem } from "../schema";

interface ProductDetailClientProps {
  slug: string;
}

function resolveImgSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return getAssetPath(raw);
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const addItem = useRoomBagStore((s) => s.addItem);

  const [ready, setReady] = useState(false);
  const [product, setProduct] = useState<OrganizedProduct | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewStats, setReviewStats] = useState<{
    average: number;
    count: number;
  }>({ average: 0, count: 0 });

  const handleSummaryChange = useCallback(
    (s: { average: number; count: number }) => setReviewStats(s),
    []
  );

  useEffect(() => {
    if (!slug) {
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);
    setActiveImageIdx(0);
    setQuantity(1);
    setSelectedVariantId(null);

    (async () => {
      try {
        const found = await fetchResolvedProductDetail(slug);
        if (!active) return;
        setProduct(found);
        if (found) {
          const activeVariants = found.variants.filter((v) => v.isActive);
          const firstInStock =
            activeVariants.find((v) => v.stock > 0) ?? activeVariants[0] ?? null;
          setSelectedVariantId(firstInStock?.id ?? null);

          void trackStorefrontEvent({
            eventType: "VIEW_PRODUCT",
            path: `/product/?slug=${encodeURIComponent(slug)}`,
            entityType: "PRODUCT",
            entityId: found.id,
            entitySlug: found.slug,
          });
        }
        setReady(true);
      } catch {
        if (!active) return;
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  const activeVariants = useMemo(
    () => (product ? product.variants.filter((v) => v.isActive) : []),
    [product]
  );

  const selectedVariant: ProductVariantItem | null = useMemo(
    () =>
      activeVariants.find((v) => v.id === selectedVariantId) ??
      activeVariants[0] ??
      null,
    [activeVariants, selectedVariantId]
  );

  const gallery = useMemo(() => {
    if (!product) return [];
    const baseList =
      product.galleryImages.length > 0
        ? product.galleryImages
        : product.cardImageUrl
          ? [product.cardImageUrl]
          : [];
    const merged =
      selectedVariant?.imageUrl && !baseList.includes(selectedVariant.imageUrl)
        ? [selectedVariant.imageUrl, ...baseList]
        : baseList;
    return merged.map(resolveImgSrc).filter(Boolean);
  }, [product, selectedVariant]);

  const activeImage = gallery[activeImageIdx] ?? gallery[0] ?? "";
  const effectivePrice =
    selectedVariant?.priceOverride !== null &&
    selectedVariant?.priceOverride !== undefined
      ? selectedVariant.priceOverride
      : product?.basePrice ?? 0;
  const effectiveStock = selectedVariant
    ? selectedVariant.stock
    : product?.stock ?? 0;
  const isOutOfStock = !product || product.isVaulted || effectiveStock <= 0;

  const savings =
    product?.compareAtPrice && product.compareAtPrice > effectivePrice
      ? product.compareAtPrice - effectivePrice
      : 0;
  const discountPct =
    product?.compareAtPrice && product.compareAtPrice > effectivePrice
      ? Math.round((savings / product.compareAtPrice) * 100)
      : 0;

  // Group unique color options and size options cleanly for Oraimo-like selection UX
  const uniqueColors = useMemo(() => {
    const map = new Map<string, ProductVariantItem>();
    for (const v of activeVariants) {
      const key = `${v.colorName}::${v.colorHex}`;
      if (v.colorName && !map.has(key)) map.set(key, v);
    }
    return Array.from(map.values());
  }, [activeVariants]);

  const uniqueSizes = useMemo(() => {
    const map = new Map<string, ProductVariantItem>();
    for (const v of activeVariants) {
      if (v.size) {
        // Prefer matching currently selected color if multiple exist
        const sameColor =
          selectedVariant &&
          v.colorName === selectedVariant.colorName &&
          v.colorHex === selectedVariant.colorHex;
        if (!map.has(v.size) || sameColor) {
          map.set(v.size, v);
        }
      }
    }
    return Array.from(map.values());
  }, [activeVariants, selectedVariant]);

  const handleSelectColor = (colorSample: ProductVariantItem) => {
    const sameSizeAndColor =
      selectedVariant?.size
        ? activeVariants.find(
            (v) =>
              v.colorName === colorSample.colorName &&
              v.colorHex === colorSample.colorHex &&
              v.size === selectedVariant.size
          )
        : undefined;
    const chosen = sameSizeAndColor ?? colorSample;
    setSelectedVariantId(chosen.id);
    setQuantity(1);
    setActiveImageIdx(0);
  };

  const handleSelectSize = (sizeSample: ProductVariantItem) => {
    const sameColorAndSize =
      selectedVariant?.colorName
        ? activeVariants.find(
            (v) =>
              v.size === sizeSample.size &&
              v.colorName === selectedVariant.colorName &&
              v.colorHex === selectedVariant.colorHex
          )
        : undefined;
    const chosen = sameColorAndSize ?? sizeSample;
    setSelectedVariantId(chosen.id);
    setQuantity(1);
  };

  const variantLabel = selectedVariant
    ? [selectedVariant.colorName, selectedVariant.size].filter(Boolean).join(" • ")
    : null;

  const handleAdd = (openAsCheckout = false) => {
    if (!product || isOutOfStock) return;
    const cartItemId = selectedVariant
      ? `${product.id}::${selectedVariant.id}`
      : product.id;

    for (let i = 0; i < quantity; i += 1) {
      addItem(
        {
          id: cartItemId,
          entityId: product.id,
          variantId: selectedVariant?.id ?? null,
          variantLabel,
          slug: product.slug,
          itemType: "PRODUCT",
          title: product.name,
          subtitle: product.subtitle,
          unitPrice: effectivePrice,
          maxStock: effectiveStock,
          accentColor: product.accentColor,
          imageUrl: selectedVariant?.imageUrl || product.cardImageUrl,
        },
        openAsCheckout
      );
    }
  };

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="h-[460px] animate-pulse rounded-3xl border border-white/10 bg-[#0b0815]/75 lg:col-span-7" />
          <div className="h-[460px] animate-pulse rounded-3xl border border-white/10 bg-[#0b0815]/75 lg:col-span-5" />
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-white/15 bg-[#0b0815] p-10">
          <h1 className="font-serif text-2xl font-semibold text-white">
            Product Unavailable
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            This product is currently paused or could not be found.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Storefront
          </Link>
        </div>
      </section>
    );
  }

  const isCinema = product.detailLayout === "cinema-hero";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 pb-20">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/35 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Storefront</span>
        </Link>

        <Link
          href={`/universe/?slug=${encodeURIComponent(product.universeSlug)}`}
          className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 hover:border-white/40"
        >
          {product.universeSlug}
        </Link>
      </div>

      {/* =====================================================================
          STEP 1 (ORAIMO ORDER): ABOVE-THE-FOLD GALLERY + STRUCTURED BUY BOX
         ===================================================================== */}
      <div
        className={
          isCinema
            ? "space-y-8"
            : "grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
        }
      >
        {/* 1. GALLERY SHOWCASE */}
        <div className={isCinema ? "space-y-4" : "space-y-4 lg:col-span-7"}>
          <div
            className={`relative flex items-center justify-center overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[#07050c] ${
              isCinema ? "h-[460px] md:h-[520px]" : "h-[380px] md:h-[480px]"
            }`}
            style={{
              background: `radial-gradient(circle at 50% 35%, ${product.accentColor}28 0%, #06040b 80%)`,
              boxShadow: "var(--shadow-card)",
            }}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className={
                  product.cardImageFit === "contain"
                    ? "max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.85)]"
                    : "h-full w-full object-cover"
                }
              />
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
              {product.badgeLabel ? (
                <span
                  className="rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{
                    backgroundColor: isOutOfStock
                      ? "var(--color-vaulted)"
                      : product.accentColor,
                  }}
                >
                  {isOutOfStock ? "Vaulted" : product.badgeLabel}
                </span>
              ) : null}

              {discountPct > 0 ? (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200 backdrop-blur-md">
                  -{discountPct}% • Save {formatEgp(savings)}
                </span>
              ) : null}
            </div>
          </div>

          {gallery.length > 1 ? (
            <div className="flex flex-wrap gap-3">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl.slice(0, 32)}_${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-20 w-24 overflow-hidden rounded-2xl border bg-[#0b0815] transition-all ${
                    activeImageIdx === idx
                      ? "border-white ring-2 ring-white/30"
                      : "border-white/15 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* 2. BUY BOX (TITLE -> RATING -> PRICE -> DESCRIPTION -> VARIANTS -> QTY & CTAs -> TRUST) */}
        <div
          className={`space-y-5 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 md:p-8 ${
            isCinema ? "" : "lg:col-span-5"
          }`}
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: product.accentColor }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{product.universeSlug} Drop</span>
              </span>

              <span
                className={`text-[11px] font-bold ${
                  isOutOfStock ? "text-red-300" : "text-emerald-300"
                }`}
              >
                {isOutOfStock ? "Vaulted (Out of Stock)" : `${effectiveStock} Left in Stock`}
              </span>
            </div>

            <h1
              dir="auto"
              className="mt-2 font-serif text-2xl font-semibold text-white md:text-3xl"
            >
              {product.name}
            </h1>

            {product.subtitle ? (
              <p dir="auto" className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                {product.subtitle}
              </p>
            ) : null}

            {/* Rating Bar (Oraimo-style top summary link) */}
            <a
              href="#reviews"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/85 hover:border-white/30"
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      reviewStats.count > 0 && i <= Math.round(reviewStats.average)
                        ? "fill-amber-400 text-amber-400"
                        : "text-amber-400/40"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">
                {reviewStats.count > 0 ? reviewStats.average : "جديد"}
              </span>
              <span className="text-white/50">
                ({reviewStats.count} تقييم)
              </span>
            </a>
          </div>

          {/* Price Block */}
          <div className="flex flex-wrap items-baseline gap-3 border-y border-white/10 py-3.5">
            <span className="text-3xl font-bold text-white">
              {formatEgp(effectivePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > effectivePrice ? (
              <span className="text-base text-[var(--color-text-muted)] line-through">
                {formatEgp(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          {/* Short Description Highlight (Oraimo order: right before Variants) */}
          {product.description ? (
            <p
              dir="auto"
              className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-white/80"
            >
              {product.description}
            </p>
          ) : null}

          {/* Color Variants Swatches */}
          {uniqueColors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/75">
                اللون:{" "}
                <span className="font-bold text-white">
                  {selectedVariant?.colorName}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((cv) => {
                  const isSelected =
                    selectedVariant?.colorName === cv.colorName &&
                    selectedVariant?.colorHex === cv.colorHex;
                  return (
                    <button
                      key={cv.id}
                      type="button"
                      onClick={() => handleSelectColor(cv)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-white bg-white/15 text-white ring-1 ring-white/40"
                          : "border-white/15 bg-black/50 text-white/70 hover:border-white/35"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: cv.colorHex || "#ffffff" }}
                      />
                      <span>{cv.colorName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Size Variants Chips */}
          {uniqueSizes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/75">
                المقاس:{" "}
                <span className="font-bold text-white">
                  {selectedVariant?.size}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((sv) => {
                  const isSelected = selectedVariant?.size === sv.size;
                  const out = sv.stock <= 0;
                  return (
                    <button
                      key={sv.id}
                      type="button"
                      onClick={() => handleSelectSize(sv)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-white bg-white text-black"
                          : out
                            ? "border-white/10 bg-black/30 text-white/35 line-through"
                            : "border-white/15 bg-black/50 text-white/85 hover:border-white/40"
                      }`}
                    >
                      {sv.size}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quantity + Claim Yours / Buy Now */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/65">الكمية</span>
              <div className="inline-flex items-center rounded-full border border-white/15 bg-black/50 p-1">
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-35"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= effectiveStock}
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-35"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => handleAdd(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  backgroundColor: isOutOfStock
                    ? "var(--color-vaulted)"
                    : product.accentColor,
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {isOutOfStock
                    ? "Vaulted"
                    : product.addToBagLabel || "Claim Yours"}
                </span>
              </button>

              {product.showBuyNowBtn ? (
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleAdd(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Zap className="h-4 w-4" />
                  <span>{product.buyNowLabel || "Buy Now"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Trust Row */}
          <div className="grid grid-cols-2 gap-2.5 border-t border-white/10 pt-4 text-[11px] text-white/70">
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-emerald-300" />
              <span>1–2 Days Express Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              <span>COD &amp; InstaPay Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          STEP 2 (ORAIMO ORDER BELOW FOLD): OVERVIEW + BOX CONTENTS + SPECS
         ===================================================================== */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {product.description ? (
          <div
            className="space-y-3 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 md:p-8 lg:col-span-7"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: product.accentColor }}
            >
              Product Overview
            </p>
            <h2 className="font-serif text-xl font-semibold text-white">
              الوصف والتفاصيل الكاملة
            </h2>
            <p
              dir="auto"
              className="whitespace-pre-line text-sm leading-relaxed text-white/85"
            >
              {product.description}
            </p>

            {product.whatsInTheBox.length > 0 ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-2.5 flex items-center gap-2 text-xs font-bold text-white">
                  <PackageCheck className="h-4 w-4 text-emerald-300" />
                  <span>محتويات العبوة (What&apos;s Included)</span>
                </p>
                <ul className="space-y-1.5 text-xs text-white/75">
                  {product.whatsInTheBox.map((line, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {product.showSpecsGrid && product.specs.length > 0 ? (
          <div
            className={`space-y-4 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 md:p-8 ${
              product.description ? "lg:col-span-5" : "lg:col-span-12"
            }`}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: product.accentColor }}
            >
              Product Parameters
            </p>
            <h2 className="font-serif text-xl font-semibold text-white">
              المواصفات الفنية
            </h2>
            <div className="space-y-2.5">
              {product.specs.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                >
                  <p dir="auto" className="text-xs font-semibold text-white/55">
                    {spec.label}
                  </p>
                  <p dir="auto" className="text-xs font-semibold text-white/95 text-end">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* =====================================================================
          STEP 3 (ORAIMO ORDER): CUSTOMER REVIEWS & COMMENTS SYSTEM
         ===================================================================== */}
      <ProductReviewsSection
        productId={product.id}
        productSlug={product.slug}
        accentColor={product.accentColor}
        onSummaryChange={handleSummaryChange}
      />
    </section>
  );
}
