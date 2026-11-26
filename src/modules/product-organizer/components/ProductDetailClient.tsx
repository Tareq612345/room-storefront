/**
 * @file src/modules/product-organizer/components/ProductDetailClient.tsx
 * @purpose Preliminary Inner Product Page (/product/?slug=...): displays gallery images, description, specs/details, price, quantity, Add to Room, and Buy Now powered by the isolated Product Data Manager.
 */

"use client";

import { useRoomBagStore } from "@modules/cart-checkout";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchResolvedProductDetail } from "../client-api";
import type { OrganizedProduct } from "../schema";

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
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) {
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);
    setActiveImageIdx(0);
    setQuantity(1);

    (async () => {
      try {
        const found = await fetchResolvedProductDetail(slug);
        if (!active) return;
        setProduct(found);
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

  const gallery = useMemo(() => {
    if (!product) return [];
    const list =
      product.galleryImages.length > 0
        ? product.galleryImages
        : product.cardImageUrl
          ? [product.cardImageUrl]
          : [];
    return list.map(resolveImgSrc).filter(Boolean);
  }, [product]);

  const activeImage = gallery[activeImageIdx] ?? gallery[0] ?? "";
  const isOutOfStock = !product || product.isVaulted || product.stock <= 0;
  const savings =
    product?.compareAtPrice && product.compareAtPrice > product.basePrice
      ? product.compareAtPrice - product.basePrice
      : 0;

  const handleAdd = () => {
    if (!product || isOutOfStock) return;
    for (let i = 0; i < quantity; i += 1) {
      addItem({
        id: product.id,
        itemType: "PRODUCT",
        title: product.name,
        subtitle: product.subtitle,
        unitPrice: product.basePrice,
        accentColor: product.accentColor,
        imageUrl: product.cardImageUrl,
      });
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

        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
          {product.universeSlug}
        </span>
      </div>

      <div
        className={
          isCinema
            ? "space-y-8"
            : "grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
        }
      >
        {/* GALLERY */}
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

              {savings > 0 ? (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200 backdrop-blur-md">
                  Save {formatEgp(savings)}
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

        {/* PRODUCT INFO, DESCRIPTION, SPECS & ACTIONS */}
        <div
          className={`space-y-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 md:p-8 ${
            isCinema ? "" : "lg:col-span-5"
          }`}
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/65">
              <Sparkles className="h-3.5 w-3.5" style={{ color: product.accentColor }} />
              <span>ROOM Drop</span>
              <span>•</span>
              <span className={isOutOfStock ? "text-red-300" : "text-emerald-300"}>
                {isOutOfStock
                  ? "Out of Stock (Vaulted)"
                  : `${product.stock} in stock`}
              </span>
            </div>

            <h1
              dir="auto"
              className="mt-2 font-serif text-2xl font-semibold text-white md:text-3xl"
            >
              {product.name}
            </h1>

            {product.subtitle ? (
              <p dir="auto" className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {product.subtitle}
              </p>
            ) : null}
          </div>

          {/* Price Block */}
          <div className="flex flex-wrap items-baseline gap-3 border-y border-white/10 py-4">
            <span className="text-3xl font-bold text-white">
              {formatEgp(product.basePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice ? (
              <span className="text-base text-[var(--color-text-muted)] line-through">
                {formatEgp(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          {/* Full Description */}
          {product.description ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                About This Drop
              </p>
              <p
                dir="auto"
                className="whitespace-pre-line text-sm leading-relaxed text-white/85"
              >
                {product.description}
              </p>
            </div>
          ) : null}

          {/* Quantity + Add to Room / Buy Now */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/65">Qty</span>
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
                  disabled={isOutOfStock || quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
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
                onClick={handleAdd}
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
                  onClick={handleAdd}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Zap className="h-4 w-4" />
                  <span>{product.buyNowLabel || "Buy Now"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Specs / Details Grid */}
          {product.showSpecsGrid && product.specs.length > 0 ? (
            <div className="space-y-3 border-t border-white/10 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                Specifications &amp; Details
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {product.specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-3.5"
                  >
                    <p dir="auto" className="text-[11px] font-semibold text-white/50">
                      {spec.label}
                    </p>
                    <p dir="auto" className="mt-1 text-xs font-semibold text-white/95">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Trust Row */}
          <div className="grid grid-cols-2 gap-2.5 border-t border-white/10 pt-4 text-[11px] text-white/70">
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-emerald-300" />
              <span>1–2 Days Cairo Express</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              <span>COD &amp; InstaPay Ready</span>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-white/60" />
              <span>Preliminary product view — customizable from Admin</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
