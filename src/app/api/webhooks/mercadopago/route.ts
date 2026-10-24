import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMpClient } from "@/lib/mercadopago";

// Verifica que el aviso lo mandó realmente Mercado Pago (firma HMAC).
function validSignature(req: NextRequest, dataId: string, secret: string) {
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature) return false;

  const parts: Record<string, string> = {};
  for (const p of signature.split(",")) {
    const [k, ...v] = p.trim().split("=");
    parts[k] = v.join("=");
  }
  if (!parts.ts || !parts.v1) return false;

  let manifest = `id:${dataId.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${parts.ts};`;

  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(manifest).digest("hex"));
  const received = Buffer.from(parts.v1);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => null);

  const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // Solo nos interesan los pagos; el resto lo confirmamos y listo.
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret && !validSignature(req, url.searchParams.get("data.id") ?? dataId, secret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    // No confiamos en el cuerpo del aviso: consultamos el pago directo a Mercado Pago.
    const payment = await new Payment(getMpClient()).get({ id: dataId });
    if (payment.status !== "approved" || !payment.external_reference) return NextResponse.json({ ok: true });

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, total, status")
      .eq("id", payment.external_reference)
      .maybeSingle();
    if (!order) return NextResponse.json({ ok: true });

    // El monto pagado tiene que cubrir el total del pedido.
    if ((payment.transaction_amount ?? 0) + 1 < order.total) {
      console.error("webhook: monto menor al total", { order: order.id, paid: payment.transaction_amount, total: order.total });
      return NextResponse.json({ ok: true });
    }

    const { error } = await admin.rpc("mark_order_paid", {
      p_order_id: order.id,
      p_payment_id: String(payment.id),
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("webhook:", err);
    return NextResponse.json({ error: "Error procesando el pago" }, { status: 500 }); // MP reintenta
  }
}
