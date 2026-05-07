create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.webhook_deliveries (
  webhook_id text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.allocation_rules (
  id text primary key,
  workspace_id text not null,
  merchant_id text not null,
  name text not null,
  product_tag text not null,
  currency text not null default 'USDC',
  daily_limit_cents bigint not null,
  enabled boolean not null default true,
  buckets jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_events (
  id text primary key,
  dodo_event_id text not null unique,
  dodo_payment_id text,
  dodo_subscription_id text,
  checkout_session_id text,
  type text not null,
  amount_cents bigint not null,
  currency text not null,
  metadata jsonb not null,
  received_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.receipts (
  id text primary key,
  revenue_event_id text not null unique references public.revenue_events(id) on delete cascade,
  allocation_rule_id text not null references public.allocation_rules(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payout_intents (
  id text primary key,
  revenue_event_id text not null references public.revenue_events(id) on delete cascade,
  bucket_kind text not null,
  recipient_wallet text not null,
  amount_cents bigint not null,
  currency text not null default 'USDC',
  requires_approval boolean not null default false,
  status text not null,
  solana_cluster text,
  solana_signature text,
  explorer_url text,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_allocation_rules_lookup
  on public.allocation_rules (workspace_id, merchant_id, product_tag, enabled);

create index if not exists idx_revenue_events_received_at
  on public.revenue_events (received_at desc);

create index if not exists idx_payout_intents_revenue_event
  on public.payout_intents (revenue_event_id);

create index if not exists idx_receipts_created_at
  on public.receipts (created_at desc);

drop trigger if exists allocation_rules_set_updated_at on public.allocation_rules;
create trigger allocation_rules_set_updated_at
before update on public.allocation_rules
for each row execute function public.set_updated_at();

drop trigger if exists payout_intents_set_updated_at on public.payout_intents;
create trigger payout_intents_set_updated_at
before update on public.payout_intents
for each row execute function public.set_updated_at();

insert into public.allocation_rules (
  id,
  workspace_id,
  merchant_id,
  name,
  product_tag,
  currency,
  daily_limit_cents,
  enabled,
  buckets
)
values (
  'rule_ai_subscription_split',
  'wrk_allocrail_demo',
  'mch_india_ai_saas',
  'AI SaaS revenue split',
  'ai-pro-subscription',
  'USDC',
  2500000,
  true,
  '[
    {"kind":"contractor_escrow","label":"Contractor escrow","percentageBps":4500,"recipientWallet":"uzYzrbKEk6w4nwqYsi2R3LwEkdsbkUqa86nidtQg3Xx","requiresApproval":true},
    {"kind":"tax_reserve","label":"Tax reserve","percentageBps":1500,"recipientWallet":"BQsTwJMBqMcd7y9vaaknSpbgXgybcF9vpFzrgRzqHV7q","requiresApproval":false},
    {"kind":"founder_share","label":"Founder share","percentageBps":3000,"recipientWallet":"CHGrH66KAZgZowZaYsJQfUUpbvNi6koqArNetWoECTob","requiresApproval":false},
    {"kind":"agent_budget","label":"AI-agent budget","percentageBps":1000,"recipientWallet":"HL4kKQoby1VeifzWQtX8hJqeW2CZT5ADTM16cHcbUKgi","requiresApproval":true}
  ]'::jsonb
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  merchant_id = excluded.merchant_id,
  name = excluded.name,
  product_tag = excluded.product_tag,
  currency = excluded.currency,
  daily_limit_cents = excluded.daily_limit_cents,
  enabled = excluded.enabled,
  buckets = excluded.buckets,
  updated_at = timezone('utc', now());
