export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string; // Clubes | Selecciones | Ropa deportiva
  region: string | null;
  country: string | null;
  team: string | null;
  featured: boolean;
  active: boolean;
  stock: Record<string, number>;
  images: string[];
  video: string | null;

};