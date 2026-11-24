"use client";

import { formatEgp } from "@shared/types/common";
import { getAssetPath } from "@shared/utils/asset-path";
import { Minus, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRoomBagStore } from "../store";

export function MyRoomTriggerAndDrawer() {
  const {
    items,
    isOpen,
    openBag,
    closeBag,
    updateQuantity,
    removeItem,
    clearBag,
  } = useRoomBagStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const subtotal = mounted
    ? items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    : 0;

  return (
    <>
      {/* Sleek Floating "MY ROOM" Pill Button */}
      <button
        type="button"
        onClick={openBag}
        className="fixed right-4 top-4 z-50 flex items-center gap-2.5 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_28px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/45 hover:bg-black/90 md:right-6 md:top-6"
      >
        <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        <span>My Room</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[11px] font-bold text-white">
          {totalCount}
        </span>
      </button>

      {/* Slide-Over "MY ROOM" Drawer */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeBag}
            aria-hidden="true"
          />

          <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--color-border-subtle)] bg-[#080510] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                  Your Loadout
                </p>
                <h2 className="mt-0.5 font-serif text-xl font-semibold tracking-wider text-white">
                  MY ROOM ({totalCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeBag}
                className="rounded-full border border-white/15 p-2 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                aria-label="Close My Room"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
                    <Sparkles className="h-6 w-6 text-white/60" />
                  </div>
                  <p className="mt-4 font-serif text-lg text-white">
                    Your Room is Empty
                  </p>
                  <p className="mt-1.5 max-w-xs text-xs text-[var(--color-text-secondary)]">
                    Pick a Universe and claim bedsheets or a full Loadout to build your setup.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-3.5"
                    >
                      {item.imageUrl ? (
                        <img
                          src={getAssetPath(item.imageUrl)}
                          alt={item.title}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div
                          className="h-16 w-16 shrink-0 rounded-xl border border-white/10"
                          style={{
                            background: `radial-gradient(circle, ${item.accentColor}55 0%, #090612 100%)`,
                          }}
                        />
                      )}

                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-white">
                              {item.title}
                            </h3>
                            <p className="mt-0.5 text-xs font-bold text-white/90">
                              {formatEgp(item.unitPrice)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-white/40 transition-colors hover:text-red-400"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-white/40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-white/40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 ? (
              <div className="border-t border-[var(--color-border-subtle)] bg-black/50 p-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                  <span className="text-lg font-bold text-white">
                    {formatEgp(subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  Cairo &amp; New Cairo Express Delivery calculated at checkout
                </p>

                <div className="mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={clearBag}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/75 hover:border-white/35 hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                  >
                    Checkout (COD / Online)
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
