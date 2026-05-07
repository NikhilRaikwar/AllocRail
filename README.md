# AllocRail

**Dodo revenue -> programmable Solana treasury in one webhook.**

AllocRail is a founder-facing treasury router for SaaS and AI businesses using Dodo Payments. Dodo handles global checkout, subscriptions, usage billing, and verified payment events. AllocRail turns those verified revenue events into payout intents, receipts, and dashboard-visible Solana treasury routes for contractors, tax reserves, founder distributions, and AI-agent budgets.

## Core Flow

```text
Dodo checkout -> verified webhook -> allocation rule -> payout intents -> Solana devnet USDC transfers -> receipt
```

## Current Product Surface

AllocRail now includes a founder dashboard with real pipeline visibility:

- `/dashboard`
- `/dashboard/events`
- `/dashboard/payout-intents`
- `/dashboard/receipts`
- `/dashboard/rules`

The dashboard reads persisted routing state from Supabase when configured. If Supabase is not configured yet, the app falls back to process memory for local development only.

## Who It Is For

Remote-first SaaS and AI founders who collect global revenue but still manage contractor payouts, tax reserves, founder distributions, and agent/tool budgets manually.

## Why It Matters

Global collection is getting easier, but post-revenue operations are still messy:

- spreadsheet-based revenue splits
- slow Wise, PayPal, and bank payouts
- manual tax reserve tracking
- contractor reconciliation
- no receipt connecting customer revenue to downstream payouts
- uncontrolled AI-agent spend

AllocRail uses Dodo webhooks as the revenue source of truth and Solana as the programmable settlement layer.

## MVP Scope

- Dodo checkout session creation with metadata for workspace, product, and allocation rule routing.
- Verified Dodo webhook handler with idempotency.
- Allocation rules for contractor payout, tax reserve, founder share, and AI-agent budget buckets.
- Founder dashboard for revenue events, payout intents, receipts, and allocation rules.
- Solana devnet USDC multi-recipient payout path for Milestone 5.
- Supabase-backed storage for webhook idempotency, revenue events, payout intents, receipts, and allocation rules.
- Receipt page linking Dodo event IDs to settlement state and real Solana transaction signatures.
- Optional Anchor PDA treasury vault for policy-enforced payouts.

## Current API Surface

```text
GET /api/health
GET /api/allocrail/demo
GET /api/allocrail/events
GET /api/allocrail/payout-intents
GET /api/allocrail/receipts
GET /api/dodo/checkout
POST /api/dodo/checkout
GET /api/dodo/webhook
POST /api/dodo/webhook
```

`/api/health` reports non-secret environment readiness for Dodo and Solana configuration.

`/api/allocrail/demo` returns a demo Dodo revenue event, allocation rule, payout intents, and validation checks.

`/api/allocrail/events`, `/api/allocrail/payout-intents`, and `/api/allocrail/receipts` expose the current routing pipeline state after verified webhooks are processed.

`/api/allocrail/events?format=csv` exports the stored revenue events as CSV for dashboard download.

`/api/dodo/checkout` creates a Dodo checkout session in test mode with AllocRail metadata:

```text
workspace_id
merchant_id
rule_id
product_tag
```

## Milestone Status

- Milestone 1: API foundation
- Milestone 2: live Dodo checkout flow
- Milestone 3: verified webhook routing pipeline
- Milestone 4: founder dashboard
- Milestone 5: Solana devnet USDC settlement proof with durable Supabase persistence and founder auth

Next:

- Milestone 6: approval controls and safety guardrails
- Milestone 7: deeper Dodo semantic integration

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind |
| Solana client | `@solana/kit`, wallet-standard |
| Program | Anchor scaffold, planned PDA treasury vault |
| Payments | Dodo Payments checkout, metadata, webhooks |
| Data | Supabase Postgres for rules, events, payout intents, receipts, and webhook idempotency |
| Devnet token | Solana devnet USDC |

Devnet USDC mint:

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env
```

Required Supabase variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Apply the Milestone 5 schema in your Supabase project:

```text
supabase/migrations/20260507_allocrail_milestone_5.sql
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Anchor setup requires the Anchor CLI. The scaffold includes an Anchor workspace under `anchor/`, but program build/deploy is optional for the first Dodo-to-devnet-USDC MVP.

When Supabase is configured, events, payout intents, receipts, rules, and webhook idempotency survive server restarts. Without Supabase, the app falls back to in-memory storage and should be treated as local-only.

## Agentic Engineering Context

This repo was scaffolded from the validated AllocRail idea context using solana.new/Superstack workflow:

```text
find-next-crypto-idea -> .superstack/idea-context.md
scaffold-project      -> reads .superstack/idea-context.md
build-with-claude     -> writes .superstack/build-context.md
deploy-to-mainnet     -> reads .superstack/build-context.md
```

Included context:

- `.superstack/idea-context.md`
- `.superstack/build-context.md`
- `docs/GRANT_APPLICATION.md`
- `docs/AGENTIC_ENGINEERING_EVIDENCE.md`
- `docs/ALLOC_RAIL_BUILD_PLAN.md`
- `docs/ALLOC_RAIL_DODO_TRACK_PLAN.md`

## Links

- Colosseum: https://arena.colosseum.org/projects/explore/allocrail
- X: https://x.com/AllocRail
- GitHub: https://github.com/NikhilRaikwar/AllocRail

## License

MIT
