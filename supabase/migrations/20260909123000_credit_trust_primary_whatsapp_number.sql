do $$
begin
  if to_regclass('public.marketing_campaigns') is not null then
    alter table public.marketing_campaigns
      alter column whatsapp_number set default '8109276589';
  end if;

  if to_regclass('public.meta_ad_accounts') is not null then
    alter table public.meta_ad_accounts
      alter column whatsapp_display_number set default '9893332647';

    insert into public.meta_ad_accounts (
      business_id,
      ad_account_id,
      page_id,
      whatsapp_business_account_id,
      whatsapp_display_number,
      status
    )
    values (
      '2346573565736203',
      '2280549672702394',
      '1277474035438343',
      '1410697734305817',
      '9893332647',
      'active'
    )
    on conflict (ad_account_id) do update
      set business_id = excluded.business_id,
          page_id = excluded.page_id,
          whatsapp_business_account_id = excluded.whatsapp_business_account_id,
          whatsapp_display_number = excluded.whatsapp_display_number,
          status = 'active';
  end if;
end $$;
