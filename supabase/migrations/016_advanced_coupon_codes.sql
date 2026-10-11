alter table public.coupon_codes
  add column if not exists discount_type text not null default 'fixed',
  add column if not exists plan_ids text[] not null default '{}',
  add column if not exists min_amount numeric(12, 2) not null default 0,
  add column if not exists max_discount numeric(12, 2) not null default 0,
  add column if not exists total_limit integer,
  add column if not exists per_user_limit integer,
  add column if not exists used_count integer not null default 0,
  add column if not exists starts_at timestamptz;

alter table public.coupon_codes
  drop constraint if exists coupon_codes_discount_type_check;

alter table public.coupon_codes
  add constraint coupon_codes_discount_type_check
  check (discount_type in ('fixed', 'percentage'));

alter table public.coupon_codes
  drop constraint if exists coupon_codes_amount_check;

alter table public.coupon_codes
  add constraint coupon_codes_amount_check
  check (
    amount > 0
    and (discount_type = 'fixed' or amount <= 100)
  );

alter table public.coupon_codes
  drop constraint if exists coupon_codes_limits_check;

alter table public.coupon_codes
  add constraint coupon_codes_limits_check
  check (
    min_amount >= 0
    and max_discount >= 0
    and (total_limit is null or total_limit > 0)
    and (per_user_limit is null or per_user_limit > 0)
  );

update public.coupon_codes
set plan_ids = case
  when plan_id is null then '{}'
  else array[plan_id]
end
where coalesce(array_length(plan_ids, 1), 0) = 0;

update public.coupon_codes c
set used_count = (
  select count(*)::integer
  from public.orders o
  where o.coupon_code = c.code
);

create index if not exists coupon_codes_plan_ids_idx
  on public.coupon_codes using gin (plan_ids);

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
  v_total_used integer := 0;
  v_user_used integer := 0;
begin
  if p_base_money is null or p_base_money <= 0 then
    raise exception 'invalid_base_price';
  end if;

  if v_code is not null then
    select * into v_coupon
      from public.coupon_codes
     where code = v_code
     for update;

    if not found or not v_coupon.is_active or
       (v_coupon.starts_at is not null and v_coupon.starts_at > now()) or
       (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) or
       (v_coupon.plan_id is not null and v_coupon.plan_id <> p_plan_id) or
       (coalesce(array_length(v_coupon.plan_ids, 1), 0) > 0 and not (p_plan_id = any(v_coupon.plan_ids))) or
       p_base_money < v_coupon.min_amount then
      raise exception 'invalid_coupon';
    end if;

    select count(*)::integer into v_total_used
      from public.orders
     where coupon_code = v_code;

    select count(*)::integer into v_user_used
      from public.orders
     where coupon_code = v_code
       and lower(email) = lower(p_email);

    if (v_coupon.total_limit is not null and v_total_used >= v_coupon.total_limit) or
       (v_coupon.per_user_limit is not null and v_user_used >= v_coupon.per_user_limit) then
      raise exception 'invalid_coupon';
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(p_base_money * v_coupon.amount / 100, 2);
      if v_coupon.max_discount > 0 then
        v_discount := least(v_discount, v_coupon.max_discount);
      end if;
    else
      v_discount := v_coupon.amount;
    end if;

    if v_discount <= 0 or v_discount >= p_base_money then
      raise exception 'coupon_exceeds_price';
    end if;
  end if;

  v_total := p_base_money - v_discount;
  insert into public.orders (
    order_id, email, plan_id, plan_name, base_money, discount_amount,
    coupon_code, money, client_ip, status
  ) values (
    p_order_id, p_email, p_plan_id, p_plan_name, p_base_money, v_discount,
    v_code, v_total, p_client_ip, 'pending'
  );

  if v_code is not null then
    update public.coupon_codes
       set used_count = used_count + 1,
           updated_at = now()
     where code = v_code;
  end if;

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
