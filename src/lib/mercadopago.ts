import { MercadoPagoConfig } from "mercadopago";

export function getMpClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta la variable MP_ACCESS_TOKEN");
  return new MercadoPagoConfig({ accessToken });
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
