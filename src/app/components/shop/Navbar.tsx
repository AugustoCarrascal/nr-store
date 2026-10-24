import Link from "next/link";
import { Search } from "lucide-react";
import CartIcon from "./CartIcon";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 text-xl font-black tracking-tighter">
          NR<span className="text-lime-400"> STORE</span>
        </Link>

        {/* Formulario GET: al enviar, navega a /productos?q=... sin nada de JavaScript */}
        <form action="/productos" method="GET" className="relative mx-auto w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            name="q"
            placeholder="Buscar equipo, país o camiseta…"
            className="w-full rounded-full border border-white/15 bg-zinc-900 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-zinc-500 focus:border-lime-400"
          />
        </form>

        <div className="flex shrink-0 items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/productos" className="hidden transition hover:text-white sm:inline">
            Camisetas
          </Link>
          <CartIcon />
        </div>
      </nav>
    </header>
  );
}