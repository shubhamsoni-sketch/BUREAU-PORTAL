update public.invoice_settings
set
  company_name = 'Credit Trust Financial Services',
  logo_url = '/assets/images/credit-trust-logo.png',
  updated_at = now()
where not (company_name ilike '%Credit Trust%')
   or logo_url is distinct from '/assets/images/credit-trust-logo.png';
