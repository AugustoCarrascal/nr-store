"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh(); // fuerza al servidor a leer la sesión nueva
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-8"
      >
        <h1 className="text-2xl font-black tracking-tighter">
          NR<span className="text-lime-400"> ADMIN</span>
        </h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-lime-400"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-lime-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-lime-400 py-2.5 font-bold text-zinc-950 hover:bg-lime-300 disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}