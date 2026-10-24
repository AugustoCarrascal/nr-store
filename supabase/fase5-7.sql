-- =====================================================================
-- NR STORE · Fases 5, 6 y 7  (ventas, dashboard, envíos, checkout)
-- Pegar completo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- =====================================================================

alter table orders
  add column if not exists channel text,            -- web | instagram | whatsapp | persona | otro
  add column if not exists notes text,
  add column if not exists shipping_service text,
  add column if not exists paid_at timestamptz;

-- Pedidos viejos ya pagados: les ponemos fecha de pago
update orders set paid_at = created_at where paid_at is null and status in ('paid','shipped');

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_paid_at_idx on orders (paid_at desc);
create index if not exists order_items_order_id_idx on order_items (order_id);
-- Un mismo pago de Mercado Pago no puede registrarse dos veces
create unique index if not exists orders_mp_payment_idx on orders (mp_payment_id) where mp_payment_id is not null;

-- ---------------------------------------------------------------------
-- create_order: crea un pedido completo en UNA transacción.
--  · el precio sale SIEMPRE de la base (salvo venta manual con precio editado)
--  · el costo se "congela" en cada línea (unit_cost)
--  · si status = 'paid' descuenta el stock al instante (venta manual)
--  · si status = 'pending' (checkout web) NO toca el stock hasta que se pague
-- ---------------------------------------------------------------------
create or replace function create_order(
  p_source text, p_status text, p_channel text,
  p_customer_name text, p_customer_email text, p_customer_phone text,
  p_postal_code text, p_address text,
  p_shipping_cost integer, p_shipping_service text, p_notes text,
  p_items jsonb, p_allow_price_override boolean
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product products%rowtype;
  v_cost integer;
  v_qty integer;
  v_size text;
  v_price integer;
  v_available integer;
  v_total integer := 0;
begin
  if p_status not in ('pending','paid') then raise exception 'Estado inválido'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  insert into orders (source, status, channel, customer_name, customer_email, customer_phone,
                      postal_code, address, shipping_cost, shipping_service, notes, total, paid_at)
  values (p_source, p_status, p_channel,
          nullif(trim(p_customer_name), ''), nullif(trim(p_customer_email), ''), nullif(trim(p_customer_phone), ''),
          nullif(trim(p_postal_code), ''), nullif(trim(p_address), ''),
          coalesce(p_shipping_cost, 0), p_shipping_service, nullif(trim(p_notes), ''), 0,
          case when p_status = 'paid' then now() end)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_size := v_item->>'size';
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'Cantidad inválida'; end if;

    select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
    if not found then raise exception 'Un producto del pedido ya no existe'; end if;
    if p_source = 'online' and not v_product.active then
      raise exception '"%" ya no está disponible', v_product.name;
    end if;
    if not jsonb_exists(v_product.stock, v_size) then raise exception 'Talle inválido'; end if;

    v_available := coalesce((v_product.stock->>v_size)::int, 0);
    if v_available < v_qty then
      raise exception 'No hay stock suficiente de "%" talle % (quedan %)', v_product.name, v_size, v_available;
    end if;

    select coalesce(cost_price, 0) into v_cost from product_costs where product_id = v_product.id;
    v_cost := coalesce(v_cost, 0);

    v_price := v_product.price;
    if p_allow_price_override and (v_item ? 'unit_price') then
      v_price := (v_item->>'unit_price')::int;
    end if;
    if v_price < 0 then raise exception 'Precio inválido'; end if;

    insert into order_items (order_id, product_id, product_name, size, quantity, unit_price, unit_cost)
    values (v_order_id, v_product.id, v_product.name, v_size, v_qty, v_price, v_cost);

    if p_status = 'paid' then
      update products
         set stock = jsonb_set(stock, array[v_size], to_jsonb(v_available - v_qty))
       where id = v_product.id;
    end if;

    v_total := v_total + v_price * v_qty;
  end loop;

  update orders set total = v_total + coalesce(p_shipping_cost, 0) where id = v_order_id;
  return v_order_id;
end $$;

-- ---------------------------------------------------------------------
-- mark_order_paid: pasa un pedido pendiente a pagado y descuenta stock.
-- Es idempotente: si Mercado Pago avisa dos veces, la segunda no hace nada.
-- ---------------------------------------------------------------------
create or replace function mark_order_paid(p_order_id uuid, p_payment_id text default null)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item order_items%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_order.status <> 'pending' then return false; end if;

  for v_item in select * from order_items where order_id = p_order_id loop
    if v_item.product_id is not null then
      update products
         set stock = jsonb_set(stock, array[v_item.size],
               to_jsonb(greatest(0, coalesce((stock->>v_item.size)::int, 0) - v_item.quantity)))
       where id = v_item.product_id;
    end if;
  end loop;

  update orders set status = 'paid', mp_payment_id = p_payment_id, paid_at = now() where id = p_order_id;
  return true;
end $$;

-- ---------------------------------------------------------------------
-- cancel_order: cancela y, si ya estaba pagado, DEVUELVE el stock.
-- ---------------------------------------------------------------------
create or replace function cancel_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item order_items%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_order.status = 'cancelled' then return; end if;

  if v_order.status in ('paid','shipped') then
    for v_item in select * from order_items where order_id = p_order_id loop
      if v_item.product_id is not null then
        update products
           set stock = jsonb_set(stock, array[v_item.size],
                 to_jsonb(coalesce((stock->>v_item.size)::int, 0) + v_item.quantity))
         where id = v_item.product_id;
      end if;
    end loop;
  end if;

  update orders set status = 'cancelled' where id = p_order_id;
end $$;

-- ---------------------------------------------------------------------
-- Permisos: los visitantes (anon) NO pueden llamar a estas funciones.
-- ---------------------------------------------------------------------
revoke all on function create_order(text,text,text,text,text,text,text,text,integer,text,text,jsonb,boolean) from public, anon, authenticated;
revoke all on function mark_order_paid(uuid, text) from public, anon, authenticated;
revoke all on function cancel_order(uuid) from public, anon, authenticated;

grant execute on function create_order(text,text,text,text,text,text,text,text,integer,text,text,jsonb,boolean) to authenticated, service_role;
grant execute on function mark_order_paid(uuid, text) to authenticated, service_role;
grant execute on function cancel_order(uuid) to authenticated, service_role;
