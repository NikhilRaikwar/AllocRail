---
phase: idea
completed_at: 2026-05-04T00:00:00+05:30
project: AllocRail
---

# AllocRail Idea Context

## Chosen Idea

AllocRail is a programmable treasury router for SaaS and AI founders using Dodo Payments.

One-liner:

> AllocRail turns Dodo revenue into Solana USDC treasury routing for contractor payouts, tax reserves, founder shares, and agent budgets.

## Target User

Remote-first SaaS and AI founders collecting global revenue through Dodo Payments while paying contractors, reserving taxes, and funding agent/tool budgets manually.

## Problem

Global founders can collect revenue, but post-revenue operations are still manual:

- spreadsheet-based revenue splits
- delayed Wise/PayPal/bank payouts
- manual tax reserve tracking
- contractor reconciliation
- no clean receipt linking customer revenue to downstream payouts
- no controlled budget wallet for AI agents/tools

## Solution

Dodo handles checkout, subscriptions, usage billing, and verified payment events. AllocRail listens to Dodo webhooks, applies merchant-defined allocation rules, creates payout intents, and routes Solana devnet USDC to recipients.

Core demo:

```text
Dodo test checkout -> verified webhook -> allocation rule -> payout intents -> Solana devnet USDC transfers -> receipt linking Dodo event to Solana signatures
```

## Why Solana

Solana is used for fast, low-cost, programmable settlement and verifiable payout receipts. The first MVP uses devnet USDC and multi-recipient SPL token transfers. The stronger version includes an Anchor PDA treasury vault for policy-enforced payouts.

Devnet USDC mint:

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## Dodo Integration

Required MVP integrations:

- Dodo checkout sessions
- Dodo checkout metadata for workspace/rule/product routing
- verified Dodo webhooks
- `payment.succeeded`
- `subscription.active` and `subscription.renewed`
- optional usage/credit events for AI products

## MVP Milestones

1. Scaffold Next.js app, database schema, Dodo/Solana environment setup, and health check.
2. Implement Dodo checkout session creation with metadata.
3. Implement verified Dodo webhook handler with idempotency and revenue inbox.
4. Build allocation rules, payout intents, and Solana devnet USDC multi-recipient transfers.
5. Polish receipt page, demo flow, optional Anchor PDA treasury vault, and submit to Colosseum Frontier.

## Links

- GitHub: https://github.com/NikhilRaikwar/AllocRail
- Colosseum: https://arena.colosseum.org/projects/explore/allocrail
- X: https://x.com/AllocRail

