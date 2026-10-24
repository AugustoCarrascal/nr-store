import { createClient } from "@supabase/supabase-js";

// Cliente con la clave service_role: se salta RLS. SOLO se usa en rutas del servidor
// (checkout y webhook). Nunca importarlo desde un componente "use client".
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta la variable SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
