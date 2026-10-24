import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import OrderActions from "@/components/admin/OrderActions";
import { formatPrice } from "@/lib/utils";
import { formatDateTime, monthKey, monthName, monthStart, normalizeMonth, parseMonth } from "@/lib/admin/dates";
import { CHANNEL_LABELS, STATUS_LABELS, type Order, type OrderStatus } from "@/types/orders";

export const metadata = { title: "Ventas | NR ADMIN" };

type SP = { mes?: string; origen?: string; estado?: string };

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-400/10 text-amber-400",
  paid: "bg-lime-400/10 text-lime-400",
  shipped: "bg-sky-400/10 text-sky-400",
  cancelled: "bg-zinc-700/40 text-zinc-400",
};

function whatsappLink(phone: string) {
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!d.startsWith("54")) d = `549${d}`;
  return `https://wa.me/${d}`;
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { year, month0 } = parseMonth(sp.mes);
  const prev = normalizeMonth(year, month0 - 1);
  const next = normalizeMonth(year, month0 + 1);

  const href = (o: Partial<SP>) => {
    const merged = { mes: monthKey(year, month0), origen: sp.origen, estado: sp.estado, ...o };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/admin/ventas?${q.toString()}`;
  };

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .gte("created_at", monthStart(year, month0).toISOString())
    .lt("created_at", monthStart(year, month0 + 1).toISOString())
    .order("created_at", { ascending: false })
    .limit(500);
  if (sp.origen === "online" || sp.origen === "manual") query = query.eq("source", sp.origen);
  if (sp.estado && sp.estado in STATUS_LABELS) query = query.eq("status", sp.estado);

  const { data } = await query;
  const orders = (data ?? []) as Order[];

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs ${active ? "bg-lime-400 font-bold text-zinc-950" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Ventas</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={href({ mes: monthKey(prev.year, prev.month0) })} aria-label="Mes anterior" className="rounded-full border border-white/15 p-2 hover:border-lime-400">
            <ChevronLeft size={16} />
          </Link>
          <span className="min-w-36 text-center font-semibold capitalize">{monthName(year, month0)}</span>
          <Link href={href({ mes: monthKey(next.year, next.month0) })} aria-label="Mes siguiente" className="rounded-full border border-white/15 p-2 hover:border-lime-400">
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={href({ origen: undefined })} className={chip(!sp.origen)}>Todas</Link>
        <Link href={href({ origen: "online" })} className={chip(sp.origen === "online")}>Web</Link>
        <Link href={href({ origen: "manual" })} className={chip(sp.origen === "manual")}>Manuales</Link>
        <span className="mx-2 w-px bg-white/10" />
        <Link href={href({ estado: undefined })} className={chip(!sp.estado)}>Todos los estados</Link>
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <Link key={s} href={href({ estado: s })} className={chip(sp.estado === s)}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-white/10 py-16 text-center text-zinc-500">No hay ventas con estos filtros.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const counts = o.status === "paid" || o.status === "shipped";
            const profit = o.order_items.reduce((a, i) => a + i.quantity * (i.unit_price - i.unit_cost), 0);
            const units = o.order_items.reduce((a, i) => a + i.quantity, 0);
            return (
              <li key={o.id} className="rounded-2xl border border-white/10 bg-zinc-900">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{o.customer_name ?? "Sin nombre"}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDateTime(o.created_at)} · {CHANNEL_LABELS[o.channel ?? "web"] ?? o.channel} · {units}{" "}
                        {units === 1 ? "prenda" : "prendas"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(o.total)}</p>
                        {counts && <p className="text-xs text-lime-400">Gan. {formatPrice(profit)}</p>}
                      </div>
                    </div>
                  </summary>

                  <div className="space-y-4 border-t border-white/10 p-4 text-sm">
                    <table className="w-full">
                      <thead className="text-left text-xs text-zinc-500">
                        <tr>
                          <th className="pb-1 font-medium">Producto</th>
                          <th className="pb-1 font-medium">Talle</th>
                          <th className="pb-1 text-right font-medium">Cant.</th>
                          <th className="pb-1 text-right font-medium">Precio</th>
                          <th className="pb-1 text-right font-medium">Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.order_items.map((i) => (
                          <tr key={i.id} className="border-t border-white/5">
                            <td className="py-1.5">{i.product_name}</td>
                            <td className="py-1.5">{i.size}</td>
                            <td className="py-1.5 text-right">{i.quantity}</td>
                            <td className="py-1.5 text-right">{formatPrice(i.unit_price)}</td>
                            <td className="py-1.5 text-right text-zinc-500">{formatPrice(i.unit_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {o.shipping_cost > 0 && (
                      <p className="text-zinc-400">
                        Envío: {formatPrice(o.shipping_cost)} ({o.shipping_service})
                      </p>
                    )}

                    {(o.address || o.customer_email || o.customer_phone || o.notes) && (
                      <div className="space-y-1 text-zinc-400">
                        {o.address && (
                          <p>
                            Dirección: {o.address}
                            {o.postal_code ? ` (CP ${o.postal_code})` : ""}
                          </p>
                        )}
                        {o.customer_email && <p>Email: {o.customer_email}</p>}
                        {o.customer_phone && (
                          <p className="flex items-center gap-2">
                            Teléfono: {o.customer_phone}
                            <a href={whatsappLink(o.customer_phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lime-400 hover:underline">
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          </p>
                        )}
                        {o.notes && <p>Nota: {o.notes}</p>}
                      </div>
                    )}

                    <p className="text-xs text-zinc-600">Pedido #{o.id.slice(0, 8).toUpperCase()}</p>
                    <OrderActions id={o.id} status={o.status} source={o.source} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
