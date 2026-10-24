"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { useCart } from "@/store/cart";
import SizeSelector from "./SizeSelector";

export default function AddToCart({ product }: { product: Product }) {
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const outOfStock = Object.values(product.stock).every((q) => q === 0);

  function handleAdd() {
    if (!size) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size,
      maxQty: product.stock[size],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (outOfStock) {
    return <p className="rounded-lg bg-red-500/10 p-4 text-red-400">Producto sin stock por el momento.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Talle</p>
        <SizeSelector stock={product.stock} selected={size} onSelect={setSize} />
      </div>

      <button
        onClick={handleAdd}
        disabled={!size}
        className="w-full rounded-full bg-lime-400 py-4 font-bold text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      >
        {size ? "Agregar al carrito" : "Elegí un talle"}
      </button>

      {added && (
        <p className="text-center text-sm text-lime-400">
          ¡Agregado!{" "}
          <Link href="/carrito" className="underline">
            Ver carrito
          </Link>
        </p>
      )}
    </div>
  );
}