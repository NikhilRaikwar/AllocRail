# AllocRail Submission Copy

## One-liner

AllocRail turns Dodo revenue into founder-controlled Solana treasury payouts for contractors, reserves, founder distributions, and AI-agent budgets.

## Short Description

AllocRail is the programmable treasury layer after Dodo revenue lands. Dodo handles global checkout, subscriptions, credits, and verified billing events. AllocRail turns those verified revenue events into payout intents, founder approvals, wallet-signed Solana USDC settlement, and receipt-backed proof.

## Full Description

Global SaaS and AI founders can finally collect revenue more easily, but post-revenue treasury work is still broken. After the payment succeeds, founders still move to spreadsheets, manual tax tracking, contractor reconciliation, and slow cross-border payouts.

AllocRail fixes that gap.

It uses Dodo Payments as the verified revenue source of truth. Every Dodo checkout carries treasury-routing metadata. When the signed webhook arrives, AllocRail verifies it, enforces idempotency, matches it to a founder-defined allocation rule, and generates payout intents across multiple buckets such as contractor payouts, tax reserves, founder treasury, and AI-agent budgets.

Those intents do not blindly execute. Founders can approve, reject, or hold routes. Refund and dispute flows can quarantine unsettled routes before capital moves. Once approved, the founder’s bound treasury wallet signs execution and Solana settles the route in USDC. AllocRail then records a receipt that links the original Dodo event to downstream Solana proof.

This makes AllocRail a treasury operations product, not another checkout product.

## Problem

- revenue collection is solved faster than treasury distribution
- global founders still rely on spreadsheets after payment lands
- refunds/disputes create payout risk if routes execute too early
- contractor and reserve routing is fragmented across tools
- there is no clean proof chain from customer payment to downstream treasury movement

## Why Dodo

Dodo is not a decorative integration in this project. It is the upstream system of record for:

- checkout sessions
- subscriptions
- credit events
- refunds
- disputes
- receipt source linkage

AllocRail extends Dodo after revenue lands.

## Why Solana

Solana is used where treasury routing actually benefits:

- fast multi-recipient settlement
- low-cost repeated operations
- programmable treasury logic
- wallet-native execution
- explorer-verifiable proof

## Who It Is For

Indian and global SaaS / AI founders paying distributed contractors and teams after collecting revenue through Dodo Payments.

## Key Features

- Dodo checkout session creation with routing metadata
- verified webhook ingestion with idempotency
- payout intent generation from allocation rules
- founder approval / reject / execute controls
- refund and dispute-aware route holds
- wallet binding for treasury operator security
- wallet-signed Solana USDC payout execution
- receipt history linking Dodo events to Solana proof
- AI treasury copilot for rule drafting and queue summaries

## Demo Flow

```text
Dodo checkout
-> verified webhook
-> allocation rule match
-> payout intents
-> founder approval / hold logic
-> wallet-signed Solana settlement
-> audit receipt
```

## Why This Can Win

Colosseum Copilot validation shows stablecoin payment rails are crowded. Similar projects cluster around generic payment infrastructure and billing automation. AllocRail is stronger when presented as:

**post-revenue treasury routing for SaaS and AI founders**

That is the real wedge:

- Dodo revenue in
- founder controls in the middle
- Solana settlement out

## Traction / Proof Framing

- working founder dashboard
- seeded demo treasury state for judge-first product review
- Dodo checkout and webhook flow
- Solana devnet USDC settlement path
- receipt proof surface
- founder validation quote from an India-based AI SaaS operator

## Suggested Submission Title

AllocRail - Turn Dodo Revenue into Instant Solana Treasury Payouts
