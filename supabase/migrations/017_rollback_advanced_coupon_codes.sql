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

drop index if exists public.coupon_codes_plan_ids_idx;

alter table public.coupon_codes
  drop column if exists discount_type,
  drop column if exists plan_ids,
  drop column if exists min_amount,
  drop column if exists max_discount,
  drop column if exists total_limit,
  drop column if exists per_user_limit,
  drop column if exists used_count,
  drop column if exists starts_at;
