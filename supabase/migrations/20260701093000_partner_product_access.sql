alter table public.partners
  add column if not exists product_access text not null default 'bureau_portal';

alter table public.partners
  drop constraint if exists partners_product_access_check;

alter table public.partners
  add constraint partners_product_access_check
  check (product_access in ('bureau_portal', 'dsa_crm'));

create index if not exists idx_partners_product_access
  on public.partners (product_access);
