/**
 * @file src/modules/cart-checkout/helpers.ts
 * @purpose Isolated Cart & Checkout constants, promo evaluation helpers, and initial DB seed builder.
 */

import type { CheckoutRegistry, PromoCodeItem } from "./schema";

export const CHECKOUT_PAGE_KEY = "__isolated_cart_checkout_v1__";
export const CHECKOUT_RECORD_ID = "ckorg_isolated_registry_v1";
export const CHECKOUT_LOCAL_STORAGE_KEY = "room_isolated_checkout_v1";

export function buildInitialCheckoutRegistry(): CheckoutRegistry {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    rules: {
      requireEmail: false,
      enableNotes: true,
      enablePromoCodes: true,
      autoDecrementStock: true,
      maxQtyPerItem: 10,
      defaultCityFallback: "Cairo",
    },
    labels: {
      bagEyebrow: "Your Loadout",
      bagTitle: "MY ROOM",
      emptyTitle: "سلتك فارغة حالياً",
      emptySubtitle: "تصفح اليونيفيرسز واختر المنتجات أو الكوليكشنز المناسبة لغرفتك.",
      checkoutCta: "إتمام الطلب • Checkout",
      confirmOrderCta: "تأكيد وإرسال الطلب",
      whatsappOrderNote: "طلب جديد من المتجر — تفاصيل الطلب بالأسفل",
    },
    paymentMethods: [
      {
        id: "pm_cod",
        code: "COD",
        labelAr: "الدفع عند الاستلام (COD)",
        labelEn: "Cash on Delivery (COD)",
        descriptionAr: "ادفع نقداً للمندوب عند استلام الطلب ومعاينته.",
        descriptionEn: "Pay cash upon courier delivery.",
        accountOrHandle: "",
        extraFee: 0,
        requiresReference: false,
        futureGatewayProvider: "cod-courier",
        isEnabled: true,
        sortOrder: 1,
      },
      {
        id: "pm_instapay",
        code: "INSTAPAY",
        labelAr: "إنستاباي (InstaPay)",
        labelEn: "InstaPay Transfer",
        descriptionAr: "حوّل المبلغ وأدخل رقم المرجع أو اسم حسابك للتأكيد السريع.",
        descriptionEn: "Transfer via InstaPay and enter your reference for quick verification.",
        accountOrHandle: "room@instapay",
        extraFee: 0,
        requiresReference: true,
        futureGatewayProvider: "manual-instapay-or-paymob",
        isEnabled: true,
        sortOrder: 2,
      },
      {
        id: "pm_wallet",
        code: "WALLET",
        labelAr: "محفظة إلكترونية (Vodafone / Orange / Etisalat Cash)",
        labelEn: "Mobile Wallet (Vodafone Cash / Wallets)",
        descriptionAr: "تحويل فوري على رقم المحفظة مع إدخال رقم التحويل أو آخر 4 أرقام.",
        descriptionEn: "Pay using Egyptian mobile wallets and enter transfer reference.",
        accountOrHandle: "01000000000",
        extraFee: 0,
        requiresReference: true,
        futureGatewayProvider: "paymob-wallet",
        isEnabled: true,
        sortOrder: 3,
      },
      {
        id: "pm_card",
        code: "ONLINE_CARD",
        labelAr: "بطاقة بنكية أونلاين (قريباً عبر بوابة الدفع)",
        labelEn: "Online Card (Visa / Mastercard / Meeza)",
        descriptionAr: "تجهيز نية دفع أونلاين للتفعيل المباشر مع Paymob / Kashier.",
        descriptionEn: "Creates a pending online payment intent ready for gateway redirect.",
        accountOrHandle: "",
        extraFee: 0,
        requiresReference: false,
        futureGatewayProvider: "paymob-or-kashier",
        isEnabled: false,
        sortOrder: 4,
      },
    ],
    promoCodes: [
      {
        id: "promo_room10",
        code: "ROOM10",
        discountType: "PERCENTAGE",
        value: 10,
        minOrderSubtotal: 300,
        maxUses: 500,
        usedCount: 0,
        expiresAt: null,
        isActive: true,
      },
    ],
  };
}

export function evaluatePromoDiscount(
  promo: PromoCodeItem | undefined,
  subtotal: number
): { valid: boolean; discountAmount: number; errorMsg?: string } {
  if (!promo || !promo.isActive) {
    return { valid: false, discountAmount: 0, errorMsg: "كود الخصم غير صالح أو متوقف" };
  }
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    return { valid: false, discountAmount: 0, errorMsg: "كود الخصم منتهي الصلاحية" };
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, discountAmount: 0, errorMsg: "تم استهلاك الحد الأقصى للكود" };
  }
  if (subtotal < promo.minOrderSubtotal) {
    return {
      valid: false,
      discountAmount: 0,
      errorMsg: `الحد الأدنى لتطبيق الكود هو ${promo.minOrderSubtotal} ج.م`,
    };
  }

  const rawDiscount =
    promo.discountType === "PERCENTAGE"
      ? (subtotal * promo.value) / 100
      : promo.value;
  const clamped = Math.max(0, Math.min(subtotal, Math.round(rawDiscount)));
  return { valid: true, discountAmount: clamped };
}
