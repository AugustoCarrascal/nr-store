import type { ShippingProvider } from "./types";

// TARIFAS DE EJEMPLO: editá los precios a gusto hasta conectar un proveedor real.
const ZONES = [
  { from: 1000, to: 1499, zone: "CABA", price: 4200, eta: "1 a 3 días hábiles" },
  { from: 1500, to: 1999, zone: "Gran Buenos Aires", price: 5200, eta: "2 a 4 días hábiles" },
  { from: 2000, to: 2999, zone: "Santa Fe / Litoral", price: 7500, eta: "3 a 5 días hábiles" },
  { from: 5000, to: 5999, zone: "Córdoba / Cuyo", price: 7800, eta: "3 a 6 días hábiles" },
  { from: 6000, to: 8999, zone: "Interior de Buenos Aires", price: 6800, eta: "3 a 5 días hábiles" },
];
const DEFAULT_ZONE = { zone: "Resto del país", price: 9500, eta: "4 a 8 días hábiles" };
const BRANCH_DISCOUNT = 0.7; // el retiro en sucursal sale 30% menos

export const mockProvider: ShippingProvider = {
  name: "mock",
  async quote({ postalCode }) {
    const cp = Number(postalCode);
    const z = ZONES.find((x) => cp >= x.from && cp <= x.to) ?? DEFAULT_ZONE;
    return [
      { id: "mock-home", carrier: "Envío", service: `A domicilio (${z.zone})`, price: z.price, etaDays: z.eta },
      {
        id: "mock-branch",
        carrier: "Envío",
        service: `Retiro en sucursal (${z.zone})`,
        price: Math.round((z.price * BRANCH_DISCOUNT) / 100) * 100,
        etaDays: z.eta,
      },
    ];
  },
};
