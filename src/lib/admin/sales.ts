"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SIZES } from "@/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHANNELS = ["instagram", "whatsapp", "persona", "otro"];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refresh() {
  revalidatePath("/", "layout");
}

export type ManualSaleInput = {
  channel: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  items: { productId: string; size: string; quantity: number; unitPrice: number }[];
};

export async function createManualSale(input: ManualSaleInput): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida. Volvé a iniciar sesión." };

  if (!CHANNELS.includes(input.channel)) return { error: "Elegí el canal de venta." };
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 30)
    return { error: "Agregá al menos un producto." };

  for (const i of input.items) {
    if (!UUID.test(i.productId)) return { error: "Producto inválido." };
    if (!(SIZES as readonly string[]).includes(i.size)) return { error: "Elegí el talle de cada producto." };
    if (!Number.isInteger(i.quantity) || i.quantity < 1) return { error: "La cantidad debe ser 1 o más." };
    if (!Number.isInteger(i.unitPrice) || i.unitPrice < 0) return { error: "Revisá los precios." };
  }

  const { error } = await supabase.rpc("create_order", {
    p_source: "manual",
    p_status: "paid",
    p_channel: input.channel,
    p_customer_name: input.customerName,
    p_customer_email: null,
    p_customer_phone: input.customerPhone,
    p_postal_code: null,
    p_address: null,
    p_shipping_cost: 0,
    p_shipping_service: null,
    p_notes: input.notes,
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      size: i.size,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    })),
    p_allow_price_override: true,
  });

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function markOrderPaid(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida." };
  const { error } = await supabase.rpc("mark_order_paid", { p_order_id: id, p_payment_id: null });
  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function markOrderShipped(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida." };
  const { error } = await supabase.from("orders").update({ status: "shipped" }).eq("id", id).eq("status", "paid");
  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function cancelOrder(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida." };
  const { error } = await supabase.rpc("cancel_order", { p_order_id: id });
  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function updateStock(productId: string, stock: Record<string, number>): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida." };
  if (!UUID.test(productId)) return { error: "Producto inválido." };

  const clean = Object.fromEntries(
    SIZES.map((s) => [s, Math.max(0, Math.floor(Number(stock[s]) || 0))])
  );
  const { error } = await supabase.from("products").update({ stock: clean }).eq("id", productId);
  if (error) return { error: error.message };
  refresh();
  return {};
}
