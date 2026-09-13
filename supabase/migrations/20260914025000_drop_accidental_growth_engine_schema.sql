-- Remove the accidental Growth Engine / Audience Builder schema.
-- These tables belonged only to the mistakenly-created sidebar section and
-- are intentionally separate from the active Growth Campaigns and CRM data.

drop table if exists public.growth_engine_enrichment_jobs cascade;
drop table if exists public.growth_engine_audience_orders cascade;
drop table if exists public.growth_engine_audience_columns cascade;
drop table if exists public.growth_engine_audience_file_stats cascade;
drop table if exists public.growth_engine_audience_records cascade;
drop table if exists public.growth_engine_audience_imports cascade;
