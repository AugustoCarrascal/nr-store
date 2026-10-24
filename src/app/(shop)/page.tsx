import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { getFeaturedProducts } from "@/lib/data/products";

export const instant = false;

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <section className="py-24 text-center sm:py-32">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
          Temporada 2026
        </p>
        <h1 className="text-5xl font-black leading-none tracking-tighter sm:text-7xl">
          VISTE LA <br />
          <span className="text-lime-400">PASIÓN</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-zinc-400">
          Las mejores camisetas de fútbol y ropa deportiva. Envíos a todo el país.
        </p>
        <Link
          href="/productos"
          className="mt-8 inline-block rounded-full bg-lime-400 px-8 py-3 font-bold text-zinc-950 transition hover:bg-lime-300"
        >
          Ver camisetas
        </Link>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Destacados</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
