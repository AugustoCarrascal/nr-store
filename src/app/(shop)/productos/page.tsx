import Link from "next/link";
import { X } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import CatalogFilters from "@/components/shop/CatalogFilters";
import SortSelect from "@/components/shop/SortSelect";
import { getProducts } from "@/lib/data/products";
import { buildHref, cleanParams, filterProducts, sortProducts, type CatalogParams } from "@/lib/catalog";

export const metadata = { title: "Camisetas | NR STORE" };



export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<CatalogParams>;
}) {
  const params = await searchParams;
  const all = await getProducts();
  const results = sortProducts(filterProducts(all, params), params.sort);

  const title = params.team ?? params.country ?? params.region ?? params.category ?? "Catálogo";

  return (
    <section className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {results.length} {results.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <SortSelect params={cleanParams(params)} current={params.sort ?? "newest"} />
      </div>

      {params.q && (
        <Link
          href={buildHref(params, { q: undefined })}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
        >
          Búsqueda: “{params.q}” <X size={14} />
        </Link>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <CatalogFilters products={all} params={params} />
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-white/10 py-20 text-center">
              <p className="text-zinc-400">No encontramos camisetas con esos filtros.</p>
              <Link href="/productos" className="mt-4 inline-block text-lime-400 hover:underline">
                Ver todo el catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}