/**
 * @file src/shared/adapters/whatsapp.adapter.ts
 * @purpose WhatsApp Adapter: Interface and console mock implementation for order confirmation and status notifications.
 */

export interface WhatsAppMessageInput {
  storeId: string;
  toPhone: string;
  templateName: "order_confirmed" | "order_dispatched" | "order_delivered";
  variables: Record<string, string>;
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface WhatsAppAdapter {
  readonly providerName: string;
  sendTemplateMessage(input: WhatsAppMessageInput): Promise<WhatsAppSendResult>;
}

export class ConsoleWhatsAppAdapter implements WhatsAppAdapter {
  readonly providerName = "console-mock";

  async sendTemplateMessage(
    input: WhatsAppMessageInput
  ): Promise<WhatsAppSendResult> {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[WhatsApp:${this.providerName}] -> ${input.toPhone} (${input.templateName})`,
        input.variables
      );
    }
    return {
      success: true,
      providerMessageId: `mock_wa_${Date.now()}`,
    };
  }
}
