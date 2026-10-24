import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number; // solo para mostrar; el servidor recalcula al cobrar
  size: string;
  quantity: number;
  maxQty: number; // stock disponible de ese talle
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.size === newItem.size
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQty) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...newItem, quantity: 1 }] };
        }),

      updateQuantity: (productId, size, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId && i.size === size
                ? { ...i, quantity: Math.min(quantity, i.maxQty) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "nr-store-cart" } // clave en localStorage
  )
);