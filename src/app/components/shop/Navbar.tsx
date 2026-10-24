import Link from "next/link";
import CartIcon from "./CartIcon";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-black tracking-tighter">
          NR<span className="text-lime-400"> STORE</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/productos" className="transition hover:text-white">
            Camisetas
          </Link>
          <CartIcon />
        </div>
      </nav>
    </header>
  );
}