"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SIZES } from "@/types";
import { slugify } from "@/lib/utils";

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  region: string;
  country: string;
  team: string;
  featured: boolean;
  active: boolean;
  stock: Record<string, number>;
  images: string[];
  video: string | null;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveProduct(input: ProductInput, id?: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida. Volvé a iniciar sesión." };

  const name = input.name.trim();
  if (!name) return { error: "El nombre es obligatorio." };
  if (!Number.isInteger(input.price) || input.price < 0) return { error: "El precio no es válido." };
  if (!Number.isInteger(input.cost) || input.cost < 0) return { error: "El costo no es válido." };

  const stock = Object.fromEntries(
    SIZES.map((s) => [s, Math.max(0, Math.floor(Number(input.stock[s]) || 0))])
  );

  const row = {
    name,
    description: input.description.trim(),
    price: input.price,
    category: input.category,
    region: input.region.trim() || null,
    country: input.country.trim() || null,
    team: input.team.trim() || null,
    featured: input.featured,
    active: input.active,
    stock,
    images: input.images.slice(0, 4),
    video: input.video,
  };

  let productId = id;

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    let slug = slugify(name);
    let res = await supabase.from("products").insert({ ...row, slug }).select("id").single();
    if (res.error?.code === "23505") {
      // slug repetido: le agregamos un sufijo
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      res = await supabase.from("products").insert({ ...row, slug }).select("id").single();
    }
    if (res.error) return { error: res.error.message };
    productId = res.data.id;
  }

  const { error: costError } = await supabase
    .from("product_costs")
    .upsert({ product_id: productId, cost_price: input.cost });
  if (costError) return { error: costError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}