/**
 * @file src/modules/cart-checkout/components/MyRoomTriggerAndDrawer.tsx
 * @purpose Complete isolated My Room Bag & Checkout Drawer: synced dynamically with shipping_zones and __isolated_cart_checkout_v1__ (Payment methods, Promo codes, Rules, Dynamic copy), submitting real orders + order_items + stock decrements + telemetry.
 */

"use client";

import { trackStorefrontEvent } from "@modules/analytics";
import { sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCheckoutOrganizerSnapshot,
  getCachedCheckoutRegistry,
  submitCheckoutOrder,
} from "../client-api";
import { buildInitialCheckoutRegistry, evaluatePromoDiscount } from "../helpers";
import type {
  CheckoutRegistry,
  CompletedOrderReceipt,
  PaymentMethodCode,
} from "../schema";
import { useRoomBagStore } from "../store";

interface ShippingZoneOption {
  id: string;
  name: string;
  city: string;
  fee: number;
  freeThreshold: number;
  estimatedDays: string;
  active: boolean;
}

export function MyRoomTriggerAndDrawer() {
  const pathname = usePathname();
  const {
    items,
    isOpen,
    viewMode,
    openBag,
    closeBag,
    setViewMode,
    updateQuantity,
    removeItem,
    clearBag,
  } = useRoomBagStore();

  const [mounted, setMounted] = useState(false);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [checkoutCfg, setCheckoutCfg] = useState<CheckoutRegistry>(() =>
    getCachedCheckoutRegistry() ?? buildInitialCheckoutRegistry()
  );

  // Promo state
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [promoFeedback, setPromoFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Checkout form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [city, setCity] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>("COD");
  const [paymentRef, setPaymentRef] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CompletedOrderReceipt | null>(null);

  useEffect(() => {
    setMounted(true);
    let active = true;
    (async () => {
      try {
        const [rows, cfgSnap] = await Promise.all([
          sbSelect<{
            id: string;
            name: string;
            city: string;
            fee: number | string;
            freeShippingThreshold: number | string | null;
            estimatedDays: string;
            isActive: boolean;
          }>(
            "shipping_zones",
            "select=id,name,city,fee,freeShippingThreshold,estimatedDays,isActive&isActive=eq.true&order=sortOrder.asc"
          ),
          fetchCheckoutOrganizerSnapshot(),
        ]);
        if (!active) return;

        setCheckoutCfg(cfgSnap.registry);
        const enabledMethods = cfgSnap.registry.paymentMethods
          .filter((m) => m.isEnabled)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (enabledMethods.length > 0) {
          setPaymentMethod((prev) =>
            enabledMethods.some((m) => m.code === prev)
              ? prev
              : enabledMethods[0]!.code
          );
        }

        if (rows.length > 0) {
          const mapped: ShippingZoneOption[] = rows.map((r) => ({
            id: r.id,
            name: r.name,
            city: r.city || cfgSnap.registry.rules.defaultCityFallback,
            fee: Number(r.fee),
            freeThreshold: r.freeShippingThreshold
              ? Number(r.freeShippingThreshold)
              : 2500,
            estimatedDays: r.estimatedDays || "1-2 Days",
            active: r.isActive,
          }));
          setZones(mapped);
          setSelectedZoneId((prev) =>
            mapped.some((z) => z.id === prev) ? prev : mapped[0]?.id ?? ""
          );
        }
      } catch {
        // Keep cached checkout config if network fails temporarily
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  const activeZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? zones[0] ?? null,
    [zones, selectedZoneId]
  );

  useEffect(() => {
    if (activeZone?.city) {
      setCity(activeZone.city);
    } else if (checkoutCfg.rules.defaultCityFallback) {
      setCity(checkoutCfg.rules.defaultCityFallback);
    }
  }, [activeZone, checkoutCfg.rules.defaultCityFallback]);

  const enabledPaymentMethods = useMemo(
    () =>
      checkoutCfg.paymentMethods
        .filter((m) => m.isEnabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [checkoutCfg.paymentMethods]
  );

  const selectedPmConfig = useMemo(
    () =>
      enabledPaymentMethods.find((m) => m.code === paymentMethod) ??
      enabledPaymentMethods[0] ??
      null,
    [enabledPaymentMethods, paymentMethod]
  );

  if (pathname?.includes("/schema") || pathname?.includes("/admin")) {
    return null;
  }

  const totalCount = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const subtotal = mounted
    ? items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    : 0;

  const appliedPromoObj = appliedPromoCode
    ? checkoutCfg.promoCodes.find(
        (p) => p.code.toUpperCase() === appliedPromoCode.toUpperCase()
      )
    : undefined;
  const promoEval = appliedPromoObj
    ? evaluatePromoDiscount(appliedPromoObj, subtotal)
    : { valid: false, discountAmount: 0 };
  const discountAmount = promoEval.valid ? promoEval.discountAmount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const shippingFee =
    subtotal === 0 || !activeZone
      ? 0
      : discountedSubtotal >= activeZone.freeThreshold
        ? 0
        : activeZone.fee;

  const paymentExtraFee =
    subtotal === 0 ? 0 : selectedPmConfig?.extraFee ?? 0;
  const total = discountedSubtotal + shippingFee + paymentExtraFee;

  const remainingForFreeShipping =
    activeZone && discountedSubtotal < activeZone.freeThreshold
      ? Math.max(0, activeZone.freeThreshold - discountedSubtotal)
      : 0;

  const handleApplyPromo = () => {
    const clean = promoInput.trim().toUpperCase();
    if (!clean) {
      setAppliedPromoCode("");
      setPromoFeedback(null);
      return;
    }
    const found = checkoutCfg.promoCodes.find(
      (p) => p.code.toUpperCase() === clean
    );
    const res = evaluatePromoDiscount(found, subtotal);
    if (!res.valid) {
      setAppliedPromoCode("");
      setPromoFeedback({ ok: false, msg: res.errorMsg ?? "كود الخصم غير صالح" });
      return;
    }
    setAppliedPromoCode(clean);
    setPromoFeedback({
      ok: true,
      msg: `تم تطبيق خصم ${formatEgp(res.discountAmount)}`,
    });
    void trackStorefrontEvent({
      eventType: "APPLY_PROMO",
      entityType: "PROMO",
      entitySlug: clean,
      revenue: res.discountAmount,
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeZone) {
      setSubmitError("يرجى اختيار منطقة شحن أولاً.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const completed = await submitCheckoutOrder({
        items,
        shippingZoneId: activeZone.id,
        customerName,
        customerPhone,
        customerWhatsapp: sameWhatsapp ? customerPhone : customerWhatsapp,
        customerEmail: customerEmail || undefined,
        city,
        shippingAddress,
        notes: checkoutCfg.rules.enableNotes ? notes : undefined,
        paymentMethod,
        paymentReferenceInput: paymentRef,
        promoCodeInput: appliedPromoCode || undefined,
      });

      setReceipt(completed);
      clearBag();
      setAppliedPromoCode("");
      setPromoInput("");
      setPromoFeedback(null);
      setPaymentRef("");
      setViewMode("success");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "تعذر إتمام الطلب، يرجى المحاولة مرة أخرى."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Sleek Floating "MY ROOM" Pill Button */}
      <button
        type="button"
        onClick={openBag}
        className="fixed right-4 top-4 z-50 flex items-center gap-2.5 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_28px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/45 hover:bg-black/90 md:right-6 md:top-6"
      >
        <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)] transition-colors duration-300" />
        <span>{checkoutCfg.labels.bagTitle}</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[11px] font-bold text-white">
          {totalCount}
        </span>
      </button>

      {/* Slide-Over "MY ROOM" & Checkout Drawer */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={closeBag}
            aria-hidden="true"
          />

          <aside
            dir="auto"
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--color-border-subtle)] bg-[#080510] text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
              <div className="flex items-center gap-2.5">
                {viewMode === "checkout" ? (
                  <button
                    type="button"
                    onClick={() => setViewMode("bag")}
                    className="rounded-full border border-white/15 p-1.5 text-white/75 hover:border-white/40 hover:text-white"
                    title="Back to Bag"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                    {viewMode === "success"
                      ? "Order Confirmed"
                      : viewMode === "checkout"
                        ? "Secure Checkout"
                        : checkoutCfg.labels.bagEyebrow}
                  </p>
                  <h2 className="mt-0.5 font-serif text-lg font-semibold tracking-wider text-white">
                    {viewMode === "success"
                      ? `#${receipt?.orderNumber ?? ""}`
                      : viewMode === "checkout"
                        ? "بيانات التوصيل والدفع"
                        : `${checkoutCfg.labels.bagTitle} (${totalCount})`}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeBag}
                className="rounded-full border border-white/15 p-2 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                aria-label="Close My Room"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* BODY */}
            {viewMode === "success" && receipt ? (
              <div className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5 text-center">
                    <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-400" />
                    <h3 className="mt-3 font-serif text-xl font-semibold text-white">
                      تم استلام طلبك بنجاح!
                    </h3>
                    <p className="mt-1 font-mono text-sm font-bold text-emerald-300">
                      #{receipt.orderNumber}
                    </p>
                    <p className="mt-2 text-xs text-white/70">
                      تم حفظ الطلب في قاعدة البيانات وتجهيزه للمراجعة والتوصيل.
                    </p>
                  </div>

                  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#0d0919] p-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/55">العميل:</span>
                      <span className="font-semibold text-white">{receipt.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/55">الهاتف:</span>
                      <span className="font-mono text-white" dir="ltr">
                        {receipt.customerPhone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/55">المنطقة:</span>
                      <span className="text-white">
                        {receipt.zoneName} ({receipt.city})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/55">طريقة الدفع:</span>
                      <span className="font-semibold text-cyan-200">
                        {receipt.paymentMethod}
                      </span>
                    </div>
                    {receipt.paymentReference ? (
                      <div className="flex justify-between">
                        <span className="text-white/55">المرجع:</span>
                        <span className="font-mono text-white/90" dir="ltr">
                          {receipt.paymentReference}
                        </span>
                      </div>
                    ) : null}
                    <div className="border-t border-white/10 pt-2.5 flex justify-between text-sm font-bold text-white">
                      <span>الإجمالي النهائي:</span>
                      <span>{formatEgp(receipt.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <a
                    href={receipt.merchantWhatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-xs font-bold text-black transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>إرسال تفاصيل الطلب على واتساب المتجر</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("bag");
                      closeBag();
                    }}
                    className="w-full rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    متابعة التسوق
                  </button>
                </div>
              </div>
            ) : viewMode === "checkout" && items.length > 0 ? (
              <form
                onSubmit={handlePlaceOrder}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  {/* Customer Info */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-white/85">
                      <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                      <span>بيانات المستلم والعنوان</span>
                    </p>

                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="الاسم بالكامل *"
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
                    />

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        required
                        dir="ltr"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="01xxxxxxxxx *"
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
                      />
                      <input
                        dir="ltr"
                        type="email"
                        required={checkoutCfg.rules.requireEmail}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder={
                          checkoutCfg.rules.requireEmail
                            ? "Email *"
                            : "Email (اختياري)"
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-[11px] text-white/70">
                      <input
                        type="checkbox"
                        checked={sameWhatsapp}
                        onChange={(e) => setSameWhatsapp(e.target.checked)}
                        className="rounded border-white/25"
                      />
                      <span>رقم الواتساب هو نفس رقم الهاتف</span>
                    </label>

                    {!sameWhatsapp ? (
                      <input
                        dir="ltr"
                        type="tel"
                        value={customerWhatsapp}
                        onChange={(e) => setCustomerWhatsapp(e.target.value)}
                        placeholder="رقم واتساب للتواصل"
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
                      />
                    ) : null}

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <select
                        value={activeZone?.id ?? ""}
                        onChange={(e) => setSelectedZoneId(e.target.value)}
                        required
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/70 px-3 text-xs text-white"
                      >
                        {zones.length === 0 ? (
                          <option value="">جاري تحميل المناطق...</option>
                        ) : (
                          zones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} ({formatEgp(z.fee)})
                            </option>
                          ))
                        )}
                      </select>

                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="المدينة / المحافظة"
                        required
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white"
                      />
                    </div>

                    <textarea
                      required
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="العنوان بالتفصيل (الشارع، رقم العمارة، الدور، علامة مميزة) *"
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder:text-white/40"
                    />

                    {checkoutCfg.rules.enableNotes ? (
                      <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ملاحظات إضافية للمندوب (اختياري)"
                        className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
                      />
                    ) : null}
                  </div>

                  {/* Dynamic DB-driven Payment Methods */}
                  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-white/85">
                      <CreditCard className="h-3.5 w-3.5 text-fuchsia-300" />
                      <span>طريقة الدفع</span>
                    </p>

                    <div className="space-y-2">
                      {enabledPaymentMethods.map((pm) => {
                        const selected = pm.code === paymentMethod;
                        return (
                          <label
                            key={pm.id}
                            className={`block cursor-pointer rounded-xl border p-3 transition-all ${
                              selected
                                ? "border-cyan-400/60 bg-cyan-500/10"
                                : "border-white/10 bg-black/40 hover:border-white/25"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  checked={selected}
                                  onChange={() => setPaymentMethod(pm.code)}
                                />
                                <span className="text-xs font-bold text-white">
                                  {pm.labelAr || pm.labelEn}
                                </span>
                              </div>
                              {pm.extraFee > 0 ? (
                                <span className="text-[10px] font-semibold text-amber-300">
                                  +{formatEgp(pm.extraFee)}
                                </span>
                              ) : null}
                            </div>
                            {pm.descriptionAr ? (
                              <p className="mt-1 text-[11px] text-white/60">
                                {pm.descriptionAr}
                              </p>
                            ) : null}
                            {selected && pm.accountOrHandle ? (
                              <p
                                dir="ltr"
                                className="mt-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[11px] text-cyan-200"
                              >
                                Target: {pm.accountOrHandle}
                              </p>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>

                    {selectedPmConfig?.requiresReference ? (
                      <input
                        required
                        dir="ltr"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="أدخل رقم المرجع / التحويل للتأكيد *"
                        className="h-10 w-full rounded-xl border border-cyan-400/40 bg-black/70 px-3 font-mono text-xs text-white placeholder:text-white/40"
                      />
                    ) : null}
                  </div>

                  {submitError ? (
                    <div className="rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2.5 text-xs text-red-200">
                      {submitError}
                    </div>
                  ) : null}
                </div>

                {/* Sticky Checkout Footer */}
                <div className="space-y-2.5 border-t border-[var(--color-border-subtle)] bg-black/70 p-5">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-white/70">
                      <span>المنتجات</span>
                      <span>{formatEgp(subtotal)}</span>
                    </div>
                    {discountAmount > 0 ? (
                      <div className="flex justify-between text-emerald-300">
                        <span>خصم ({appliedPromoCode})</span>
                        <span>-{formatEgp(discountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-white/70">
                      <span>الشحن ({activeZone?.estimatedDays ?? "Express"})</span>
                      <span>{shippingFee === 0 ? "مجاني" : formatEgp(shippingFee)}</span>
                    </div>
                    {paymentExtraFee > 0 ? (
                      <div className="flex justify-between text-amber-300">
                        <span>رسوم الدفع</span>
                        <span>{formatEgp(paymentExtraFee)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-white">
                      <span>الإجمالي</span>
                      <span>{formatEgp(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || zones.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>جاري تسجيل الطلب...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>{checkoutCfg.labels.confirmOrderCta}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* BAG VIEW */
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
                        <Sparkles className="h-6 w-6 text-white/60" />
                      </div>
                      <p className="mt-4 font-serif text-lg text-white">
                        {checkoutCfg.labels.emptyTitle}
                      </p>
                      <p className="mt-1.5 max-w-xs text-xs text-[var(--color-text-secondary)]">
                        {checkoutCfg.labels.emptySubtitle}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {items.map((item) => {
                        const maxCap = Math.min(
                          checkoutCfg.rules.maxQtyPerItem,
                          typeof item.maxStock === "number" && item.maxStock > 0
                            ? item.maxStock
                            : checkoutCfg.rules.maxQtyPerItem
                        );
                        return (
                          <li
                            key={item.id}
                            className="flex gap-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-3.5"
                          >
                            {item.imageUrl ? (
                              <img
                                src={
                                  item.imageUrl.startsWith("data:") ||
                                  item.imageUrl.startsWith("http")
                                    ? item.imageUrl
                                    : getAssetPath(item.imageUrl)
                                }
                                alt={item.title}
                                className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                              />
                            ) : (
                              <div
                                className="h-16 w-16 shrink-0 rounded-xl border border-white/10"
                                style={{
                                  background: `radial-gradient(circle, ${item.accentColor}55 0%, #090612 100%)`,
                                }}
                              />
                            )}

                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-semibold text-white">
                                    {item.title}
                                  </h3>
                                  {item.variantLabel ? (
                                    <p className="mt-0.5 text-[11px] font-medium text-cyan-200">
                                      {item.variantLabel}
                                    </p>
                                  ) : null}
                                  <p className="mt-0.5 text-xs font-bold text-white/90">
                                    {formatEgp(item.unitPrice)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-white/40 transition-colors hover:text-red-400"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity - 1)
                                    }
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-white/40"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-semibold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={item.quantity >= maxCap}
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-white/40 disabled:opacity-35"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="text-[11px] font-semibold text-white/65">
                                  {formatEgp(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {items.length > 0 ? (
                  <div className="space-y-3 border-t border-[var(--color-border-subtle)] bg-black/50 p-6">
                    {/* Free Shipping Indicator */}
                    {activeZone ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-white/80">
                          <Truck className="h-3.5 w-3.5 text-emerald-300" />
                          <span>
                            {remainingForFreeShipping === 0
                              ? "مبروك! طلبك مؤهل للشحن المجاني"
                              : `أضف بقيمة ${formatEgp(remainingForFreeShipping)} للحصول على شحن مجاني`}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Zone Picker */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                        منطقة الشحن
                      </label>
                      <select
                        value={activeZone?.id ?? ""}
                        onChange={(e) => setSelectedZoneId(e.target.value)}
                        className="h-9 w-full rounded-xl border border-white/15 bg-black/70 px-3 text-xs text-white"
                      >
                        {zones.length === 0 ? (
                          <option value="">لا توجد مناطق شحن مفعلة</option>
                        ) : (
                          zones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} — {formatEgp(z.fee)}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Promo Code Input */}
                    {checkoutCfg.rules.enablePromoCodes ? (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                            <input
                              dir="ltr"
                              value={promoInput}
                              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                              placeholder="كود الخصم (مثال: ROOM10)"
                              className="h-9 w-full rounded-xl border border-white/15 bg-black/70 pl-8 pr-3 font-mono text-xs text-white placeholder:text-white/40"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            className="h-9 rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white hover:bg-white/20"
                          >
                            تطبيق
                          </button>
                        </div>
                        {promoFeedback ? (
                          <p
                            className={`text-[11px] ${
                              promoFeedback.ok ? "text-emerald-300" : "text-red-300"
                            }`}
                          >
                            {promoFeedback.msg}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Summary */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-[var(--color-text-secondary)]">
                        <span>المجموع الفرعي</span>
                        <span>{formatEgp(subtotal)}</span>
                      </div>
                      {discountAmount > 0 ? (
                        <div className="flex justify-between text-emerald-300">
                          <span>الخصم ({appliedPromoCode})</span>
                          <span>-{formatEgp(discountAmount)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-[var(--color-text-secondary)]">
                        <span>الشحن</span>
                        <span>
                          {!activeZone
                            ? "—"
                            : shippingFee === 0
                              ? "مجاني"
                              : formatEgp(shippingFee)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-sm font-bold text-white">
                        <span>الإجمالي</span>
                        <span>{formatEgp(total)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={clearBag}
                        className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/75 hover:border-white/35 hover:text-white"
                      >
                        تفريغ
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("checkout")}
                        className="flex-1 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-foreground)] transition-opacity hover:opacity-90"
                      >
                        {checkoutCfg.labels.checkoutCta}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}
