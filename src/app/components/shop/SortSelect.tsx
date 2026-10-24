"use client";

import { useRouter } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/catalog";

export default function SortSelect({
  params,
  current,
}: {
  params: Record<string, string>;
  current: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams(params);
    sp.set("sort", e.target.value);
    router.push(`/productos?${sp.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Ordenar por"
      className="rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-lime-400"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}