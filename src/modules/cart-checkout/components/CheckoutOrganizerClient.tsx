/**
 * @file src/modules/cart-checkout/components/CheckoutOrganizerClient.tsx
 * @purpose Dedicated Isolated Cart & Checkout Studio (/admin/checkout/): the ONLY place allowed to configure payment methods, promo codes, checkout rules, and drawer labels stored in __isolated_cart_checkout_v1__.
 */

"use client";

import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Database,
  ExternalLink,
  Languages,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchCheckoutOrganizerSnapshot,
  saveIsolatedCheckoutRegistry,
} from "../client-api";
import { buildInitialCheckoutRegistry } from "../helpers";
import type { CheckoutRegistry, PromoCodeItem } from "../schema";

type Lang = "ar" | "en";

export function CheckoutOrganizerClient() {
  const [lang, setLang] = useState<Lang>("ar");
  const [storeId, setStoreId] = useState("store_room_egypt");
  const [registry, setRegistry] = useState<CheckoutRegistry>(() =>
    buildInitialCheckoutRegistry()
  );
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeletePromoId, setConfirmDeletePromoId] = useState<string | null>(null);

  // Add Promo form
  const [newCode, setNewCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [newValue, setNewValue] = useState(10);
  const [newMinSubtotal, setNewMinSubtotal] = useState(300);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await fetchCheckoutOrganizerSnapshot();
        if (!active) return;
        setStoreId(snap.storeId);
        setRegistry(snap.registry);
      } catch {
        // Keep initial defaults
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await saveIsolatedCheckoutRegistry({ storeId, registry });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to save checkout config"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!clean) return;
    if (registry.promoCodes.some((p) => p.code.toUpperCase() === clean)) {
      setErrorMsg(lang === "ar" ? "الكود موجود بالفعل" : "Promo code already exists");
      return;
    }

    const created: PromoCodeItem = {
      id: generateClientId("promo"),
      code: clean,
      discountType: newDiscountType,
      value: Math.max(0, newValue),
      minOrderSubtotal: Math.max(0, newMinSubtotal),
      maxUses: null,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
    };

    setRegistry((prev) => ({
      ...prev,
      promoCodes: [created, ...prev.promoCodes],
    }));
    setNewCode("");
    setErrorMsg(null);
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#040308] text-white"
    >
      {/* Top Studio Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "لوحة الإدارة" : "Admin"}</span>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/10">
              <CreditCard className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="font-serif text-base font-semibold text-white">
                {lang === "ar"
                  ? "استوديو السلة والدفع المعزول"
                  : "Isolated Cart & Checkout Studio"}
              </h1>
              <p className="text-[11px] text-white/55">
                {lang === "ar"
                  ? "التحكم الحصري في طرق الدفع، أكواد الخصم، وقواعد إتمام الطلب (__isolated_cart_checkout_v1__)"
                  : "Exclusive control over Payment Methods, Promo Codes, Rules & Copy"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/schema/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              <span>{lang === "ar" ? "الخريطة" : "Schema"}</span>
            </Link>

            <button
              type="button"
              onClick={() => setLang((p) => (p === "ar" ? "en" : "ar"))}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/80"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "EN" : "ع"}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black hover:opacity-90 disabled:opacity-60"
            >
              {savedToast ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>
                {saving
                  ? lang === "ar"
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : savedToast
                    ? lang === "ar"
                      ? "تم الحفظ!"
                      : "Saved!"
                    : lang === "ar"
                      ? "حفظ في Supabase"
                      : "Save to Supabase"}
              </span>
            </button>

            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "المتجر" : "Storefront"}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 p-5 md:p-8">
        {errorMsg ? (
          <div className="rounded-xl border border-red-400/35 bg-red-500/15 px-4 py-2.5 text-xs text-red-200">
            {errorMsg}
          </div>
        ) : null}

        {/* 1. PAYMENT METHODS */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="font-serif text-lg font-semibold">
              {lang === "ar"
                ? "وسائل الدفع المتاحة للعملاء (مرتبطة ببوابات الدفع المستقبلية)"
                : "Customer Payment Methods"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {registry.paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/45 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-200">
                      {pm.code}
                    </span>
                    <span className="text-xs text-white/50" dir="ltr">
                      provider: {pm.futureGatewayProvider}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRegistry((prev) => ({
                        ...prev,
                        paymentMethods: prev.paymentMethods.map((x) =>
                          x.id === pm.id ? { ...x, isEnabled: !x.isEnabled } : x
                        ),
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      pm.isEnabled
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-white/45"
                    }`}
                  >
                    {pm.isEnabled
                      ? lang === "ar"
                        ? "مفعّل"
                        : "Enabled"
                      : lang === "ar"
                        ? "معطّل"
                        : "Disabled"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    value={pm.labelAr}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        paymentMethods: prev.paymentMethods.map((x) =>
                          x.id === pm.id ? { ...x, labelAr: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="الاسم بالعربية"
                    className="h-9 rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                  />
                  <input
                    dir="ltr"
                    value={pm.accountOrHandle}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        paymentMethods: prev.paymentMethods.map((x) =>
                          x.id === pm.id
                            ? { ...x, accountOrHandle: e.target.value }
                            : x
                        ),
                      }))
                    }
                    placeholder="Account / Handle (e.g. room@instapay)"
                    className="h-9 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs"
                  />
                </div>

                <input
                  value={pm.descriptionAr}
                  onChange={(e) =>
                    setRegistry((prev) => ({
                      ...prev,
                      paymentMethods: prev.paymentMethods.map((x) =>
                        x.id === pm.id ? { ...x, descriptionAr: e.target.value } : x
                      ),
                    }))
                  }
                  placeholder="وصف وتوجيهات الدفع للعميل"
                  className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                />

                <div className="flex flex-wrap items-center gap-4 text-xs text-white/75">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pm.requiresReference}
                      onChange={(e) =>
                        setRegistry((prev) => ({
                          ...prev,
                          paymentMethods: prev.paymentMethods.map((x) =>
                            x.id === pm.id
                              ? { ...x, requiresReference: e.target.checked }
                              : x
                          ),
                        }))
                      }
                    />
                    <span>
                      {lang === "ar"
                        ? "يتطلب رقم مرجع/تحويل"
                        : "Requires transfer ref"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span>{lang === "ar" ? "رسوم إضافية:" : "Extra fee:"}</span>
                    <input
                      type="number"
                      min={0}
                      value={pm.extraFee}
                      onChange={(e) =>
                        setRegistry((prev) => ({
                          ...prev,
                          paymentMethods: prev.paymentMethods.map((x) =>
                            x.id === pm.id
                              ? { ...x, extraFee: Math.max(0, Number(e.target.value)) }
                              : x
                          ),
                        }))
                      }
                      className="h-8 w-20 rounded-lg border border-white/15 bg-black/60 px-2 text-xs"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. PROMO CODES */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-300" />
            <h2 className="font-serif text-lg font-semibold">
              {lang === "ar" ? "أكواد الخصم (Promo Codes)" : "Promo Codes"}
            </h2>
          </div>

          <form
            onSubmit={handleAddPromo}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-black/40 p-4"
          >
            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                {lang === "ar" ? "الكود" : "Code"}
              </label>
              <input
                dir="ltr"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="WELCOME15"
                className="h-9 w-36 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                {lang === "ar" ? "النوع" : "Type"}
              </label>
              <select
                value={newDiscountType}
                onChange={(e) =>
                  setNewDiscountType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")
                }
                className="h-9 rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
              >
                <option value="PERCENTAGE">%</option>
                <option value="FIXED_AMOUNT">EGP</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                {lang === "ar" ? "القيمة" : "Value"}
              </label>
              <input
                type="number"
                min={1}
                value={newValue}
                onChange={(e) => setNewValue(Number(e.target.value))}
                className="h-9 w-24 rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                {lang === "ar" ? "حد أدنى للطلب" : "Min Subtotal"}
              </label>
              <input
                type="number"
                min={0}
                value={newMinSubtotal}
                onChange={(e) => setNewMinSubtotal(Number(e.target.value))}
                className="h-9 w-28 rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "إضافة كود" : "Add Promo"}</span>
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {registry.promoCodes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/45 p-3.5"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-amber-300" dir="ltr">
                    {p.code}
                  </p>
                  <p className="text-[11px] text-white/65">
                    {p.discountType === "PERCENTAGE"
                      ? `${p.value}% OFF`
                      : `${p.value} EGP OFF`}{" "}
                    • Min {p.minOrderSubtotal} EGP • Used {p.usedCount}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setRegistry((prev) => ({
                        ...prev,
                        promoCodes: prev.promoCodes.map((x) =>
                          x.id === p.id ? { ...x, isActive: !x.isActive } : x
                        ),
                      }))
                    }
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      p.isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-white/45"
                    }`}
                  >
                    {p.isActive ? "ON" : "OFF"}
                  </button>
                  {confirmDeletePromoId === p.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRegistry((prev) => ({
                          ...prev,
                          promoCodes: prev.promoCodes.filter((x) => x.id !== p.id),
                        }));
                        setConfirmDeletePromoId(null);
                      }}
                      className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white"
                    >
                      {lang === "ar" ? "تأكيد؟" : "Confirm?"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePromoId(p.id)}
                      className="rounded-full border border-white/15 p-1.5 text-white/55 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. RULES & DYNAMIC COPY */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-cyan-300" />
              <h2 className="font-serif text-lg font-semibold">
                {lang === "ar" ? "قواعد السلة وإتمام الطلب" : "Checkout Rules"}
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                {
                  key: "autoDecrementStock" as const,
                  ar: "خصم مخزون المنتجات تلقائياً عند إتمام الطلب",
                  en: "Auto-decrement isolated product stock on purchase",
                },
                {
                  key: "enablePromoCodes" as const,
                  ar: "تفعيل خانة أكواد الخصم في السلة",
                  en: "Enable Promo Code input in bag drawer",
                },
                {
                  key: "enableNotes" as const,
                  ar: "السماح بإضافة ملاحظات التوصيل للمندوب",
                  en: "Allow delivery notes at checkout",
                },
                {
                  key: "requireEmail" as const,
                  ar: "إلزام العميل بإدخال البريد الإلكتروني",
                  en: "Require customer email address",
                },
              ].map((rule) => (
                <label
                  key={rule.key}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                >
                  <span>{lang === "ar" ? rule.ar : rule.en}</span>
                  <input
                    type="checkbox"
                    checked={registry.rules[rule.key]}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        rules: { ...prev.rules, [rule.key]: e.target.checked },
                      }))
                    }
                  />
                </label>
              ))}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="block">
                  <span className="mb-1 block text-white/65">
                    {lang === "ar" ? "أقصى كمية للقطعة" : "Max Qty Per Line"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={registry.rules.maxQtyPerItem}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          maxQtyPerItem: Math.max(1, Number(e.target.value)),
                        },
                      }))
                    }
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-white/65">
                    {lang === "ar" ? "المدينة الافتراضية" : "Default City Fallback"}
                  </span>
                  <input
                    value={registry.rules.defaultCityFallback}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          defaultCityFallback: e.target.value,
                        },
                      }))
                    }
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
            <h2 className="font-serif text-lg font-semibold">
              {lang === "ar" ? "نصوص ورسائل السلة (بدون أي نص ثابت)" : "Dynamic Bag Copy"}
            </h2>
            <div className="space-y-2.5 text-xs">
              {[
                { key: "bagTitle" as const, label: "عنوان زر السلة (Bag Pill)" },
                { key: "bagEyebrow" as const, label: "الوسم العلوي للسلة" },
                { key: "checkoutCta" as const, label: "نص زر إتمام الطلب" },
                { key: "confirmOrderCta" as const, label: "نص زر تأكيد الطلب النهائي" },
                { key: "emptyTitle" as const, label: "عنوان السلة الفارغة" },
                { key: "whatsappOrderNote" as const, label: "مقدمة رسالة تأكيد واتساب" },
              ].map((fld) => (
                <label key={fld.key} className="block">
                  <span className="mb-1 block text-white/65">{fld.label}</span>
                  <input
                    value={registry.labels[fld.key]}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        labels: { ...prev.labels, [fld.key]: e.target.value },
                      }))
                    }
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
