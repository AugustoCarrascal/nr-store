import CartView from "@/components/shop/CartView";

export const metadata = { title: "Carrito | NR STORE" };

export default function CartPage() {
  return (
    <section className="py-10">
      <h1 className="mb-8 text-3xl font-black tracking-tight">Tu carrito</h1>
      <CartView />
    </section>
  );
}
