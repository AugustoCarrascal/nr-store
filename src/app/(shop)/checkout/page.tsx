import CheckoutForm from "@/components/shop/CheckoutForm";

export const metadata = { title: "Finalizar compra | NR STORE" };

export default function CheckoutPage() {
  return (
    <section className="py-10">
      <h1 className="mb-8 text-3xl font-black tracking-tight">Finalizar compra</h1>
      <CheckoutForm />
    </section>
  );
}
