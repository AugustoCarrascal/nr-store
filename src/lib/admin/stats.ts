export type StatItem = { product_name: string; quantity: number; unit_price: number; unit_cost: number };
export type StatOrder = {
  id: string;
  paid_at: string;
  source: string;
  shipping_cost: number;
  order_items: StatItem[];
};

export type Summary = {
  orders: number;
  units: number;
  revenue: number; // ventas de productos (sin envío)
  cost: number;
  profit: number;
  margin: number; // %
  online: number; // ingresos por canal
  manual: number;
};

export function summarize(orders: StatOrder[]): Summary {
  let units = 0,
    revenue = 0,
    cost = 0,
    online = 0,
    manual = 0;

  for (const o of orders) {
    let orderRevenue = 0;
    for (const i of o.order_items) {
      units += i.quantity;
      orderRevenue += i.quantity * i.unit_price;
      cost += i.quantity * i.unit_cost;
    }
    revenue += orderRevenue;
    if (o.source === "online") online += orderRevenue;
    else manual += orderRevenue;
  }

  const profit = revenue - cost;
  return {
    orders: orders.length,
    units,
    revenue,
    cost,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    online,
    manual,
  };
}

export function topProducts(orders: StatOrder[], limit = 5) {
  const map = new Map<string, { name: string; units: number; revenue: number; profit: number }>();
  for (const o of orders) {
    for (const i of o.order_items) {
      const row = map.get(i.product_name) ?? { name: i.product_name, units: 0, revenue: 0, profit: 0 };
      row.units += i.quantity;
      row.revenue += i.quantity * i.unit_price;
      row.profit += i.quantity * (i.unit_price - i.unit_cost);
      map.set(i.product_name, row);
    }
  }
  return [...map.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, limit);
}

export function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
