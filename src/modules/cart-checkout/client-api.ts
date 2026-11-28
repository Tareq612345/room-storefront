/**
 * @file src/modules/cart-checkout/client-api.ts
 * @purpose Isolated Cart & Checkout API: reads/writes __isolated_cart_checkout_v1__ in Supabase, submits real orders + order_items, decrements isolated stock, and dispatches Analytics & Future Ops envelopes.
 */

import { recordFutureOrderOpsEnvelope, trackStorefrontEvent } from "@modules/analytics";
import { decrementIsolatedProductsStock } from "@modules/product-organizer";
import { adapters } from "@shared/adapters";
import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { eventBus } from "@shared/events/event-bus";
import { generateClientId } from "@shared/utils/client-auth";
import {
  CHECKOUT_LOCAL_STORAGE_KEY,
  CHECKOUT_PAGE_KEY,
  CHECKOUT_RECORD_ID,
  buildInitialCheckoutRegistry,
  evaluatePromoDiscount,
} from "./helpers";
import {
  CheckoutRegistrySchema,
  type CheckoutRegistry,
  type CompletedOrderReceipt,
  type PaymentMethodCode,
  type RoomBagItem,
} from "./schema";

function cacheCheckoutLocally(registry: CheckoutRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKOUT_LOCAL_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedCheckoutRegistry(): CheckoutRegistry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = CheckoutRegistrySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function fetchCheckoutOrganizerSnapshot(): Promise<{
  storeId: string;
  registry: CheckoutRegistry;
  recordExistsInDb: boolean;
}> {
  const [sbStores, sbIsolated] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt").catch(
      () => []
    ),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(CHECKOUT_PAGE_KEY)}`
    ).catch(() => []),
  ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";
  const row = sbIsolated[0];
  if (row) {
    const parsed = CheckoutRegistrySchema.safeParse(row.config);
    if (parsed.success) {
      cacheCheckoutLocally(parsed.data);
      return { storeId, registry: parsed.data, recordExistsInDb: true };
    }
  }

  const initial = buildInitialCheckoutRegistry();
  cacheCheckoutLocally(initial);
  return { storeId, registry: initial, recordExistsInDb: false };
}

export async function saveIsolatedCheckoutRegistry(params: {
  storeId: string;
  registry: CheckoutRegistry;
}): Promise<boolean> {
  const validated = CheckoutRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });
  cacheCheckoutLocally(validated);

  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(CHECKOUT_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: validated.updatedAt,
    }
  );

  if (patched.length > 0) return true;

  await sbInsert("page_sections", {
    id: CHECKOUT_RECORD_ID,
    storeId: params.storeId,
    pageKey: CHECKOUT_PAGE_KEY,
    type: "NEW_ARRIVALS",
    title: "Isolated Cart & Checkout Config",
    subtitle: "Payment methods, Promo codes, Rules & Dynamic labels",
    sortOrder: 9995,
    isVisible: false,
    config: validated,
    updatedAt: validated.updatedAt,
  });
  return true;
}

export interface SubmitCheckoutInput {
  items: RoomBagItem[];
  shippingZoneId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerEmail?: string;
  city?: string;
  shippingAddress: string;
  notes?: string;
  paymentMethod: PaymentMethodCode;
  paymentReferenceInput?: string;
  promoCodeInput?: string;
}

export async function submitCheckoutOrder(
  input: SubmitCheckoutInput
): Promise<CompletedOrderReceipt> {
  if (input.items.length === 0) {
    throw new Error("السلة فارغة — أضف منتجاً واحداً على الأقل.");
  }

  const cleanName = input.customerName.trim();
  const cleanPhone = input.customerPhone.trim();
  const cleanAddress = input.shippingAddress.trim();
  if (!cleanName || cleanPhone.length < 8 || cleanAddress.length < 6) {
    throw new Error("يرجى استكمال الاسم ورقم الهاتف والعنوان التفصيلي.");
  }

  const [storeRows, zoneRows, checkoutSnap] = await Promise.all([
    sbSelect<{
      id: string;
      name: string;
      currency: string;
      whatsappNumber: string | null;
    }>(
      "store_configs",
      "select=id,name,currency,whatsappNumber&slug=eq.room-egypt"
    ),
    sbSelect<{
      id: string;
      name: string;
      city: string;
      fee: number | string;
      freeShippingThreshold: number | string | null;
    }>(
      "shipping_zones",
      `select=id,name,city,fee,freeShippingThreshold&id=eq.${encodeURIComponent(input.shippingZoneId)}`
    ),
    fetchCheckoutOrganizerSnapshot(),
  ]);

  const store = storeRows[0];
  if (!store?.id) {
    throw new Error("تعذر تحديد إعدادات المتجر من قاعدة البيانات.");
  }

  const zone = zoneRows[0];
  if (!zone?.id) {
    throw new Error("منطقة الشحن المختارة غير متوفرة حالياً في قاعدة البيانات.");
  }

  const pmConfig = checkoutSnap.registry.paymentMethods.find(
    (m) => m.code === input.paymentMethod && m.isEnabled
  );
  if (!pmConfig) {
    throw new Error("طريقة الدفع المختارة غير مفعّلة.");
  }
  if (pmConfig.requiresReference && !input.paymentReferenceInput?.trim()) {
    throw new Error("يرجى إدخال رقم مرجع التحويل لطريقة الدفع المختارة.");
  }
  if (checkoutSnap.registry.rules.requireEmail && !input.customerEmail?.trim()) {
    throw new Error("البريد الإلكتروني مطلوب لإتمام الطلب.");
  }

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Promo calculation
  let discountAmount = 0;
  let promoCodeUsed: string | null = null;
  let matchedPromoId: string | null = null;
  if (
    checkoutSnap.registry.rules.enablePromoCodes &&
    input.promoCodeInput?.trim()
  ) {
    const cleanCode = input.promoCodeInput.trim().toUpperCase();
    const matchedPromo = checkoutSnap.registry.promoCodes.find(
      (p) => p.code.toUpperCase() === cleanCode
    );
    const evalResult = evaluatePromoDiscount(matchedPromo, subtotal);
    if (!evalResult.valid) {
      throw new Error(evalResult.errorMsg ?? "كود الخصم غير صالح.");
    }
    discountAmount = evalResult.discountAmount;
    promoCodeUsed = matchedPromo?.code ?? null;
    matchedPromoId = matchedPromo?.id ?? null;
  }

  const baseFee = Number(zone.fee);
  const freeThreshold = zone.freeShippingThreshold
    ? Number(zone.freeShippingThreshold)
    : Infinity;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = discountedSubtotal >= freeThreshold ? 0 : baseFee;
  const paymentExtraFee = pmConfig.extraFee ?? 0;
  const total = Number(
    (discountedSubtotal + shippingFee + paymentExtraFee).toFixed(2)
  );

  const now = new Date();
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `RM-${ymd}-${rand}`;
  const orderId = generateClientId("ord");
  const nowIso = now.toISOString();

  // Payment & Shipping adapters
  const paymentResult = await adapters.payment.initiatePayment({
    storeId: store.id,
    orderId,
    orderNumber,
    amount: total,
    currency: store.currency || "EGP",
    method: input.paymentMethod,
    customerName: cleanName,
    customerPhone: cleanPhone,
    customerEmail: input.customerEmail?.trim() || undefined,
  });

  const finalPaymentRef =
    input.paymentReferenceInput?.trim() ||
    paymentResult.providerReference ||
    `${input.paymentMethod}-${orderNumber}`;

  await adapters.shipping.createShipment({
    storeId: store.id,
    orderId,
    orderNumber,
    customerName: cleanName,
    customerPhone: cleanPhone,
    shippingAddress: cleanAddress,
    zoneName: zone.name,
    city: input.city?.trim() || zone.city || checkoutSnap.registry.rules.defaultCityFallback,
    codAmount: input.paymentMethod === "COD" ? total : 0,
  });

  // 1. Insert real Order row
  const notesParts = [
    input.notes?.trim() || null,
    promoCodeUsed ? `Promo: ${promoCodeUsed} (-${discountAmount} EGP)` : null,
    paymentExtraFee > 0 ? `Gateway Fee: +${paymentExtraFee} EGP` : null,
  ].filter(Boolean);

  await sbInsert("orders", {
    id: orderId,
    storeId: store.id,
    orderNumber,
    userId: null,
    shippingZoneId: zone.id,
    customerName: cleanName,
    customerPhone: cleanPhone,
    customerWhatsapp: input.customerWhatsapp?.trim() || cleanPhone,
    customerEmail: input.customerEmail?.trim() || null,
    shippingAddress: cleanAddress,
    city:
      input.city?.trim() ||
      zone.city ||
      checkoutSnap.registry.rules.defaultCityFallback,
    notes: notesParts.length > 0 ? notesParts.join(" | ") : null,
    status: "PENDING",
    paymentMethod: input.paymentMethod,
    paymentStatus: paymentResult.status,
    paymentReference: finalPaymentRef,
    subtotal,
    shippingFee: shippingFee + paymentExtraFee,
    discountAmount,
    total,
    updatedAt: nowIso,
  });

  // 2. Insert real OrderItem rows (nullable FKs avoid legacy table violations; variantSnapshot preserves full isolated reference)
  await Promise.all(
    input.items.map((item) =>
      sbInsert("order_items", {
        id: generateClientId("ori"),
        storeId: store.id,
        orderId,
        itemType: item.itemType,
        productId: null,
        variantId: null,
        bundleId: null,
        titleSnapshot: item.title,
        variantSnapshot: [
          item.variantLabel || null,
          `ref:${item.entityId ?? item.id}`,
          item.slug ? `slug:${item.slug}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: Number((item.unitPrice * item.quantity).toFixed(2)),
      })
    )
  );

  // 3. Increment promo usage inside isolated checkout registry if used
  if (matchedPromoId) {
    const nextPromos = checkoutSnap.registry.promoCodes.map((p) =>
      p.id === matchedPromoId ? { ...p, usedCount: p.usedCount + 1 } : p
    );
    await saveIsolatedCheckoutRegistry({
      storeId: store.id,
      registry: { ...checkoutSnap.registry, promoCodes: nextPromos },
    }).catch(() => {});
  }

  // 4. Auto-decrement isolated product stock
  if (checkoutSnap.registry.rules.autoDecrementStock) {
    const productLines = input.items
      .filter((i) => i.itemType === "PRODUCT")
      .map((i) => ({
        productIdOrSlug: i.entityId ?? i.slug ?? i.id,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      }));
    await decrementIsolatedProductsStock(productLines).catch(() => {});
  }

  // 5. Emit Domain Bus event, Analytics PURCHASE event & Future Ops envelopes
  const merchantPhone = (store.whatsappNumber || "+201000000000").replace(
    /[^0-9]/g,
    ""
  );
  const resolvedCity =
    input.city?.trim() ||
    zone.city ||
    checkoutSnap.registry.rules.defaultCityFallback;

  await Promise.allSettled([
    eventBus.emit("order.created", {
      storeId: store.id,
      orderId,
      orderNumber,
      total,
      customerPhone: cleanPhone,
    }),
    trackStorefrontEvent({
      eventType: "PURCHASE",
      path: "/checkout/",
      entityType: "ORDER",
      entityId: orderId,
      entitySlug: orderNumber,
      revenue: total,
      orderId,
      shippingZoneId: zone.id,
      metadata: {
        paymentMethod: input.paymentMethod,
        itemsCount: input.items.reduce((s, i) => s + i.quantity, 0),
        promoCodeUsed,
      },
    }),
    recordFutureOrderOpsEnvelope({
      storeId: store.id,
      orderId,
      orderNumber,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: input.customerEmail?.trim() || null,
      city: resolvedCity,
      shippingZoneId: zone.id,
      zoneName: zone.name,
      paymentMethod: input.paymentMethod,
      paymentProvider: pmConfig.futureGatewayProvider,
      paymentReference: finalPaymentRef,
      paymentStatus: paymentResult.status,
      total,
      merchantWhatsapp: store.whatsappNumber || "+201000000000",
    }),
  ]);

  const itemsSummary = input.items
    .map((i) => `• ${i.title} ×${i.quantity} (${i.unitPrice * i.quantity} EGP)`)
    .join("\n");
  const waBody = [
    checkoutSnap.registry.labels.whatsappOrderNote,
    `رقم الطلب: #${orderNumber}`,
    `الاسم: ${cleanName}`,
    `الهاتف: ${cleanPhone}`,
    `المنطقة: ${zone.name} (${resolvedCity})`,
    `العنوان: ${cleanAddress}`,
    `الدفع: ${pmConfig.labelAr} (${finalPaymentRef})`,
    itemsSummary,
    promoCodeUsed ? `كود الخصم: ${promoCodeUsed} (-${discountAmount} EGP)` : null,
    `الإجمالي النهائي: ${total} EGP`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    orderId,
    orderNumber,
    customerName: cleanName,
    customerPhone: cleanPhone,
    zoneName: zone.name,
    city: resolvedCity,
    shippingAddress: cleanAddress,
    paymentMethod: input.paymentMethod,
    paymentReference: finalPaymentRef,
    subtotal,
    discountAmount,
    promoCodeUsed,
    shippingFee,
    paymentExtraFee,
    total,
    merchantWhatsappUrl: `https://wa.me/${merchantPhone}?text=${encodeURIComponent(waBody)}`,
    createdAt: nowIso,
  };
}
