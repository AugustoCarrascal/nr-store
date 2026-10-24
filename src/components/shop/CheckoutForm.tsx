"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/utils";

type Option = { id: string; carrier: string; service: string; price: number; etaDays: string };

const inputCls =
  "w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-lime-400";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400";

export default function CheckoutForm() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const hydrated = useHydrated();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [options, setOptions] = useState<Option[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleCart, setStaleCart] = useState(false);

  if (!hydrated) return <p className="text-zinc-500">Cargando…</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-6 text-zinc-400">Tu carrito está vacío.</p>
        <Link href="/productos" className="rounded-full bg-lime-400 px-8 py-3 font-bold text-zinc-950 hover:bg-lime-300">
          Ver camisetas
        </Link>
      </div>
    );
  }

  const lines = items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity }));
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const selected = options.find((o) => o.id === selectedId) ?? null;
  const total = subtotal + (selected?.price ?? 0);

  function handleError(message: string) {
    if (message === "INVALID_CART") {
      setStaleCart(true);
      setError("Algunos productos de tu carrito ya no están disponibles o cambiaron. Vaciá el carrito y volvé a agregarlos.");
    } else {
      setError(message);
    }
  }

  async function quote() {
    setError(null);
    setQuoting(true);
    setOptions([]);
    setSelectedId(null);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode, items: lines }),
      });
      const data = await res.json();
      if (!res.ok) {
        handleError(data.error ?? "No pudimos cotizar el envío.");
      } else {
        setOptions(data.options);
        setSelectedId(data.options[0]?.id ?? null);
      }
    } catch {
      setError("Sin conexión. Probá de nuevo.");
    }
    setQuoting(false);
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Calculá el envío y elegí una opción.");
      return;
    }
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone, address, postalCode },
          shippingOptionId: selected.id,
          items: lines,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        handleError(data.error ?? "No pudimos iniciar el pago.");
        setPaying(false);
        return;
      }
      window.location.assign(data.url); // Checkout Pro de Mercado Pago
    } catch {
      setError("Sin conexión. Probá de nuevo.");
      setPaying(false);
    }
  }

  return (
    <form onSubmit={pay} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="font-bold">Tus datos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nombre y apellido</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" />
            </div>
            <div>
              <label className={labelCls}>Teléfono / WhatsApp</label>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} autoComplete="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="font-bold">Envío</h2>
          <div>
            <label className={labelCls}>Dirección (calle, número, piso, localidad)</label>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} autoComplete="street-address" />
          </div>
          <div className="flex items-end gap-3">
            <div className="w-40">
              <label className={labelCls}>Código postal</label>
              <input
                required
                inputMode="numeric"
                maxLength={8}
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setOptions([]);
                  setSelectedId(null);
                }}
                className={inputCls}
                placeholder="1425"
                autoComplete="postal-code"
              />
            </div>
            <button
              type="button"
              onClick={quote}
              disabled={quoting || !/\d{4}/.test(postalCode)}
              className="rounded-full border border-lime-400 px-5 py-2.5 text-sm font-semibold text-lime-400 hover:bg-lime-400 hover:text-zinc-950 disabled:opacity-40"
            >
              {quoting ? "Calculando…" : "Calcular envío"}
            </button>
          </div>

          {options.length > 0 && (
            <ul className="space-y-2">
              {options.map((o) => (
                <li key={o.id}>
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 text-sm ${
                      selectedId === o.id ? "border-lime-400 bg-lime-400/5" : "border-white/15"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={selectedId === o.id} onChange={() => setSelectedId(o.id)} className="accent-lime-400" />
                      <span>
                        <span className="block font-semibold">{o.service}</span>
                        <span className="text-xs text-zinc-500">{o.etaDays}</span>
                      </span>
                    </span>
                    <span className="font-bold">{o.price === 0 ? "Gratis" : formatPrice(o.price)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-bold">Resumen</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={`${i.productId}-${i.size}`} className="flex justify-between gap-3 text-zinc-300">
              <span>
                {i.quantity}× {i.name} <span className="text-zinc-500">({i.size})</span>
              </span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-white/10 pt-3 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Envío</span>
            <span>{selected ? (selected.price === 0 ? "Gratis" : formatPrice(selected.price)) : "—"}</span>
          </div>
          <div className="flex justify-between pt-2 text-lg font-bold">
            <span>Total</span>
            <span className="text-lime-400">{formatPrice(total)}</span>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        {staleCart && (
          <button type="button" onClick={clear} className="text-sm text-lime-400 underline">
            Vaciar carrito
          </button>
        )}

        <button
          disabled={paying || !selected}
          className="w-full rounded-full bg-lime-400 py-3 font-bold text-zinc-950 hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {paying ? "Redirigiendo…" : "Pagar con Mercado Pago"}
        </button>
        <p className="text-center text-xs text-zinc-500">Vas a pagar de forma segura en Mercado Pago.</p>
      </aside>
    </form>
  );
}
