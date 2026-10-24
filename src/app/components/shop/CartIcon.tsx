"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/useHydrated";

export default function CartIcon() {
  const count = useCart((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const hydrated = useHydrated();

  return (
    <Link href="/carrito" aria-label="Carrito" className="relative transition hover:text-lime-400">
      <ShoppingBag size={22} />
      {hydrated && count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1 text-xs font-bold text-zinc-950">
          {count}
        </span>
      )}
    </Link>
  );
}