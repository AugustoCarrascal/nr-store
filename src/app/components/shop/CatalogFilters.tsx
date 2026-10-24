import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/types";
import { buildHref, type CatalogParams } from "@/lib/catalog";

type Option = { value: string; count: number };

// Valores distintos de un campo, con cuántos productos tiene cada uno
function options(
  products: Product[],
  key: "category" | "region" | "country" | "team"
): Option[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const v = p[key];
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, "es"));
}

function Level({
  items,
  active,
  hrefFor,
  children,
}: {
  items: Option[];
  active?: string;
  hrefFor: (value: string | undefined) => string;
  children?: ReactNode;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <li key={item.value}>
            {/* Clic en el activo = desmarcarlo */}
            <Link
              href={hrefFor(isActive ? undefined : item.value)}
              className={`flex justify-between rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-lime-400 font-bold text-zinc-950"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{item.value}</span>
              <span className={isActive ? "text-zinc-700" : "text-zinc-600"}>{item.count}</span>
            </Link>
            {isActive && children && (
              <div className="ml-3 mt-1 border-l border-white/10 pl-2">{children}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function CatalogFilters({
  products,
  params,
}: {
  products: Product[];
  params: CatalogParams;
}) {
  const inCategory = products.filter((p) => p.category === params.category);
  const inRegion = inCategory.filter((p) => p.region === params.region);
  const inCountry = inRegion.filter((p) => p.country === params.country);

  const hasFilters = params.category || params.region || params.country || params.team;

  return (
    <nav aria-label="Filtros" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Secciones</h2>
        {hasFilters && (
          <Link href={buildHref({ q: params.q, sort: params.sort }, {})} className="text-xs text-lime-400 hover:underline">
            Limpiar
          </Link>
        )}
      </div>

      <Level
        items={options(products, "category")}
        active={params.category}
        hrefFor={(v) => buildHref(params, { category: v, region: undefined, country: undefined, team: undefined })}
      >
        <Level
          items={options(inCategory, "region")}
          active={params.region}
          hrefFor={(v) => buildHref(params, { region: v, country: undefined, team: undefined })}
        >
          <Level
            items={options(inRegion, "country")}
            active={params.country}
            hrefFor={(v) => buildHref(params, { country: v, team: undefined })}
          >
            <Level
              items={options(inCountry, "team")}
              active={params.team}
              hrefFor={(v) => buildHref(params, { team: v })}
            />
          </Level>
        </Level>
      </Level>
    </nav>
  );
}