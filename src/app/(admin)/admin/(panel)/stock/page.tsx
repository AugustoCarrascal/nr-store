import StockTable, { type StockRow } from "@/components/admin/StockTable";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Stock | NR ADMIN" };

export default async function StockPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, name, team, active, stock").order("name");

  const rows: StockRow[] = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    team: (p.team as string | null) ?? null,
    active: p.active as boolean,
    stock: p.stock as Record<string, number>,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-black tracking-tight">Stock</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Corregí las unidades de cada talle y guardá. Las ventas descuentan stock solas.
      </p>
      <StockTable rows={rows} />
    </div>
  );
}
