import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, LayoutDashboard, LogOut, Package, Plus, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/ventas", label: "Ventas", icon: Receipt },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/stock", label: "Stock", icon: Boxes },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-white/10 bg-zinc-950 p-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <p className="mb-4 text-lg font-black tracking-tighter md:mb-6">
          NR<span className="text-lime-400"> ADMIN</span>
        </p>

        <Link
          href="/admin/ventas/nueva"
          className="mb-4 flex items-center justify-center gap-2 rounded-full bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-lime-300"
        >
          <Plus size={16} /> Registrar venta
        </Link>

        <nav className="flex flex-wrap gap-1 text-sm md:block md:space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5">
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs text-zinc-500 md:mt-6">
          <p className="truncate">{user.email}</p>
          <form action={signOut}>
            <button className="flex items-center gap-2 hover:text-white">
              <LogOut size={14} /> Cerrar sesión
            </button>
          </form>
          <Link href="/" className="block hover:text-white">
            Ver tienda
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
