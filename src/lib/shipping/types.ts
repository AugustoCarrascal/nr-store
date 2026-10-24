export type ShippingQuoteRequest = {
  postalCode: string; // 4 dígitos
  units: number; // cantidad total de prendas
  subtotal: number; // valor de la compra (por si hay envío gratis)
};

export type ShippingOption = {
  id: string; // estable: se vuelve a validar en el servidor al pagar
  carrier: string;
  service: string;
  price: number;
  etaDays: string;
};

// Todo proveedor de logística implementa esta interfaz.
export interface ShippingProvider {
  name: string;
  quote(req: ShippingQuoteRequest): Promise<ShippingOption[]>;
}
