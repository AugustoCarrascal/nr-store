import Link from "next/link";
import { Shirt } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0);

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-lime-400/60"
    >
      {/* Placeholder de imagen: lo reemplazamos por <Image> cuando subamos fotos */}
      <div className="relative flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
        <Shirt
          size={96}
          strokeWidth={1}
          className="text-zinc-600 transition duration-300 group-hover:scale-110 group-hover:text-lime-400"
        />
        {totalStock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold">
            Sin stock
          </span>
        )}
      </div>

      <div className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">{product.category}</p>
        <h3 className="font-semibold leading-tight">{product.name}</h3>
        <p className="text-lg font-bold text-lime-400">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}