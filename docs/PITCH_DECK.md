# AllocRail Pitch Deck

## Slide 1 — Title

**AllocRail**  
Turn Dodo revenue into instant Solana treasury payouts.

Speaker note:
We are not another checkout product. Dodo already solves global billing. AllocRail picks up after revenue lands and automates treasury routing for SaaS and AI founders.

## Slide 2 — Problem

After global revenue arrives, treasury operations are still manual:

- spreadsheets for contractor splits
- manual tax reserve tracking
- refund/dispute payout risk
- cross-border wires and reconciliation friction

Speaker note:
The pain starts after collection, not before it. This is the back-office gap that Dodo does not need to solve and that founders still feel every week.

## Slide 3 — Why Now

- global SaaS and AI founders collect across borders from day one
- Dodo removes checkout and billing friction
- stablecoins make treasury distribution fast and cheap
- founders need tighter control over contractor and agent budgets

Speaker note:
The infrastructure stack is finally mature enough for this. Dodo handles compliant revenue ingestion; Solana handles fast settlement; AllocRail turns that into a treasury workflow.

## Slide 4 — Solution

AllocRail is the programmable treasury layer after Dodo revenue lands.

```text
Dodo revenue in
-> rule-based treasury routing
-> founder approval / holds
-> Solana USDC settlement
-> receipt proof
```

Speaker note:
This is a control system for post-revenue finance ops. It gives founders a route, not just a payment notification.

## Slide 5 — Product Flow

1. Dodo checkout carries routing metadata  
2. Signed webhook arrives and is verified  
3. Allocation rule matches  
4. Payout intents are generated  
5. Founder approves sensitive buckets  
6. Bound wallet signs Solana settlement  
7. Receipt links Dodo event to on-chain proof

Speaker note:
The key part is that settlement is controlled and auditable. Refunds and disputes can still hold a route before money moves.

## Slide 6 — Why Dodo + Solana

### Dodo

- checkout
- subscriptions
- credits
- refunds
- verified billing events

### Solana

- low-cost multi-recipient settlement
- fast execution
- wallet-native control
- explorer-verifiable proof

Speaker note:
Dodo is the source of truth. Solana is the settlement rail. AllocRail is the treasury layer connecting them.

## Slide 7 — What Is Built

- real Dodo checkout creation
- webhook verification + idempotency
- payout-intent generation
- founder dashboard
- wallet binding
- wallet-signed payout execution
- refund/dispute hold logic
- receipt history
- AI treasury copilot

Speaker note:
This is not a mockup. The system already has the end-to-end product path in place.

## Slide 8 — Competitive Wedge

Colosseum Copilot validation:

- stablecoin payment rails are crowded
- generic billing infrastructure is crowded
- “payments” alone is not enough to stand out

AllocRail wedge:

**post-revenue treasury routing for SaaS and AI founders**

Speaker note:
We intentionally do not compete with Dodo on checkout. We extend Dodo into treasury operations.

## Slide 9 — India / Superteam Angle

Built for Indian SaaS founders collecting globally and paying global contractors.

- compliant revenue collection through Dodo
- global stablecoin treasury distribution after revenue lands
- less wire friction, less spreadsheet ops

Speaker note:
This is especially strong in the India track because inbound and outbound workflows are structurally different pain points.

## Slide 10 — Vision

Today:

- contractor payouts
- founder treasury
- tax reserves
- AI-agent budgets

Next:

- pilot users
- deeper receipt proof
- optional policy vault / multisig treasury
- x402-ready agent budgets

Speaker note:
The current product is strong enough to demo now, and the roadmap compounds naturally from this treasury core.

## Slide 11 — Ask / Close

AllocRail helps founders move from:

**payment received**  
to  
**treasury routed, approved, settled, and proven**

Speaker note:
The product story is simple: Dodo revenue comes in, AllocRail routes it, the founder controls it, Solana settles it, and the receipt proves it.
