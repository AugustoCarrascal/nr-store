export type Product = {
  id: string;
  slug: string; // para la URL: /productos/boca-titular-2026
  name: string;
  description: string;
  price: number; // en pesos
  category: string;
  featured: boolean;
  stock: Record<string, number>; // { S: 3, M: 5, L: 0 }
};