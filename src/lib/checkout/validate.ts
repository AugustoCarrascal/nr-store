import { createClient } from "@/lib/supabase/server";
import { SIZES } from "@/types";

export type CartLine = { productId: string; size: string; quantity: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nunca confiamos en lo que manda el navegador: validamos forma y límites.
export function parseLines(raw: unknown): CartLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) return null;
  const map = new Map<string, CartLine>();

  for (const r of raw) {
    if (typeof r !== "object" || r === null) return null;
    const { productId, size, quantity } = r as Record<string, unknown>;
    if (typeof productId !== "string" || !UUID.test(productId)) return null;
    if (typeof size !== "string" || !(SIZES as readonly string[]).includes(size)) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;

    const key = `${productId}-${size}`;
    const prev = map.get(key);
    map.set(key, { productId, size, quantity: Math.min(20, (prev?.quantity ?? 0) + quantity) });
  }
  return [...map.values()];
}

export function parsePostalCode(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length > 8) return null;
  const m = raw.match(/(\d{4})/);
  return m ? m[1] : null;
}

// Subtotal calculado con los precios REALES de la base de datos.
export async function getSubtotal(lines: CartLine[]): Promise<number | null> {
  const supabase = await createClient();
  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data } = await supabase.from("products").select("id, price").in("id", ids).eq("active", true);
  if (!data || data.length !== ids.length) return null;

  const price = new Map<string, number>(data.map((p) => [p.id as string, p.price as number]));
  return lines.reduce((acc, l) => acc + (price.get(l.productId) ?? 0) * l.quantity, 0);
}
