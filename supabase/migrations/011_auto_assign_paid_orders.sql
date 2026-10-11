-- Automatically assign the first available matching card after payment.
-- If inventory is empty, keep the order in delivering so an administrator
-- can complete it later with mark_order_delivered().

create or replace function public.mark_order_paid(
  p_order_id text,
  p_trade_no text,
  p_money numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_card public.card_keys%rowtype;
  v_stock_plan_id text;
begin
  select *
    into v_order
    from public.orders
   where order_id = p_order_id
   for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.money <> p_money then
    raise exception 'amount_mismatch';
  end if;

  if v_order.status = 'delivered' and v_order.card_code is not null then
    return jsonb_build_object(
      'status', 'delivered',
      'card_code', v_order.card_code
    );
  end if;

  if v_order.status not in ('pending', 'paid', 'delivering') then
    return jsonb_build_object(
      'status', v_order.status,
      'card_code', v_order.card_code
    );
  end if;

  v_stock_plan_id := replace(v_order.plan_id, '-', '_');

  select *
    into v_card
    from public.card_keys
   where plan_id = v_stock_plan_id
     and is_used = 0
   order by created_at asc, id asc
   for update skip locked
   limit 1;

  if found then
    update public.card_keys
       set is_used = 1,
           order_id = v_order.order_id
     where id = v_card.id;

    update public.orders
       set status = 'delivered',
           card_code = v_card.card_code,
           provider_trade_no = coalesce(provider_trade_no, p_trade_no),
           provider = 'luckywood',
           paid_at = coalesce(paid_at, now())
     where order_id = v_order.order_id;

    return jsonb_build_object(
      'status', 'delivered',
      'card_code', v_card.card_code
    );
  end if;

  update public.orders
     set status = 'delivering',
         provider_trade_no = coalesce(provider_trade_no, p_trade_no),
         provider = 'luckywood',
         paid_at = coalesce(paid_at, now())
   where order_id = v_order.order_id;

  return jsonb_build_object(
    'status', 'delivering',
    'card_code', null
  );
end;
$$;

revoke all on function public.mark_order_paid(text, text, numeric)
from public, anon, authenticated;

grant execute on function public.mark_order_paid(text, text, numeric)
to service_role;
