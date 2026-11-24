import { notFound } from "next/navigation";
import { getActiveStoreConfig } from "@modules/store-config";
import {
  getUniverseBySlug,
  listStoreUniverses,
  UniverseStarHeader,
} from "@modules/universes";
import { listProductsByUniverse, ProductCard } from "@modules/catalog";

export default async function UniversePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getActiveStoreConfig();

  const [universes, universe, products] = await Promise.all([
    listStoreUniverses(store.id),
    getUniverseBySlug(store.id, slug),
    listProductsByUniverse(store.id, slug),
  ]);

  if (!universe) {
    notFound();
  }

  return (
    <div data-universe={universe.slug} className="flex flex-col pb-16">
      <UniverseStarHeader universes={universes} activeSlug={universe.slug} />

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div
          className="rounded-3xl border border-[var(--color-border-subtle)] p-8 md:p-10"
          style={{
            background: `linear-gradient(135deg, #05030a 0%, ${universe.accentColor}26 100%)`,
          }}
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
            style={{ backgroundColor: universe.accentColor }}
          >
            Universe
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-white md:text-4xl">
            {universe.name}
          </h1>
          {universe.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {universe.description}
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
