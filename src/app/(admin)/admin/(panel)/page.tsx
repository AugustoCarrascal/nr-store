import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  currentMonth,
  hoursAgoIso,
  monthKey,
  monthKeyOf,
  monthName,
  monthShort,
  monthStart,
  normalizeMonth,
  parseMonth,
} from "@/lib/admin/dates";
import { delta, summarize, topProducts, type StatOrder } from "@/lib/admin/stats";

export const metadata = { title: "Resumen | NR ADMIN" };

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${accent ? "text-lime-400" : ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <>sin datos del mes anterior</>;
  const up = value >= 0;
  return (
    <span className={up ? "text-lime-400" : "text-red-400"}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(value))}% vs. mes anterior
    </span>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  const { year, month0 } = parseMonth(mes);
  const prev = normalizeMonth(year, month0 - 1);
  const next = normalizeMonth(year, month0 + 1);
  const now = currentMonth();
  const isLatest = monthKey(year, month0) >= monthKey(now.year, now.month0);

  const supabase = await createClient();

  // Una sola consulta trae los últimos 6 meses; el resto se calcula acá.
  const from = monthStart(year, month0 - 5).toISOString();
  const to = monthStart(year, month0 + 1).toISOString();

  const [{ data: ordersData }, { data: productsData }, pendingRes, toShipRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, paid_at, source, shipping_cost, order_items(product_name, quantity, unit_price, unit_cost)")
      .in("status", ["paid", "shipped"])
      .gte("paid_at", from)
      .lt("paid_at", to)
      .limit(5000),
    supabase.from("products").select("id, name, stock").eq("active", true),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("source", "online")
      .gte("created_at", hoursAgoIso(48)),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid").eq("source", "online"),
  ]);

  const orders = (ordersData ?? []) as unknown as StatOrder[];

  // Agrupamos por mes (hora Argentina)
  const byMonth = new Map<string, StatOrder[]>();
  for (const o of orders) {
    const k = monthKeyOf(o.paid_at);
    byMonth.set(k, [...(byMonth.get(k) ?? []), o]);
  }

  const thisKey = monthKey(year, month0);
  const monthOrders = byMonth.get(thisKey) ?? [];
  const cur = summarize(monthOrders);
  const prevSum = summarize(byMonth.get(monthKey(prev.year, prev.month0)) ?? []);

  const series = Array.from({ length: 6 }, (_, i) => {
    const m = normalizeMonth(year, month0 - 5 + i);
    const s = summarize(byMonth.get(monthKey(m.year, m.month0)) ?? []);
    return { label: monthShort(m.year, m.month0), revenue: s.revenue, profit: s.profit, current: i === 5 };
  });
  const maxRevenue = Math.max(1, ...series.map((s) => s.revenue));

  const top = topProducts(monthOrders);

  const lowStock = (productsData ?? [])
    .map((p) => {
      const stock = p.stock as Record<string, number>;
      const total = Object.values(stock).reduce((a, b) => a + b, 0);
      return { id: p.id as string, name: p.name as string, total, stock };
    })
    .filter((p) => p.total <= 5)
    .sort((a, b) => a.total - b.total)
    .slice(0, 8);

  const pending = pendingRes.count ?? 0;
  const toShip = toShipRes.count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Resumen</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/admin?mes=${monthKey(prev.year, prev.month0)}`} aria-label="Mes anterior" className="rounded-full border border-white/15 p-2 hover:border-lime-400">
            <ChevronLeft size={16} />
          </Link>
          <span className="min-w-36 text-center font-semibold capitalize">{monthName(year, month0)}</span>
          {isLatest ? (
            <span className="rounded-full border border-white/5 p-2 text-zinc-700">
              <ChevronRight size={16} />
            </span>
          ) : (
            <Link href={`/admin?mes=${monthKey(next.year, next.month0)}`} aria-label="Mes siguiente" className="rounded-full border border-white/15 p-2 hover:border-lime-400">
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {(toShip > 0 || pending > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {toShip > 0 && (
            <Link href="/admin/ventas?estado=paid&origen=online" className="rounded-full bg-lime-400/10 px-4 py-2 text-lime-400 hover:bg-lime-400/20">
              {toShip} {toShip === 1 ? "pedido web pago para enviar" : "pedidos web pagos para enviar"}
            </Link>
          )}
          {pending > 0 && (
            <Link href="/admin/ventas?estado=pending&origen=online" className="rounded-full bg-amber-400/10 px-4 py-2 text-amber-400 hover:bg-amber-400/20">
              {pending} {pending === 1 ? "pago web pendiente (48 h)" : "pagos web pendientes (48 h)"}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ventas" value={String(cur.orders)} sub={`${cur.units} ${cur.units === 1 ? "prenda" : "prendas"}`} />
        <Kpi label="Ingresos" value={formatPrice(cur.revenue)} sub={<Delta value={delta(cur.revenue, prevSum.revenue)} />} />
        <Kpi label="Costo de mercadería" value={formatPrice(cur.cost)} />
        <Kpi label="Ganancia" value={formatPrice(cur.profit)} sub={`Margen ${cur.margin.toFixed(0)}%`} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5 lg:col-span-2">
          <h2 className="mb-1 font-bold">Últimos 6 meses</h2>
          <p className="mb-4 text-xs text-zinc-500">Barra gris: ingresos. Barra verde: ganancia.</p>
          <div className="flex h-44 items-end gap-3">
            {series.map((s) => (
              <div key={s.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t bg-zinc-600" style={{ height: `${(s.revenue / maxRevenue) * 100}%`, minHeight: s.revenue > 0 ? 3 : 0 }} title={`Ingresos ${formatPrice(s.revenue)}`} />
                  <div className="w-1/2 rounded-t bg-lime-400" style={{ height: `${(Math.max(0, s.profit) / maxRevenue) * 100}%`, minHeight: s.profit > 0 ? 3 : 0 }} title={`Ganancia ${formatPrice(s.profit)}`} />
                </div>
                <span className={`text-xs capitalize ${s.current ? "font-bold text-white" : "text-zinc-500"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <h2 className="mb-4 font-bold">Por canal</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-400">Web (Mercado Pago)</dt>
              <dd className="font-semibold">{formatPrice(cur.online)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Ventas manuales</dt>
              <dd className="font-semibold">{formatPrice(cur.manual)}</dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-white/10 pt-3 text-xs text-zinc-500">
            Los ingresos no incluyen el envío, porque se paga aparte al transporte.
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <h2 className="mb-4 font-bold">Más vendidos del mes</h2>
          {top.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía no hay ventas en este mes.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-500">
                <tr>
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 text-right font-medium">Unid.</th>
                  <th className="pb-2 text-right font-medium">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {top.map((t) => (
                  <tr key={t.name} className="border-t border-white/10">
                    <td className="py-2">{t.name}</td>
                    <td className="py-2 text-right">{t.units}</td>
                    <td className="py-2 text-right text-lime-400">{formatPrice(t.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Stock bajo</h2>
            <Link href="/admin/stock" className="text-xs text-lime-400 hover:underline">
              Ver todo
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500">Todo con stock suficiente.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 border-t border-white/10 pt-2 first:border-0 first:pt-0">
                  <Link href={`/admin/productos/${p.id}`} className="hover:text-lime-400">
                    {p.name}
                  </Link>
                  <span className={p.total === 0 ? "font-semibold text-red-400" : "text-amber-400"}>
                    {p.total === 0 ? "Agotado" : `${p.total} en total`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
