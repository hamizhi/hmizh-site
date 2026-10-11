create table if not exists public.coupon_codes (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,32}$'),
  amount numeric(12, 2) not null check (amount > 0),
  plan_id text,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coupon_codes enable row level security;
revoke all on public.coupon_codes from anon, authenticated;
grant select, insert, update on public.coupon_codes to service_role;

alter table public.orders
  add column if not exists base_money numeric(12, 2),
  add column if not exists discount_amount numeric(12, 2) not null default 0,
  add column if not exists coupon_code text;

create index if not exists orders_coupon_code_idx on public.orders(coupon_code)
  where coupon_code is not null;

create or replace function public.create_order_with_coupon(
  p_order_id text,
  p_email text,
  p_plan_id text,
  p_plan_name text,
  p_base_money numeric,
  p_client_ip text,
  p_coupon_code text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_coupon public.coupon_codes%rowtype;
  v_code text := nullif(upper(btrim(p_coupon_code)), '');
  v_discount numeric(12, 2) := 0;
  v_total numeric(12, 2);
begin
  if p_base_money is null or p_base_money <= 0 then
    raise exception 'invalid_base_price';
  end if;

  if v_code is not null then
    select * into v_coupon
      from public.coupon_codes
     where code = v_code
     for share;

    if not found or not v_coupon.is_active or
       (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) or
       (v_coupon.plan_id is not null and v_coupon.plan_id <> p_plan_id) then
      raise exception 'invalid_coupon';
    end if;

    if v_coupon.amount >= p_base_money then
      raise exception 'coupon_exceeds_price';
    end if;
    v_discount := v_coupon.amount;
  end if;

  v_total := p_base_money - v_discount;
  insert into public.orders (
    order_id, email, plan_id, plan_name, base_money, discount_amount,
    coupon_code, money, client_ip, status
  ) values (
    p_order_id, p_email, p_plan_id, p_plan_name, p_base_money, v_discount,
    v_code, v_total, p_client_ip, 'pending'
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'money', v_total,
    'discount_amount', v_discount,
    'coupon_code', v_code
  );
end;
$$;

revoke all on function public.create_order_with_coupon(text, text, text, text, numeric, text, text)
from public, anon, authenticated;
grant execute on function public.create_order_with_coupon(text, text, text, text, numeric, text, text)
to service_role;
