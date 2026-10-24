import { createClient } from "@/lib/supabase/server";

export async function getSuggestions() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("region, country, team");

  const uniq = (key: "region" | "country" | "team") =>
    [...new Set((data ?? []).map((r) => r[key]).filter((v): v is string => !!v))].sort((a, b) =>
      a.localeCompare(b, "es")
    );

  return { regions: uniq("region"), countries: uniq("country"), teams: uniq("team") };
}