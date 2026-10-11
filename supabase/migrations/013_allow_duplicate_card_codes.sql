-- Allow an administrator to force-import the same card code as a separate
-- inventory row. Each row still has its own is_used/order_id state, so the
-- normal payment and manual delivery functions can consume duplicate rows one
-- at a time.
alter table public.card_keys
  drop constraint if exists cards_card_code_key;

create index if not exists card_keys_card_code_idx
  on public.card_keys(card_code);
