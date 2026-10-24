import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import ClearCart from "@/components/shop/ClearCart";
import { STORE } from "@/lib/config";

export const metadata = { title: "Estado de tu compra | NR STORE" };

type SP = { status?: string; collection_status?: string; external_reference?: string };

export default async function ResultadoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = sp.status ?? sp.collection_status ?? "";
  const ref = sp.external_reference?.slice(0, 8).toUpperCase();

  const state = status === "approved" ? "ok" : status === "pending" || status === "in_process" ? "pending" : "fail";

  const wa = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    `Hola NR STORE! Te escribo por mi pedido${ref ? ` #${ref}` : ""}.`
  )}`;

  return (
    <section className="mx-auto max-w-lg py-20 text-center">
      {state !== "fail" && <ClearCart />}

      {state === "ok" && (
        <>
          <CheckCircle2 size={56} className="mx-auto text-lime-400" />
          <h1 className="mt-6 text-3xl font-black tracking-tight">¡Pago recibido!</h1>
          <p className="mt-3 text-zinc-400">
            Gracias por tu compra. Preparamos tu pedido y te contactamos para coordinar el envío.
          </p>
        </>
      )}
      {state === "pending" && (
        <>
          <Clock size={56} className="mx-auto text-amber-400" />
          <h1 className="mt-6 text-3xl font-black tracking-tight">Pago en proceso</h1>
          <p className="mt-3 text-zinc-400">
            Mercado Pago todavía está confirmando tu pago. Cuando se acredite, tu pedido queda confirmado automáticamente.
          </p>
        </>
      )}
      {state === "fail" && (
        <>
          <XCircle size={56} className="mx-auto text-red-400" />
          <h1 className="mt-6 text-3xl font-black tracking-tight">El pago no se completó</h1>
          <p className="mt-3 text-zinc-400">No se te cobró nada. Tu carrito sigue guardado para que lo intentes de nuevo.</p>
        </>
      )}

      {ref && <p className="mt-4 text-sm text-zinc-500">Número de pedido: #{ref}</p>}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={state === "fail" ? "/carrito" : "/productos"} className="rounded-full bg-lime-400 px-6 py-3 font-bold text-zinc-950 hover:bg-lime-300">
          {state === "fail" ? "Volver al carrito" : "Seguir comprando"}
        </Link>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-lime-400">
          Consultar por WhatsApp
        </a>
      </div>
    </section>
  );
}
