/**
 * @file src/modules/cart-checkout/store.ts
 * @purpose My Room Zustand Store: Persistent client-side state for Cart items, Bag/Checkout drawer mode, stock clamping, and telemetry hooks.
 */

"use client";

import { trackStorefrontEvent } from "@modules/analytics";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoomBagItem } from "./schema";

export type DrawerViewMode = "bag" | "checkout" | "success";

interface RoomBagState {
  items: RoomBagItem[];
  isOpen: boolean;
  viewMode: DrawerViewMode;
  openBag: () => void;
  openCheckout: () => void;
  closeBag: () => void;
  toggleBag: () => void;
  setViewMode: (mode: DrawerViewMode) => void;
  addItem: (item: Omit<RoomBagItem, "quantity">, openAsCheckout?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearBag: () => void;
}

export const useRoomBagStore = create<RoomBagState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      viewMode: "bag",
      openBag: () => set({ isOpen: true, viewMode: "bag" }),
      openCheckout: () => {
        void trackStorefrontEvent({ eventType: "BEGIN_CHECKOUT", path: "/checkout/" });
        set({ isOpen: true, viewMode: "checkout" });
      },
      closeBag: () => set({ isOpen: false }),
      toggleBag: () => set((state) => ({ isOpen: !state.isOpen })),
      setViewMode: (mode) => {
        if (mode === "checkout") {
          void trackStorefrontEvent({ eventType: "BEGIN_CHECKOUT", path: "/checkout/" });
        }
        set({ viewMode: mode });
      },
      addItem: (item, openAsCheckout = false) => {
        void trackStorefrontEvent({
          eventType: "ADD_TO_BAG",
          entityType: item.itemType,
          entityId: item.entityId ?? item.id,
          entitySlug: item.slug ?? null,
          revenue: item.unitPrice,
        });
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          const cap =
            typeof item.maxStock === "number" && item.maxStock > 0
              ? item.maxStock
              : 99;
          const nextMode: DrawerViewMode = openAsCheckout ? "checkout" : "bag";
          if (existing) {
            return {
              isOpen: true,
              viewMode: nextMode,
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: Math.min(cap, i.quantity + 1) }
                  : i
              ),
            };
          }
          return {
            isOpen: true,
            viewMode: nextMode,
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => {
                  if (i.id !== id) return i;
                  const cap =
                    typeof i.maxStock === "number" && i.maxStock > 0
                      ? i.maxStock
                      : 99;
                  return { ...i, quantity: Math.min(cap, quantity) };
                }),
        })),
      clearBag: () => set({ items: [] }),
    }),
    {
      name: "room-bag-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
