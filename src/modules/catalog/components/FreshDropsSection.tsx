/**
 * @file src/modules/catalog/components/FreshDropsSection.tsx
 * @purpose Fresh Drops Section: Homepage grid showcasing latest New Arrival products.
 */

import type { ProductSummaryDTO } from "../schema";
import { ProductCard } from "./ProductCard";

interface FreshDropsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  products: ProductSummaryDTO[];
}

export function FreshDropsSection({
  title = "Fresh Drops",
  subtitle = "High-craft themed bedsheets engineered for Cairo & New Cairo setups",
  products,
}: FreshDropsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            New Arrivals
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white md:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
