-- 添加卡密来源追踪和兑换状态
alter table public.card_keys
  add column if not exists import_source text not null default 'manual'
    check (import_source in ('manual', 'auto'));

alter table public.card_keys
  add column if not exists is_redeemed smallint not null default 0
    check (is_redeemed in (0, 1));

-- 添加索引提升查询性能
create index if not exists card_keys_import_source_idx on public.card_keys(import_source, is_used);
create index if not exists card_keys_redeemed_idx on public.card_keys(is_redeemed);

comment on column public.card_keys.import_source is '导入来源: manual=手动导入, auto=自动导入(在线发放)';
comment on column public.card_keys.is_redeemed is '是否已兑换: 0=未兑换, 1=已兑换';
