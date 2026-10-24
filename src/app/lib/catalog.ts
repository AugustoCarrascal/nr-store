import type { Product } from "@/types";

export type CatalogParams = {
  category?: string;
  region?: string;
  country?: string;
  team?: string;
  q?: string;
  sort?: string;
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Más nuevos" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name", label: "Nombre A-Z" },
];

// "Múnich" y "munich" deben coincidir
function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function filterProducts(products: Product[], p: CatalogParams) {
  const words = p.q ? normalize(p.q).split(/\s+/).filter(Boolean) : [];

  return products.filter((prod) => {
    if (p.category && prod.category !== p.category) return false;
    if (p.region && prod.region !== p.region) return false;
    if (p.country && prod.country !== p.country) return false;
    if (p.team && prod.team !== p.team) return false;

    if (words.length > 0) {
      const haystack = normalize(
        [prod.name, prod.description, prod.category, prod.region, prod.country, prod.team]
          .filter(Boolean)
          .join(" ")
      );
      return words.every((w) => haystack.includes(w));
    }
    return true;
  });
}

export function sortProducts(products: Product[], sort?: string) {
  const list = [...products]; // copia: nunca mutar el original
  if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return list; // "newest": ya vienen ordenados desde la base
}

// Arma la URL del catálogo mezclando los filtros actuales con los cambios
export function buildHref(
  params: CatalogParams,
  overrides: Partial<Record<keyof CatalogParams, string | undefined>>
) {
  const merged = { ...params, ...overrides };
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `/productos?${qs}` : "/productos";
}

export function cleanParams(p: CatalogParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(p)) {
    if (value) out[key] = value;
  }
  return out;
}