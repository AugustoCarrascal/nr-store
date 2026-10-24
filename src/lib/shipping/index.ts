import { andreaniProvider } from "./andreani";
import { mockProvider } from "./mock";
import type { ShippingOption, ShippingProvider, ShippingQuoteRequest } from "./types";
import { zippinProvider } from "./zippin";

// Compras desde este monto tienen envío gratis. 0 = desactivado.
export const FREE_SHIPPING_FROM = 0;

const PROVIDERS: Record<string, ShippingProvider> = {
  mock: mockProvider,
  andreani: andreaniProvider,
  zippin: zippinProvider,
};

function getProvider(): ShippingProvider {
  return PROVIDERS[process.env.SHIPPING_PROVIDER ?? "mock"] ?? mockProvider;
}

export async function quoteShipping(req: ShippingQuoteRequest): Promise<ShippingOption[]> {
  const options = await getProvider().quote(req);
  if (FREE_SHIPPING_FROM > 0 && req.subtotal >= FREE_SHIPPING_FROM) {
    return options.map((o) => ({ ...o, price: 0, service: `${o.service} · gratis` }));
  }
  return options;
}
