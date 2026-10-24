import ManualSaleForm, { type SaleProduct } from "@/components/admin/ManualSaleForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Registrar venta | NR ADMIN" };

export default async function NewSalePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: costs }] = await Promise.all([
    supabase.from("products").select("id, name, price, stock").order("name"),
    supabase.from("product_costs").select("product_id, cost_price"),
  ]);

  const costMap = new Map<string, number>((costs ?? []).map((c) => [c.product_id as string, c.cost_price as number]));
  const list: SaleProduct[] = (products ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price: p.price as number,
    cost: costMap.get(p.id as string) ?? 0,
    stock: p.stock as Record<string, number>,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-black tracking-tight">Registrar venta</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Para ventas por Instagram, WhatsApp o en persona. Descuenta el stock y suma a las ganancias.
      </p>
      <ManualSaleForm products={list} />
    </div>
  );
}
