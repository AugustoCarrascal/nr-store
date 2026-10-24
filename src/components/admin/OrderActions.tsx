"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder, markOrderPaid, markOrderShipped } from "@/lib/admin/sales";
import type { OrderStatus } from "@/types/orders";

export default function OrderActions({ id, status, source }: { id: string; status: OrderStatus; source: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: (id: string) => Promise<{ error?: string }>, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    startTransition(async () => {
      const res = await fn(id);
      if (res.error) alert(res.error);
      router.refresh();
    });
  }

  const btn = "rounded-full border px-4 py-1.5 text-xs font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <button disabled={pending} onClick={() => run(markOrderPaid, "¿Marcar como pagado? Se descuenta el stock.")} className={`${btn} border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-zinc-950`}>
          Marcar pagado
        </button>
      )}
      {status === "paid" && source === "online" && (
        <button disabled={pending} onClick={() => run(markOrderShipped)} className={`${btn} border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-zinc-950`}>
          Marcar enviado
        </button>
      )}
      {status !== "cancelled" && (
        <button
          disabled={pending}
          onClick={() =>
            run(
              cancelOrder,
              status === "pending"
                ? "¿Cancelar este pedido?"
                : "¿Cancelar la venta? El stock vuelve al inventario y deja de sumar a las ganancias."
            )
          }
          className={`${btn} border-red-400/50 text-red-400 hover:bg-red-400 hover:text-zinc-950`}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
