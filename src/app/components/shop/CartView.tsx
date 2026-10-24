"use client";

import Link from "next/link";
import { Minus, Plus, Shirt, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/utils";

export default function CartView() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const hydrated = useHydrated();

  if (!hydrated) return <p className="py-10 text-zinc-500">Cargando carrito…</p>;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-6 text-zinc-400">Tu carrito está vacío.</p>
        <Link href="/productos" className="rounded-full bg-lime-400 px-8 py-3 font-bold text-zinc-950 hover:bg-lime-300">
          Ver camisetas
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <ul className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <li
            key={`${item.productId}-${item.size}`}
            className="flex gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4"
          >
            <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <Shirt size={36} strokeWidth={1} className="text-zinc-600" />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-2">
                <div>
                  <Link href={`/productos/${item.slug}`} className="font-semibold hover:text-lime-400">
                    {item.name}
                  </Link>
                  <p className="text-sm text-zinc-500">Talle {item.size}</p>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.size)}
                  aria-label="Quitar del carrito"
                  className="text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 rounded-full border border-white/20 px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                    aria-label="Restar"
                    className="p-1 hover:text-lime-400"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQty}
                    aria-label="Sumar"
                    className="p-1 hover:text-lime-400 disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="font-bold text-lime-400">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-bold">Resumen</h2>
        <div className="flex justify-between text-zinc-400">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="text-sm text-zinc-500">El envío se calcula en el checkout.</p>
        <Link
          href="/checkout"
          className="block w-full rounded-full bg-lime-400 py-3 text-center font-bold text-zinc-950 hover:bg-lime-300"
        >
          Continuar compra
        </Link>
      </aside>
    </div>
  );
}