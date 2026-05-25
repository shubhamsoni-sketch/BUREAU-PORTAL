alter table public.api_products
  add column if not exists vendor_name text,
  add column if not exists endpoint_url text,
  add column if not exists http_method text not null default 'POST',
  add column if not exists auth_header_name text,
  add column if not exists auth_secret text,
  add column if not exists request_template jsonb,
  add column if not exists sandbox_enabled boolean not null default true,
  add column if not exists live_enabled boolean not null default true;

update public.api_products
set
  name = 'Bureau API',
  description = 'Credit bureau report and score API through the whitelisted gateway.',
  vendor_name = coalesce(vendor_name, 'Bureau API Gateway'),
  http_method = coalesce(nullif(http_method, ''), 'POST'),
  auth_header_name = coalesce(auth_header_name, 'x-api-key'),
  sandbox_enabled = true,
  live_enabled = true,
  updated_at = now()
where code = 'cibil.consumer_score';
