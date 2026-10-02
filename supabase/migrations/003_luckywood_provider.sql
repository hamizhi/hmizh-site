-- Run this migration if 002_alipay_payment.sql was already executed.
-- It keeps the existing order/card function but records the actual provider.

create or replace function public.mark_order_paid_and_assign_card(
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
  v_card public.cards%rowtype;
begin
  select *
    into v_order
    from public.orders
   where order_id = p_order_id
   for update;

  if not found then raise exception 'order_not_found'; end if;
  if v_order.money <> p_money then raise exception 'amount_mismatch'; end if;

  if v_order.status = 'paid' then
    return jsonb_build_object('status', 'paid', 'card_code', v_order.card_code);
  end if;

  select *
    into v_card
    from public.cards
   where plan_id = v_order.plan_id
     and is_used = 0
   order by created_at asc
   for update skip locked
   limit 1;

  if not found then raise exception 'out_of_stock'; end if;

  update public.cards
     set is_used = 1, order_id = v_order.order_id
   where id = v_card.id;

  update public.orders
     set status = 'paid',
         card_code = v_card.card_code,
         provider_trade_no = p_trade_no,
         provider = 'luckywood',
         paid_at = now()
   where order_id = v_order.order_id;

  return jsonb_build_object('status', 'paid', 'card_code', v_card.card_code);
end;
$$;

revoke all on function public.mark_order_paid_and_assign_card(text, text, numeric)
from public, anon, authenticated;
