/**
 * @file src/shared/types/common.ts
 * @purpose Shared Types & Formatters: StoreContext, ActionResult<T>, and EGP currency formatter.
 */

export interface StoreContext {
  storeId: string;
  slug: string;
  currency: string;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function formatEgp(amount: number, currency = "EGP"): string {
  return `${Math.round(amount).toLocaleString("en-US")} ${currency}`;
}
