---
phase: scaffold
completed_at: 2026-05-04T20:15:00+05:30
project: AllocRail
mvp_complete: true
tests_passing: true
devnet_deployed: false
---

# AllocRail Build Context

## Scaffold Result

AllocRail has been scaffolded as a Next.js + Solana + Anchor workspace using the `scaffold-project` phase and the validated idea context in `.superstack/idea-context.md`.

The current repo is intentionally separate from the parent planning/evidence directory. Git should be initialized inside this `AllocRail/` folder only.

## Selected Architecture

- Next.js app for founder dashboard, checkout demo, allocation rules, and receipt pages.
- Dodo Payments integration for checkout sessions, checkout metadata, subscriptions, usage/credit events, and verified webhooks.
- Solana devnet USDC for stablecoin payout simulation.
- Multi-recipient SPL token transfers for the first MVP.
- Anchor PDA treasury vault as a P1/P2 milestone after the Dodo webhook and devnet USDC path works.

## First MVP Demo

```text
Dodo test checkout
-> signed webhook verification
-> idempotent revenue event
-> allocation rule match from Dodo metadata
-> payout intents
-> Solana devnet USDC transfers
-> public receipt with Dodo event ID and Solana tx signatures
```

## Implementation Notes

- Anchor CLI is available in WSL, not Windows PowerShell.
- WSL toolchain verified: `anchor-cli 0.31.1`, `solana-cli 2.3.13`.
- `anchor build` succeeds in WSL and generated `anchor/target/deploy/vault.so`, `anchor/target/idl/vault.json`, and `anchor/target/types/vault.ts`.
- The generated frontend client program ID has been synced to the WSL Anchor keypair program ID: `3hovPciyFvujfzRdo2LgjiRGXyFo6pkpWhXSbnymGuH5`.
- `npm run codama:js` currently fails from Windows because Codama's ESM config loader does not handle the absolute `D:` path correctly. Use WSL Node later or keep the client synced manually until the app moves to a WSL-native workspace.
- The Next.js scaffold and npm dependencies were created successfully.
- Program build/deploy is optional for the first MVP. The first working demo can use wallet-signed devnet USDC transfers before adding PDA policy enforcement.

## Immediate Next Steps

1. Tighten founder-facing demo flow and submission narrative.
2. Package Milestone 9 submission-quality polish.
3. Decide whether to move from founder-signed direct execution to a policy-vault / multisig treasury.
4. Prepare judge-facing demo, README, and submission copy.

## Build Status

Completed milestones:

- Milestone 1: app/API foundation.
  - Added environment validation.
  - Added `/api/health`.
  - Added typed allocation, Dodo routing metadata, revenue event, payout intent, and receipt models.
  - Added demo allocation rule and demo receipt API at `/api/allocrail/demo`.
  - Added strict Dodo routing metadata parser for later webhook validation.

Current verification:

- `npm run build`: passing.
- `npm run lint`: passing with pre-existing scaffold warnings in wallet/vault components.

Pipeline handoff:

- `pipeline.ingestion_method`: webhook
- `pipeline.data_types`: Dodo payment/subscription/credit events and Solana token transfer receipts
- `pipeline.storage`: in-memory demo for Milestone 1; Postgres planned after webhook path
- `pipeline.backfill_implemented`: false

- Milestone 2: Dodo checkout foundation.
  - Added official `dodopayments` SDK dependency.
  - Added Dodo checkout client wrapper using test/live environment config.
  - Added `POST /api/dodo/checkout` to create real checkout sessions with AllocRail routing metadata.
  - Added `GET /api/dodo/checkout` for non-secret readiness inspection.
  - Added `/checkout/success` return page.
  - Verified against Dodo test mode with a real checkout session returned from the configured product.

Current Dodo checkout verification:

- `GET /api/dodo/checkout`: ready.
- `POST /api/dodo/checkout`: returned a Dodo test checkout URL.

- Milestone 3: verified webhook routing.
  - Added verified `POST /api/dodo/webhook` using the official Dodo webhook signature verifier.
  - Added replay-window checks and idempotency via `webhook-id`.
  - Added in-memory revenue event inbox.
  - Added allocation rule resolution, payout intent generation, and receipt creation on webhook receive.
  - Added `/api/allocrail/events`, `/api/allocrail/payout-intents`, and `/api/allocrail/receipts` for pipeline inspection.
  - Verified a real `payment.succeeded` webhook from Dodo against the public Cloudflare route and stored the routed event locally.

- Milestone 4: founder dashboard.
  - Added dashboard routes for overview, events, payout intents, receipts, and allocation rules.
  - Added a founder-facing dashboard shell with real theme, cluster, wallet, and demo checkout controls.
  - Removed fake dashboard fallback data so pages show real in-memory webhook/store state or explicit empty states.
  - Added responsive receipts rendering and wired the dashboard success flow back to `/dashboard`.
  - Added CSV export for stored revenue events via `/api/allocrail/events?format=csv`.

Current dashboard verification:

- `npm run build`: passing.
- Theme toggle, cluster selector, and wallet UI remain mounted in the dashboard shell.
- Dashboard sidebar demo checkout launches a real Dodo test checkout session.
- Revenue events CSV export is wired to live stored event data.

Current known constraints:

- Milestone 5: Solana devnet settlement with durable persistence.
  - Added server-side Solana devnet USDC settlement execution from payout intents.
  - Added payout-intent lifecycle transitions for `pending_approval`, `approved`, `submitted`, `confirmed`, and `failed`.
  - Added `POST /api/allocrail/payout-intents/[id]/approve` and `POST /api/allocrail/payout-intents/[id]/execute`.
  - Added Supabase persistence for allocation rules, webhook idempotency, revenue events, payout intents, and receipts.
  - Added base durable schema migration and later Milestone 6 / receipt / RLS follow-up migrations under `supabase/migrations/`.
  - Updated dashboard and CSV export paths to read durable state from Supabase.
  - Added Supabase auth pages and dashboard protection for founder access.
  - Verified persisted payout intents, receipts, and confirmed Solana devnet USDC transfers with explorer-linked proof.

Milestone 6: approval controls and safety guardrails.
  - Added founder-managed rule editing and wallet recipient management.
  - Added founder profile settings backed by Supabase auth metadata and founder profile rows.
  - Added `POST /api/allocrail/payout-intents/[id]/reject`.
  - Added founder identity capture for approvals, rejections, and execution gating.
  - Added refund and dispute-aware quarantine logic for open payout routes.
  - Added founder refund request flow from the Revenue Events inbox.
  - Added grouped payout routes by payment ID / receipt / checkout session with route filters.
  - Added Dodo payment receipt, Dodo refund receipt, and AllocRail audit receipt downloads.
  - Added receipt detail document rendering and route-level audit snapshots.
  - Added Supabase founder/workspace RLS and receipt/refund metadata migrations.

Current verification:

- `npm run build`: passing.
- Real Dodo checkout -> verified webhook -> payout intents -> Solana devnet USDC settlement path works.
- Refund request flow is wired to Dodo and blocks open payout intents.
- Dispute / refund hold logic moves matching open intents into `quarantined`.

Current known constraints:

- Wallet binding now exists, but high-risk actions still rely on a bound wallet header match rather than per-action wallet signatures.
- Treasury USDC remains pre-funded in demo mode; refill mode and FX source are explicit founder settings, not a live exchange integration.

Milestone 7: deeper Dodo semantics plus hardening closeout.
  - Added subscription lifecycle coverage for `subscription.active`, `subscription.renewed`, `subscription.cancelled`, and `subscription.updated`.
  - Added credit-event coverage for `credit.added`, `credit.deducted`, and `credit.balance_low`.
  - Simplified founder flow so one billing cycle produces one actionable payout route, with lifecycle and budget events stored as signals.
  - Added duplicate recurring-route suppression for activation/renewal overlap.
  - Added customer-based metadata fallback for Dodo credit events lacking direct references.
  - Added cryptographic treasury operator wallet binding via wallet-standard `signMessage`.
  - Added founder-managed treasury refill mode and FX source configuration persisted in Supabase.
  - Updated payout approvals/rejections/execution to require the bound wallet address.

Current verification:

- `npm run build`: passing.
- Live Supabase schema updated for wallet binding and treasury config.
- Real Dodo subscription lifecycle and `credit.added` events now flow into founder-visible signal handling without creating duplicate or zero-value payout routes.

Milestone 8: AI treasury copilot.
  - Added OpenAI-backed treasury copilot routes using `gpt-4o-mini` only.
  - Added natural-language rule drafting on `/dashboard/rules`.
  - Added queue summary and budget-risk summary actions on `/dashboard`.
  - Added structured JSON outputs and constrained prompts to avoid generic chat behavior.
  - Added local empty-state short-circuits so no token spend happens when the queue or budget view has no meaningful data.
  - Added localhost dev auth bypass for copilot routes only, mirroring local guardrail testing convenience without weakening production auth.

Current verification:

- `npm run build`: passing.
- Live OpenAI key validated with a real `gpt-4o-mini` request.
- Founder-facing Milestone 8 surfaces verified on `/dashboard` and `/dashboard/rules`.
