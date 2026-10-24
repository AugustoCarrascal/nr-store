import type { ShippingProvider } from "./types";

// ESQUELETO: igual que andreani.ts, pero para Zippin (ZIPPIN_API_KEY / ZIPPIN_API_SECRET).
export const zippinProvider: ShippingProvider = {
  name: "zippin",
  async quote() {
    throw new Error("Zippin todavía no está configurado");
  },
};
