import { NextResponse } from "next/server";
import { quoteShipping } from "@/lib/shipping";
import { getSubtotal, parseLines, parsePostalCode } from "@/lib/checkout/validate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const postalCode = parsePostalCode(body?.postalCode);
  const lines = parseLines(body?.items);

  if (!postalCode) return NextResponse.json({ error: "Ingresá un código postal de 4 dígitos." }, { status: 400 });
  if (!lines) return NextResponse.json({ error: "INVALID_CART" }, { status: 400 });

  const subtotal = await getSubtotal(lines);
  if (subtotal === null) return NextResponse.json({ error: "INVALID_CART" }, { status: 400 });

  try {
    const units = lines.reduce((a, l) => a + l.quantity, 0);
    const options = await quoteShipping({ postalCode, units, subtotal });
    return NextResponse.json({ options, subtotal });
  } catch (err) {
    console.error("shipping:", err);
    return NextResponse.json({ error: "No pudimos cotizar el envío. Probá de nuevo." }, { status: 502 });
  }
}
