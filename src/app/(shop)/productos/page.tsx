import ProductCard from "@/components/shop/ProductCard";
import { getProducts } from "@/lib/data/products";

export const metadata = { title: "Camisetas | NR STORE" };

export default function ProductosPage() {
  const products = getProducts();

  return (
    <section className="py-10">
      <h1 className="mb-8 text-3xl font-black tracking-tight">Catálogo</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
