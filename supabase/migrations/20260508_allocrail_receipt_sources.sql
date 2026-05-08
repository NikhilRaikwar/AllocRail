alter table public.revenue_events
  add column if not exists dodo_refund_id text,
  add column if not exists dodo_refund_status text,
  add column if not exists refund_reason text,
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refunded_at timestamptz;

create index if not exists revenue_events_dodo_payment_id_idx
  on public.revenue_events (dodo_payment_id);

create index if not exists revenue_events_dodo_refund_id_idx
  on public.revenue_events (dodo_refund_id);
