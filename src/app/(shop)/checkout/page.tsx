import Link from "next/link";

export const metadata = { title: "Checkout | NR STORE" };

export default function CheckoutPage() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-3xl font-black tracking-tight">Checkout no configurado</h1>
      <p className="mx-auto mt-4 max-w-lg text-zinc-400">
        El pago en línea todavía no está habilitado. No se realizó ningún cobro.
      </p>
      <Link
        href="/carrito"
        className="mt-8 inline-block rounded-full bg-lime-400 px-8 py-3 font-bold text-zinc-950 transition hover:bg-lime-300"
      >
        Volver al carrito
      </Link>
    </section>
  );
}
