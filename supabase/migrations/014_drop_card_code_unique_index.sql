-- card_code uniqueness is enforced by a table constraint, not a standalone index.
alter table public.card_keys
  drop constraint if exists cards_card_code_key;

create index if not exists card_keys_card_code_idx
  on public.card_keys(card_code);
