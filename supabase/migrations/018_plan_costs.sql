create table if not exists public.plan_costs (
  plan_id text primary key,
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  updated_at timestamptz not null default now()
);

alter table public.plan_costs enable row level security;
revoke all on public.plan_costs from anon, authenticated;
grant select, insert, update on public.plan_costs to service_role;
