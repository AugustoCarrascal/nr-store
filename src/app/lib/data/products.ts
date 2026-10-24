import type { Product } from "@/types";

export const products: Product[] = [
  {
    id: "1",
    slug: "argentina-titular-2026",
    name: "Argentina Titular 2026",
    description: "Camiseta oficial de la Selección, edición jugador.",
    price: 89900,
    category: "Selecciones",
    featured: true,
    stock: { S: 3, M: 5, L: 4, XL: 2 },
  },
  {
    id: "2",
    slug: "boca-titular-2026",
    name: "Boca Juniors Titular 2026",
    description: "Azul y oro, tela transpirable.",
    price: 79900,
    category: "Clubes",
    featured: true,
    stock: { S: 0, M: 6, L: 3, XL: 1 },
  },
  {
    id: "3",
    slug: "river-titular-2026",
    name: "River Plate Titular 2026",
    description: "La banda roja de siempre.",
    price: 79900,
    category: "Clubes",
    featured: true,
    stock: { S: 2, M: 4, L: 4, XL: 0 },
  },
  {
    id: "4",
    slug: "real-madrid-titular-2026",
    name: "Real Madrid Titular 2026",
    description: "Blanca clásica, escudo bordado.",
    price: 94900,
    category: "Europa",
    featured: false,
    stock: { S: 1, M: 3, L: 5, XL: 2 },
  },
  {
    id: "5",
    slug: "barcelona-titular-2026",
    name: "FC Barcelona Titular 2026",
    description: "Blaugrana con detalles dorados.",
    price: 94900,
    category: "Europa",
    featured: false,
    stock: { S: 0, M: 0, L: 0, XL: 0 },
  },
  {
    id: "6",
    slug: "remera-training-negra",
    name: "Remera Training Negra",
    description: "Dry-fit para entrenar.",
    price: 34900,
    category: "Entrenamiento",
    featured: false,
    stock: { S: 5, M: 8, L: 8, XL: 4 },
  },
];

export function getProducts() {
  return products;
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}