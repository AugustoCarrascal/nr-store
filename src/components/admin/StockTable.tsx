"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStock } from "@/lib/admin/sales";
import { SIZES } from "@/types";

export type StockRow = { id: string; name: string; team: string | null; active: boolean; stock: Record<string, number> };

function Row({ row }: { row: StockRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(SIZES.map((s) => [s, String(row.stock[s] ?? 0)]))
  );
  const [error, setError] = useState<string | null>(null);

  const dirty = SIZES.some((s) => Number(values[s]) !== (row.stock[s] ?? 0));
  const total = SIZES.reduce((a, s) => a + (Number(values[s]) || 0), 0);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateStock(row.id, Object.fromEntries(SIZES.map((s) => [s, Number(values[s]) || 0])));
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-white/10">
      <td className="p-3">
        <p className="font-semibold">{row.name}</p>
        <p className="text-xs text-zinc-500">
          {row.team ?? "—"}
          {!row.active && " · oculto"}
        </p>
      </td>
      {SIZES.map((s) => {
        const n = Number(values[s]) || 0;
        return (
          <td key={s} className="p-2">
            <input
              type="number"
              min={0}
              step={1}
              aria-label={`${row.name} talle ${s}`}
              value={values[s]}
              onChange={(e) => setValues((prev) => ({ ...prev, [s]: e.target.value }))}
              className={`w-16 rounded-lg border bg-zinc-900 px-2 py-1.5 text-center text-sm outline-none focus:border-lime-400 ${
                n === 0 ? "border-red-400/50 text-red-400" : n <= 2 ? "border-amber-400/50 text-amber-400" : "border-white/15"
              }`}
            />
          </td>
        );
      })}
      <td className="p-3 text-center font-semibold">{total}</td>
      <td className="p-3 text-right">
        <button
          onClick={save}
          disabled={!dirty || pending}
          className="rounded-full bg-lime-400 px-4 py-1.5 text-xs font-bold text-zinc-950 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
    </tr>
  );
}

export default function StockTable({ rows }: { rows: StockRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs text-zinc-500">
          <tr>
            <th className="p-3 font-medium">Producto</th>
            {SIZES.map((s) => (
              <th key={s} className="p-3 text-center font-medium">
                {s}
              </th>
            ))}
            <th className="p-3 text-center font-medium">Total</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={`${r.id}-${SIZES.map((s) => r.stock[s] ?? 0).join("-")}`} row={r} />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-10 text-center text-zinc-500">
                Todavía no hay productos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
