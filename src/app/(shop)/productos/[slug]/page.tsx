import { notFound } from "next/navigation";
import { Shirt } from "lucide-react";
import AddToCart from "@/components/shop/AddToCart";
import { getProductBySlug } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };


export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product ? `${product.name} | NR STORE` : "Producto no encontrado" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <section className="grid gap-10 py-10 md:grid-cols-2">
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-950">
        <Shirt size={160} strokeWidth={0.75} className="text-zinc-600" />
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">{product.category}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h1>
        </div>
        <p className="text-3xl font-bold text-lime-400">{formatPrice(product.price)}</p>
        <p className="text-zinc-400">{product.description}</p>
        <AddToCart product={product} />
      </div>
    </section>
  );
}