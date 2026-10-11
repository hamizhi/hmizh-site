-- Assign newly imported stock to paid orders that are waiting in delivering.
create or replace function public.assign_waiting_orders(
  p_plan_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_card public.card_keys%rowtype;
  v_stock_plan_id text;
  v_assigned integer := 0;
begin
  v_stock_plan_id := case p_plan_id
    when 'pro-5x' then 'pro_5x'
    when 'pro-10x' then 'pro_20x'
    when 'pro-25x' then 'pro_50x'
    when 'pro' then 'pro_5x'
    else replace(p_plan_id, '-', '_')
  end;

  for v_order in
    select *
      from public.orders
     where status = 'delivering'
       and card_code is null
       and case plan_id
         when 'pro-5x' then 'pro_5x'
         when 'pro-10x' then 'pro_20x'
         when 'pro-25x' then 'pro_50x'
         when 'pro' then 'pro_5x'
         else replace(plan_id, '-', '_')
       end = v_stock_plan_id
     order by coalesce(paid_at, created_at), id
     for update skip locked
  loop
    select *
      into v_card
      from public.card_keys
     where plan_id = v_stock_plan_id
       and is_used = 0
     order by created_at asc, id asc
     for update skip locked
     limit 1;

    exit when not found;

    update public.card_keys
       set is_used = 1,
           order_id = v_order.order_id
     where id = v_card.id;

    update public.orders
       set status = 'delivered',
           card_code = v_card.card_code
     where order_id = v_order.order_id;

    v_assigned := v_assigned + 1;
  end loop;

  return v_assigned;
end;
$$;

revoke all on function public.assign_waiting_orders(text)
from public, anon, authenticated;

grant execute on function public.assign_waiting_orders(text)
to service_role;
