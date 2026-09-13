create table if not exists public.lead_finder_run_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.lead_finder_runs(id) on delete cascade,
  master_id uuid references public.lead_finder_master(id) on delete cascade,
  place_id text not null,
  result_type text not null default 'new' check (
    result_type in ('new', 'reused', 'cached', 'refreshed', 'duplicate', 'updated')
  ),
  city text,
  state text,
  keyword text,
  created_at timestamptz not null default now(),
  unique (run_id, place_id)
);

create index if not exists lead_finder_run_results_run_idx
  on public.lead_finder_run_results (run_id, result_type, created_at desc);

create index if not exists lead_finder_run_results_place_idx
  on public.lead_finder_run_results (place_id);

insert into public.lead_finder_run_results (
  run_id,
  master_id,
  place_id,
  result_type,
  city,
  state,
  keyword,
  created_at
)
select
  source_run_id,
  id,
  place_id,
  'new',
  coalesce(searched_city, city),
  state,
  search_keyword,
  coalesce(created_at, now())
from public.lead_finder_master
where source_run_id is not null
  and place_id is not null
on conflict (run_id, place_id) do nothing;
