import Footer from "@/components/shop/Footer";
import Navbar from "@/components/shop/Navbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4">{children}</main>
      <Footer />
    </>
  );
}
