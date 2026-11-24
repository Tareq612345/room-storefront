import { DefaultPaymentAdapter, type PaymentAdapter } from "./payment.adapter";
import {
  CairoLocalShippingAdapter,
  type ShippingAdapter,
} from "./shipping.adapter";
import {
  ConsoleWhatsAppAdapter,
  type WhatsAppAdapter,
} from "./whatsapp.adapter";

export type {
  PaymentAdapter,
  PaymentInitiationInput,
  PaymentInitiationResult,
  SupportedPaymentMethod,
} from "./payment.adapter";
export type {
  ShippingAdapter,
  ShippingDispatchInput,
  ShippingDispatchResult,
} from "./shipping.adapter";
export type {
  WhatsAppAdapter,
  WhatsAppMessageInput,
  WhatsAppSendResult,
} from "./whatsapp.adapter";

/**
 * Central adapter container. Swap providers here without touching domain services.
 */
export const adapters: {
  whatsapp: WhatsAppAdapter;
  payment: PaymentAdapter;
  shipping: ShippingAdapter;
} = {
  whatsapp: new ConsoleWhatsAppAdapter(),
  payment: new DefaultPaymentAdapter(),
  shipping: new CairoLocalShippingAdapter(),
};
