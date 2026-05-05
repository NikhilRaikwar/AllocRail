---
phase: scaffold
completed_at: 2026-05-04T20:15:00+05:30
project: AllocRail
mvp_complete: false
tests_passing: false
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

1. Add Dodo checkout creation API route.
2. Add Dodo webhook verification route with idempotency.
3. Add Solana devnet USDC transfer helper.
4. Add receipt page with Dodo event and Solana explorer links.

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
