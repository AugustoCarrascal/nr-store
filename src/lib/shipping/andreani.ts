import type { ShippingProvider } from "./types";

// ESQUELETO: cuando tengas contrato con Andreani, implementá quote() con su API
// (credenciales en variables de entorno ANDREANI_USER / ANDREANI_PASSWORD, solo servidor)
// y devolvé las opciones con el mismo formato que mock.ts. Nada más cambia en la tienda.
export const andreaniProvider: ShippingProvider = {
  name: "andreani",
  async quote() {
    throw new Error("Andreani todavía no está configurado");
  },
};
