# AllocRail

**The programmable treasury layer after Dodo revenue lands.**

AllocRail is a founder-facing treasury router for SaaS and AI businesses using Dodo Payments. Dodo handles global checkout, subscriptions, usage billing, refunds, and verified payment events. AllocRail turns those verified revenue events into payout intents, approvals, audit receipts, and dashboard-visible Solana treasury routes for contractors, tax reserves, founder distributions, and AI-agent budgets.

## What Judges Should See

```text
Dodo revenue comes in.
AllocRail splits it.
Founder approves it.
Solana settles it.
Receipt proves it.
```

Current demo artifacts:

- landscape video: `allocrail-demo-video/out/allocrail-demo.mp4`
- vertical social cut: `allocrail-demo-video/out/allocrail-social.mp4`
- demo script: `docs/MILESTONE_9_DEMO_SCRIPT.md`
- submission copy: `docs/SUBMISSION_COPY.md`

## Core Flow

```text
Dodo checkout -> verified webhook -> allocation rule -> payout intents -> founder approval / hold logic -> Solana devnet USDC transfers -> audit receipt
```

## Current Product Surface

AllocRail now includes a founder dashboard with real pipeline visibility:

- `/dashboard`
- `/dashboard/events`
- `/dashboard/payout-intents`
- `/dashboard/receipts`
- `/dashboard/rules`
- `/dashboard/settings`

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
- Founder profile settings backed by Supabase auth metadata and founder profile records.
- Cryptographically verified treasury operator wallet binding for founder approval and execution controls.
- Founder-managed treasury refill mode and FX source configuration with explicit INR/USD routing basis.
- Refund request flow from the Revenue Events inbox with Dodo refund receipt linkage.
- Quarantine / hold logic for refund and dispute events before unsettled Solana payout execution.
- Grouped payout routes by payment ID with route-level filtering for ops review.
- AI treasury copilot for rule drafting, queue summaries, and budget-risk summaries.
- Optional Anchor PDA treasury vault for policy-enforced payouts.

## Current API Surface

```text
GET /api/health
GET /api/allocrail/demo
GET /api/allocrail/events
GET /api/allocrail/payout-intents
GET /api/allocrail/receipts
GET /api/allocrail/payments/[paymentId]/receipt
POST /api/allocrail/payments/[paymentId]/refund
GET /api/allocrail/refunds/[refundId]/receipt
POST /api/allocrail/copilot/rule-draft
POST /api/allocrail/copilot/reconcile-summary
POST /api/allocrail/copilot/budget-summary
GET /api/dodo/checkout
POST /api/dodo/checkout
GET /api/dodo/webhook
POST /api/dodo/webhook
```

`/api/health` reports non-secret environment readiness for Dodo and Solana configuration.

`/api/allocrail/demo` returns a demo Dodo revenue event, allocation rule, payout intents, and validation checks.

`/api/allocrail/events`, `/api/allocrail/payout-intents`, and `/api/allocrail/receipts` expose the current routing pipeline state after verified webhooks are processed.

`/api/allocrail/payments/[paymentId]/refund` creates a Dodo refund request and immediately holds open payout intents for that payment route.

`/api/allocrail/payments/[paymentId]/receipt` and `/api/allocrail/refunds/[refundId]/receipt` proxy live Dodo payment/refund PDFs for founder download.

`/api/allocrail/events?format=csv` exports the stored revenue events as CSV for dashboard download.

`/api/allocrail/copilot/rule-draft`, `/api/allocrail/copilot/reconcile-summary`, and `/api/allocrail/copilot/budget-summary` power the Milestone 8 copilot features and are constrained to `gpt-4o-mini` structured outputs.

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
- Milestone 6: approval controls and safety guardrails
- Milestone 7: deeper Dodo semantic integration for subscriptions and credit events
- Milestone 8: AI treasury copilot with rule drafting, queue summaries, and budget guard
- Production hardening: verified wallet-to-founder binding and treasury refill / FX source architecture

Next:

- Milestone 9: submission polish, trust layer, and demo hardening

## Milestone 9 Direction

Milestone 9 is about making the project judge-ready:

- simplify the founder story to one actionable payout route per billing cycle
- foreground Dodo as the verified revenue source
- foreground Solana as the programmable settlement rail
- de-emphasize generic checkout or subscription-infra positioning
- show proof through a crisp dashboard-to-settlement-to-receipt demo

Colosseum Copilot research confirms the crowded part of the market is generic stablecoin checkout and payment-infrastructure tooling. AllocRail's strongest wedge is the post-revenue treasury layer for SaaS and AI founders.

## Demo Video Artifact

The current Milestone 9 video cut lives at:

```text
allocrail-demo-video/out/allocrail-demo.mp4
```

It is a landscape-first product demo built in Remotion and centered on:

```text
Dodo payment -> payout route -> founder approval -> Solana settlement -> receipt proof
```

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
OPENAI_API_KEY
OPENAI_BASE_URL
```

Apply the current Supabase migrations in order:

```text
supabase/migrations/20260507_allocrail_milestone_6.sql
supabase/migrations/20260508_allocrail_milestone_7_dodo_depth.sql
supabase/migrations/20260508_allocrail_receipt_sources.sql
supabase/migrations/20260508_allocrail_founder_rls.sql
supabase/migrations/20260509_allocrail_wallet_binding_treasury_config.sql
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

When Supabase is configured, events, payout intents, receipts, founder profiles, rules, refund metadata, and webhook idempotency survive server restarts. Without Supabase, the app falls back to in-memory storage and should be treated as local-only.

## Current Architecture Notes

- Dodo is the verified revenue source of truth.
- Solana devnet USDC is the programmable payout rail.
- Founder approval and refund/dispute holds now sit between revenue ingestion and on-chain execution.
- Founder approval, rejection, and execution now require a bound treasury operator wallet.
- Current settlement execution is wallet-signed by the bound founder wallet, not an env-funded treasury signer.
- Treasury refill mode and FX source are now explicit founder-managed settings rather than hidden routing assumptions.
- Milestone 8 copilot calls are constrained to `gpt-4o-mini` and use structured JSON outputs only.

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
