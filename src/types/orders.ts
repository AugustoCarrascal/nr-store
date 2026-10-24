export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number; // precio de venta congelado
  unit_cost: number; // costo congelado
};

export type Order = {
  id: string;
  created_at: string;
  paid_at: string | null;
  source: "online" | "manual";
  status: OrderStatus;
  channel: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  postal_code: string | null;
  address: string | null;
  shipping_cost: number;
  shipping_service: string | null;
  notes: string | null;
  total: number;
  mp_payment_id: string | null;
  order_items: OrderItem[];
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  shipped: "Enviado / entregado",
  cancelled: "Cancelado",
};

export const CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "persona", label: "En persona" },
  { value: "otro", label: "Otro" },
] as const;

export const CHANNEL_LABELS: Record<string, string> = {
  web: "Web",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  persona: "En persona",
  otro: "Otro",
};
