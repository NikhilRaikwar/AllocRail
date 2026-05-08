alter table public.founder_profiles
  add column if not exists treasury_operator_wallet text,
  add column if not exists wallet_bound_at timestamptz,
  add column if not exists wallet_binding_nonce text,
  add column if not exists wallet_binding_nonce_expires_at timestamptz,
  add column if not exists treasury_refill_mode text not null default 'prefunded_treasury',
  add column if not exists fx_source text not null default 'manual_rate',
  add column if not exists fx_rate_inr_usd numeric(18,6) not null default 83,
  add column if not exists fx_rate_updated_at timestamptz;

update public.founder_profiles
set fx_rate_updated_at = coalesce(fx_rate_updated_at, timezone('utc', now()));
