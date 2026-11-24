/**
 * @file src/shared/adapters/payment.adapter.ts
 * @purpose Payment Adapter: Interface and default gateway implementation supporting COD, Online Card, Wallet, and InstaPay.
 */

export type SupportedPaymentMethod =
  | "COD"
  | "ONLINE_CARD"
  | "WALLET"
  | "INSTAPAY";

export interface PaymentInitiationInput {
  storeId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  method: SupportedPaymentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  status: "PENDING" | "PAID" | "FAILED";
  providerReference?: string;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentAdapter {
  readonly providerName: string;
  initiatePayment(
    input: PaymentInitiationInput
  ): Promise<PaymentInitiationResult>;
}

export class DefaultPaymentAdapter implements PaymentAdapter {
  readonly providerName = "room-default-gateway";

  async initiatePayment(
    input: PaymentInitiationInput
  ): Promise<PaymentInitiationResult> {
    if (input.method === "COD") {
      return {
        success: true,
        status: "PENDING",
        providerReference: `COD-${input.orderNumber}`,
      };
    }

    // Stub for Paymob / Kashier / InstaPay integration
    return {
      success: true,
      status: "PENDING",
      providerReference: `ONL-${input.orderNumber}-${Date.now()}`,
    };
  }
}
