"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

// Vacía el carrito cuando el cliente vuelve de Mercado Pago con el pago hecho.
export default function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
