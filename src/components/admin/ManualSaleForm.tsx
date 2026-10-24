"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createManualSale } from "@/lib/admin/sales";
import { formatPrice } from "@/lib/utils";
import { SIZES } from "@/types";
import { CHANNELS } from "@/types/orders";

export type SaleProduct = { id: string; name: string; price: number; cost: number; stock: Record<string, number> };

type Line = { key: number; productId: string; size: string; quantity: string; price: string };

const inputCls =
  "w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-lime-400";
const labelCls = "mb-1 block text-xs font-semibold text-zinc-400";

export default function ManualSaleForm({ products }: { products: SaleProduct[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nextKey, setNextKey] = useState(2);
  const [lines, setLines] = useState<Line[]>([{ key: 1, productId: "", size: "", quantity: "1", price: "" }]);
  const [channel, setChannel] = useState("instagram");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const byId = new Map(products.map((p) => [p.id, p]));

  function patch(key: number, change: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...change } : l)));
  }

  function pickProduct(key: number, productId: string) {
    const p = byId.get(productId);
    patch(key, { productId, size: "", price: p ? String(p.price) : "" });
  }

  const total = lines.reduce((a, l) => a + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0);
  const profit = lines.reduce((a, l) => {
    const p = byId.get(l.productId);
    return a + ((Number(l.price) || 0) - (p?.cost ?? 0)) * (Number(l.quantity) || 0);
  }, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    for (const l of lines) {
      if (!l.productId) return setError("Elegí el producto en todas las líneas.");
      if (!l.size) return setError("Elegí el talle en todas las líneas.");
      const qty = Number(l.quantity);
      const available = byId.get(l.productId)?.stock[l.size] ?? 0;
      if (!Number.isInteger(qty) || qty < 1) return setError("La cantidad debe ser 1 o más.");
      if (qty > available) return setError(`Solo quedan ${available} de "${byId.get(l.productId)?.name}" talle ${l.size}.`);
    }

    startTransition(async () => {
      const res = await createManualSale({
        channel,
        customerName,
        customerPhone,
        notes,
        items: lines.map((l) => ({
          productId: l.productId,
          size: l.size,
          quantity: Number(l.quantity),
          unitPrice: Math.round(Number(l.price) || 0),
        })),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/admin/ventas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-8">
      <section className="space-y-4">
        <h2 className="font-bold">Qué se vendió</h2>
        {lines.map((l) => {
          const p = byId.get(l.productId);
          return (
            <div key={l.key} className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className={labelCls}>Producto</label>
                  <select value={l.productId} onChange={(e) => pickProduct(l.key, e.target.value)} className={inputCls}>
                    <option value="">Elegir…</option>
                    {products.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </div>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} aria-label="Quitar línea" className="mt-6 text-zinc-500 hover:text-red-400">
                    <X size={18} />
                  </button>
                )}
              </div>

              {p && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Talle</label>
                    <select value={l.size} onChange={(e) => patch(l.key, { size: e.target.value })} className={inputCls}>
                      <option value="">Elegir…</option>
                      {SIZES.map((s) => (
                        <option key={s} value={s} disabled={(p.stock[s] ?? 0) === 0}>
                          {s} ({p.stock[s] ?? 0} en stock)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Cantidad</label>
                    <input type="number" min={1} step={1} value={l.quantity} onChange={(e) => patch(l.key, { quantity: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Precio unitario ($)</label>
                    <input type="number" min={0} step={1} value={l.price} onChange={(e) => patch(l.key, { price: e.target.value })} className={inputCls} />
                    <p className="mt-1 text-xs text-zinc-500">Lista: {formatPrice(p.price)} · podés cambiarlo si hiciste descuento</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setLines((prev) => [...prev, { key: nextKey, productId: "", size: "", quantity: "1", price: "" }]);
            setNextKey((k) => k + 1);
          }}
          className="flex items-center gap-2 text-sm text-lime-400 hover:underline"
        >
          <Plus size={16} /> Agregar otro producto
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-bold">Cliente y canal</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Canal</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nombre (opcional)</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Teléfono (opcional)</label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Nota (opcional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Ej: pagó por transferencia, retira el sábado" />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Total de la venta</span>
          <span className="text-lg font-bold">{formatPrice(total)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-zinc-400">Ganancia estimada</span>
          <span className={`font-bold ${profit >= 0 ? "text-lime-400" : "text-red-400"}`}>{formatPrice(profit)}</span>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      <button disabled={pending} className="rounded-full bg-lime-400 px-8 py-3 font-bold text-zinc-950 hover:bg-lime-300 disabled:opacity-50">
        {pending ? "Guardando…" : "Registrar venta"}
      </button>
    </form>
  );
}
