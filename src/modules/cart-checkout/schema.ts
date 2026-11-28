/**
 * @file src/modules/cart-checkout/schema.ts
 * @purpose Isolated Cart & Checkout Schemas: zero-static contracts for My Room Bag items, Checkout Configuration (Payment methods, Promo codes, Validation rules, Dynamic labels), and Completed Order Receipts.
 */

import { z } from "zod";

export const RoomBagItemSchema = z.object({
  id: z.string(),
  entityId: z.string().optional(),
  variantId: z.string().nullable().optional(),
  slug: z.string().optional(),
  itemType: z.enum(["PRODUCT", "BUNDLE"]),
  title: z.string(),
  subtitle: z.string().nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  maxStock: z.number().int().nonnegative().nullable().optional(),
  variantLabel: z.string().nullable().optional(),
  accentColor: z.string(),
  imageUrl: z.string().optional(),
});

export type RoomBagItem = z.infer<typeof RoomBagItemSchema>;

export const PaymentMethodCodeSchema = z.enum([
  "COD",
  "INSTAPAY",
  "WALLET",
  "ONLINE_CARD",
]);

export type PaymentMethodCode = z.infer<typeof PaymentMethodCodeSchema>;

export const PaymentMethodOptionSchema = z.object({
  id: z.string(),
  code: PaymentMethodCodeSchema,
  labelAr: z.string(),
  labelEn: z.string(),
  descriptionAr: z.string().default(""),
  descriptionEn: z.string().default(""),
  accountOrHandle: z.string().default(""),
  extraFee: z.number().nonnegative().default(0),
  requiresReference: z.boolean().default(false),
  futureGatewayProvider: z.string().default("manual"),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().default(1),
});

export type PaymentMethodOption = z.infer<typeof PaymentMethodOptionSchema>;

export const PromoCodeItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().nonnegative(),
  minOrderSubtotal: z.number().nonnegative().default(0),
  maxUses: z.number().int().positive().nullable().default(null),
  usedCount: z.number().int().nonnegative().default(0),
  expiresAt: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
});

export type PromoCodeItem = z.infer<typeof PromoCodeItemSchema>;

export const CheckoutRulesSchema = z.object({
  requireEmail: z.boolean().default(false),
  enableNotes: z.boolean().default(true),
  enablePromoCodes: z.boolean().default(true),
  autoDecrementStock: z.boolean().default(true),
  maxQtyPerItem: z.number().int().min(1).max(99).default(10),
  defaultCityFallback: z.string().default("Cairo"),
});

export const CheckoutLabelsSchema = z.object({
  bagEyebrow: z.string().default("Your Loadout"),
  bagTitle: z.string().default("MY ROOM"),
  emptyTitle: z.string().default("سلتك فارغة حالياً"),
  emptySubtitle: z
    .string()
    .default("اختر يونيفيرس وأضف المنتجات أو الباقات المناسبة لغرفتك."),
  checkoutCta: z.string().default("إتمام الطلب • Checkout"),
  confirmOrderCta: z.string().default("تأكيد وإرسال الطلب"),
  whatsappOrderNote: z
    .string()
    .default("طلب جديد من متجر ROOM — برجاء تأكيد بيانات التوصيل"),
});

export const CheckoutRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  rules: CheckoutRulesSchema,
  labels: CheckoutLabelsSchema,
  paymentMethods: z.array(PaymentMethodOptionSchema),
  promoCodes: z.array(PromoCodeItemSchema),
});

export type CheckoutRegistry = z.infer<typeof CheckoutRegistrySchema>;

export interface CompletedOrderReceipt {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  zoneName: string;
  city: string;
  shippingAddress: string;
  paymentMethod: PaymentMethodCode;
  paymentReference: string | null;
  subtotal: number;
  discountAmount: number;
  promoCodeUsed: string | null;
  shippingFee: number;
  paymentExtraFee: number;
  total: number;
  merchantWhatsappUrl: string;
  createdAt: string;
}
