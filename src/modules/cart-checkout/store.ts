/**
 * @file src/modules/cart-checkout/store.ts
 * @purpose My Room Zustand Store: Persistent client-side state for adding, removing, and updating Room bag items.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoomBagItem } from "./schema";

interface RoomBagState {
  items: RoomBagItem[];
  isOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  toggleBag: () => void;
  addItem: (item: Omit<RoomBagItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearBag: () => void;
}

export const useRoomBagStore = create<RoomBagState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      openBag: () => set({ isOpen: true }),
      closeBag: () => set({ isOpen: false }),
      toggleBag: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            isOpen: true,
            items: [...state.items, { ...item, quantity: 1 }],
          };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clearBag: () => set({ items: [] }),
    }),
    {
      name: "room-bag-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
