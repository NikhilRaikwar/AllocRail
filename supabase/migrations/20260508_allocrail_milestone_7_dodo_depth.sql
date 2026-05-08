alter table public.revenue_events
  add column if not exists dodo_customer_id text,
  add column if not exists credit_entitlement_id text,
  add column if not exists credit_entitlement_name text,
  add column if not exists source_reference_id text,
  add column if not exists source_reference_type text,
  add column if not exists event_context jsonb;

create index if not exists revenue_events_customer_id_idx
  on public.revenue_events (dodo_customer_id);

create index if not exists revenue_events_credit_entitlement_id_idx
  on public.revenue_events (credit_entitlement_id);

create index if not exists revenue_events_source_reference_idx
  on public.revenue_events (source_reference_type, source_reference_id);
