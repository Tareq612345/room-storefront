export interface ShippingDispatchInput {
  storeId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  zoneName: string;
  city: string;
  codAmount: number;
}

export interface ShippingDispatchResult {
  success: boolean;
  trackingNumber?: string;
  courierName: string;
  error?: string;
}

export interface ShippingAdapter {
  readonly courierName: string;
  createShipment(input: ShippingDispatchInput): Promise<ShippingDispatchResult>;
}

export class CairoLocalShippingAdapter implements ShippingAdapter {
  readonly courierName = "cairo-express-dispatch";

  async createShipment(
    input: ShippingDispatchInput
  ): Promise<ShippingDispatchResult> {
    return {
      success: true,
      courierName: this.courierName,
      trackingNumber: `RM-${input.orderNumber}`,
    };
  }
}
