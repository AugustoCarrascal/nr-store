import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMpClient, getSiteUrl } from "@/lib/mercadopago";
import { quoteShipping } from "@/lib/shipping";
import { getSubtotal, parseLines, parsePostalCode } from "@/lib/checkout/validate";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const lines = parseLines(body.items);
  const postalCode = parsePostalCode(body.customer?.postalCode);
  if (!lines) return NextResponse.json({ error: "INVALID_CART" }, { status: 400 });
  if (!postalCode) return NextResponse.json({ error: "Código postal inválido." }, { status: 400 });

  const name = clip(body.customer?.name, 80);
  const email = clip(body.customer?.email, 120);
  const phone = clip(body.customer?.phone, 30);
  const address = clip(body.customer?.address, 160);

  if (name.length < 2) return NextResponse.json({ error: "Ingresá tu nombre." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 8) return NextResponse.json({ error: "Teléfono inválido." }, { status: 400 });
  if (address.length < 5) return NextResponse.json({ error: "Ingresá la dirección de envío." }, { status: 400 });

  // 1) El envío se vuelve a cotizar en el servidor: el precio que mande el navegador no cuenta.
  const subtotal = await getSubtotal(lines);
  if (subtotal === null) return NextResponse.json({ error: "INVALID_CART" }, { status: 400 });

  let option;
  try {
    const units = lines.reduce((a, l) => a + l.quantity, 0);
    const options = await quoteShipping({ postalCode, units, subtotal });
    option = options.find((o) => o.id === body.shippingOptionId);
  } catch {
    return NextResponse.json({ error: "No pudimos validar el envío. Probá de nuevo." }, { status: 502 });
  }
  if (!option) return NextResponse.json({ error: "Elegí una opción de envío." }, { status: 400 });

  // 2) Pedido "pendiente" en la base (valida stock y congela precio y costo reales).
  const admin = createAdminClient();
  const { data: orderId, error } = await admin.rpc("create_order", {
    p_source: "online",
    p_status: "pending",
    p_channel: "web",
    p_customer_name: name,
    p_customer_email: email,
    p_customer_phone: phone,
    p_postal_code: postalCode,
    p_address: address,
    p_shipping_cost: option.price,
    p_shipping_service: `${option.carrier} · ${option.service}`,
    p_notes: null,
    p_items: lines.map((l) => ({ product_id: l.productId, size: l.size, quantity: l.quantity })),
    p_allow_price_override: false,
  });
  if (error || !orderId) {
    return NextResponse.json({ error: error?.message ?? "No pudimos crear el pedido." }, { status: 409 });
  }

  // 3) Preferencia de Mercado Pago con los precios de la base.
  try {
    const { data: items } = await admin
      .from("order_items")
      .select("product_name, size, quantity, unit_price")
      .eq("order_id", orderId);

    const mpItems = (items ?? []).map((i, idx) => ({
      id: `${orderId}-${idx}`,
      title: `${i.product_name} - Talle ${i.size}`,
      quantity: i.quantity as number,
      unit_price: i.unit_price as number,
      currency_id: "ARS",
    }));
    if (option.price > 0) {
      mpItems.push({
        id: `${orderId}-envio`,
        title: `Envío: ${option.service}`,
        quantity: 1,
        unit_price: option.price,
        currency_id: "ARS",
      });
    }

    const site = getSiteUrl();
    const isPublic = site.startsWith("https://"); // MP no acepta auto_return ni webhooks con localhost
    const back = `${site}/checkout/resultado`;

    const preference = await new Preference(getMpClient()).create({
      body: {
        items: mpItems,
        payer: { name, email, phone: { number: phone } },
        back_urls: { success: back, pending: back, failure: back },
        ...(isPublic ? { auto_return: "approved" as const, notification_url: `${site}/api/webhooks/mercadopago` } : {}),
        external_reference: String(orderId),
        statement_descriptor: "NR STORE",
      },
    });

    if (!preference.init_point) throw new Error("Mercado Pago no devolvió el link de pago");
    return NextResponse.json({ url: preference.init_point, orderId });
  } catch (err) {
    console.error("checkout/mp:", err);
    await admin.rpc("cancel_order", { p_order_id: orderId }); // no dejamos pedidos huérfanos
    return NextResponse.json({ error: "No pudimos iniciar el pago. Probá de nuevo en unos minutos." }, { status: 502 });
  }
}
