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

- Anchor CLI was not available during scaffold setup, so `npm run setup` could not complete yet.
- The Next.js scaffold and npm dependencies were created successfully.
- Program build/deploy is optional for the first MVP. The first working demo can use wallet-signed devnet USDC transfers before adding PDA policy enforcement.

## Immediate Next Steps

1. Replace template homepage with AllocRail demo UI.
2. Add Dodo checkout creation API route.
3. Add Dodo webhook verification route with idempotency.
4. Add allocation rule and payout intent models.
5. Add Solana devnet USDC transfer helper.
6. Add receipt page with Dodo event and Solana explorer links.
