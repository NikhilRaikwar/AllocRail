# AllocRail: Dodo Track Product Plan

## Positioning

**AllocRail is the programmable treasury router for Dodo revenue.**

Every Dodo checkout, subscription, or usage event can automatically become Solana USDC payout intents for contractors, tax reserves, founder distributions, and AI-agent budgets.

This is not another payment collection rail. Dodo already solves global collection. AllocRail solves the painful workflow after revenue lands:

- Who gets paid?
- How much goes to contractors?
- How much should be reserved for tax?
- Which revenue funds AI-agent budgets?
- Which payouts need approval?
- Where is the proof that money moved?

## One-Liner

**AllocRail turns Dodo Payments revenue into programmable Solana treasury actions: contractor escrow, tax reserves, founder splits, and AI-agent budgets in devnet USDC.**

## Why AllocRail Is Different From Broad Payment Rails

| Category | Broad Dodo/Stablecoin Rails | AllocRail |
|---|---|---|
| Core job | Collect payments | Route revenue after payment |
| Dodo usage | Checkout/payment link | Checkout + metadata + webhooks + subscriptions + usage/credit events |
| Solana usage | Accept USDC | PDA treasury vault, allocation policies, USDC payouts, on-chain receipts |
| User pain | "How do I get paid?" | "How do I pay everyone correctly after I get paid?" |
| Hackathon edge | Common idea | More programmable, vertical, and demoable |
| Agent angle | Agent checkout | Agent budget funded by real revenue events |

## Defined User

Primary user:
**A SaaS or AI-tool founder selling globally with 2-10 contractors across India, LATAM, Africa, or Southeast Asia.**

Their current workflow:
1. Customer pays through a billing tool.
2. Founder checks spreadsheet.
3. Founder calculates contractor share, tax reserve, and operating money.
4. Founder pays contractors through Wise, PayPal, bank transfer, or crypto manually.
5. Founder reconciles everything later with screenshots and CSVs.

Pain:
- Reconciliation is manual.
- Contractors wait.
- Founder forgets tax reserves.
- Revenue share is error-prone.
- AI-agent spend is not controlled.
- No single receipt links customer revenue to downstream payouts.

## Why This Fits The Dodo Track

The Dodo track asks for:
- Meaningful Dodo integration.
- Solana + stablecoin utility.
- A defined user.
- Speed, cost, and programmability advantage.
- Early traction or realistic transaction flow.

AllocRail maps cleanly:

| Track Requirement | AllocRail Answer |
|---|---|
| Meaningful Dodo integration | Dodo checkout sessions, verified webhooks, metadata routing, subscriptions, usage events |
| Solana + stablecoins | Devnet USDC treasury vault and payout routing |
| Defined user | SaaS/AI founders with global contractors |
| Real utility | Automates contractor payouts, reserves, agent budgets, receipts |
| Programmability | Allocation rules and on-chain policy enforcement |
| Demoable traction | Show Dodo test payment -> webhook -> USDC payouts -> receipt |

## Product Scope

AllocRail has three product surfaces:

1. **Revenue Inbox**
   - Shows Dodo payment/subscription/usage events.
   - Dodo webhook is the source of truth.
   - Each event has metadata: product, customer, amount, allocation rule.

2. **Allocation Rules**
   - Founder defines split rules.
   - Example: 60% operating, 20% contractor pool, 10% tax reserve, 10% agent budget.
   - Rules can be product-specific or event-specific.

3. **Treasury Router**
   - Creates payout intents.
   - Founder approves or auto-approves small payouts.
   - Sends Solana devnet USDC to recipient wallets.
   - Generates receipt linking Dodo event to Solana transactions.

## MVP Demo Flow

This is the exact 90-second judge demo:

1. Founder lands on AllocRail dashboard.
2. Founder sees treasury balance in devnet USDC.
3. Founder creates an allocation rule:
   - 60% operating wallet
   - 20% contractor wallet
   - 10% tax reserve wallet
   - 10% AI-agent budget wallet
4. Founder clicks **Create Dodo Checkout**.
5. Customer completes Dodo test checkout.
6. Dodo sends `payment.succeeded` webhook.
7. AllocRail verifies webhook signature.
8. AllocRail creates payout intents from the allocation rule.
9. Founder clicks **Approve Route**.
10. AllocRail sends devnet USDC to four wallets.
11. Receipt page shows:
   - Dodo session/payment ID
   - Allocation rule
   - recipient wallets
   - USDC amounts
   - Solana devnet transaction links

The demo story:

> Dodo collected the global payment. AllocRail made the revenue programmable.

## UX Flow

### Landing Page

Headline:
**Turn Dodo revenue into programmable Solana payouts.**

Subheadline:
**For SaaS and AI founders paying global contractors, reserving taxes, and funding autonomous-agent budgets.**

Primary CTA:
**Launch Demo Treasury**

Trust points:
- Dodo webhook source of truth.
- Solana devnet USDC settlement.
- Contractor escrow and tax reserve rules.
- Agent budget wallet with spending cap.

### Onboarding

Step 1: Create Workspace
- Business name
- Founder email
- Connect Solana wallet

Step 2: Connect Dodo Test Mode
- Dodo API key stored server-side
- Dodo webhook key stored server-side
- Dodo product ID

Step 3: Fund Treasury
- Show devnet USDC mint:
  `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Show treasury wallet address
- Show balance

Step 4: Add Recipients
- Contractor
- Tax reserve
- Founder
- Agent budget

Step 5: Create Allocation Rule
- Trigger: `payment.succeeded`
- Split percentages
- Approval threshold

### Dashboard

Top cards:
- Dodo revenue processed
- Pending payout intents
- Completed USDC payouts
- Treasury USDC balance

Main table:
- Revenue event
- Allocation status
- Payout recipients
- Solana signatures

### Receipt Page

Receipt should be the most polished page.

It proves the core product:
- Customer paid through Dodo.
- AllocRail applied the rule.
- Solana settled the downstream payouts.

Receipt fields:
- Dodo event type
- Dodo session ID/payment ID
- Customer email
- Product ID
- Rule name
- Recipients
- USDC amounts
- Solana signatures
- Explorer links

## Dodo Integration Plan

### Must Ship

1. **Checkout Sessions**
   - Founder creates Dodo checkout from AllocRail.
   - Use metadata:
     - `workspace_id`
     - `allocation_rule_id`
     - `demo_run_id`
     - `source=allocrail`

2. **Verified Webhooks**
   - Handle `payment.succeeded`.
   - Handle `subscription.active` if subscription product is available.
   - Verify signatures using the Dodo SDK/webhook key.
   - Store `webhook-id` for idempotency.

3. **Metadata Routing**
   - Pull allocation rule from Dodo checkout metadata.
   - Use Dodo product ID to match default rules.

4. **Subscription Ready**
   - Show subscription event support in UI.
   - Route subscription revenue the same way as one-time payment.

### Strong Add-On

5. **Usage/Credit Event Routing**
   - For AI products, route `credit.deducted` or usage events into an agent-budget ledger.
   - Example: "15% of AI usage revenue funds the Agent Budget wallet."

This is important because Dodo is built for SaaS and AI products with credits, seats, tokens, and usage metrics.

## Solana Integration Plan

### Must Ship

1. Devnet USDC treasury wallet.
2. Recipient associated token accounts.
3. Multi-recipient USDC payout execution.
4. Transaction confirmation and explorer links.
5. Memo/reference tying payout to Dodo event ID.

### Strong Differentiator

Anchor PDA treasury vault:
- PDA owns the USDC vault.
- Allocation policy enforces recipient splits.
- Admin/founder signs approval.
- Program emits payout event.

Anchor instructions:
- `initialize_treasury`
- `set_allocation_policy`
- `deposit_usdc`
- `execute_payout`
- `pause_treasury`

If time is tight, ship backend-signed transfers first, then add PDA vault as a visible "Solana-native mode."

## Agentic Payments Angle

Do not overbuild x402 in the first MVP.

Ship this instead:

**Agent Budget Wallet**
- A recipient type called `agent_budget`.
- Allocation rule can route 5-15% of revenue into the agent budget.
- Dashboard shows:
  - current budget
  - daily spend cap
  - approved agent wallet
  - last funded event

Optional x402 bonus:
- Add one mock paid API endpoint.
- Agent tries to call endpoint.
- Endpoint returns HTTP 402.
- Agent spends from budget wallet.

This is enough to show the track judges that AllocRail is agent-ready without making x402 the whole project.

## MVP Build Priorities

### P0: Needed To Win Dodo Track

1. Dodo checkout session creation.
2. Dodo verified webhook handler.
3. Revenue event inbox.
4. Allocation rule builder.
5. Payout intent generation.
6. Solana devnet USDC transfer.
7. Receipt page linking Dodo + Solana.

### P1: Needed To Differentiate From Broad Payment Rails

1. Product-specific routing using Dodo metadata.
2. Subscription event routing.
3. Tax reserve recipient.
4. Contractor escrow recipient.
5. Agent budget recipient.
6. Before/after comparison page.

### P2: Main Hackathon Polish

1. Anchor PDA treasury vault.
2. Auto-approve threshold.
3. x402 mock spend from agent budget.
4. Public demo mode with seeded data.
5. 2-minute video.

## What Not To Build

Avoid:
- Full payment gateway.
- UPI/card replacement.
- Indian compliance/KYC product.
- Marketplace.
- Full Wise replacement.
- Many sponsor integrations.
- Real custody/mainnet funds.

These make the product too broad and too close to generic payment-rail products.

AllocRail wins by being narrow:

> Dodo revenue in. Programmable Solana treasury out.

## Technical Stack

Frontend:
- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui

Backend:
- Next.js route handlers
- Prisma
- Postgres
- Dodo SDK
- Solana web3.js
- SPL Token

Solana:
- Devnet
- Devnet USDC
- Optional Anchor program

Infrastructure:
- Vercel
- Neon/Supabase Postgres
- Helius devnet RPC if available
- ngrok/Dodo CLI/dashboard for webhook testing

## Database Tables

Minimum:
- `workspaces`
- `recipients`
- `allocation_rules`
- `allocation_rule_lines`
- `dodo_events`
- `revenue_events`
- `payout_intents`
- `solana_transactions`

## Judging Narrative

### Problem

Global SaaS and AI founders can collect revenue, but post-revenue operations are still manual:
- contractor payouts
- reserves
- revenue shares
- agent budgets
- receipts
- reconciliation

### Solution

AllocRail connects Dodo revenue events to Solana stablecoin treasury automation.

### Why Dodo

Dodo is the global billing and checkout source of truth.

### Why Solana

Solana makes downstream treasury movement instant, cheap, programmable, and verifiable.

### Why Now

Stablecoins are becoming real financial infrastructure, and AI/SaaS founders increasingly operate globally with distributed teams and autonomous tools.

## Submission Description

**AllocRail is the programmable treasury router for Dodo Payments.**

Global SaaS and AI founders can accept payments through Dodo, then automatically turn each revenue event into Solana USDC payout intents for contractors, tax reserves, founder distributions, and AI-agent budgets.

AllocRail uses Dodo checkout sessions and verified webhooks as the source of truth, then applies merchant-defined allocation rules to route stablecoin payouts on Solana devnet. Every payout produces a receipt that links the Dodo event to Solana transaction signatures, giving founders and recipients a clear audit trail.

Instead of building another checkout rail, AllocRail solves the painful post-payment workflow: what happens after money lands.

## Demo Script

1. "This is a SaaS founder who just sold a $100 plan through Dodo."
2. "Before AllocRail, they manually calculate contractor payouts, reserve tax, and fund agent tools in a spreadsheet."
3. "In AllocRail, they define a rule once: 60% ops, 20% contractor, 10% tax, 10% agent budget."
4. "Now we create a Dodo checkout."
5. "The customer pays in Dodo test mode."
6. "Dodo sends a signed webhook. AllocRail verifies it."
7. "The rule generates four payout intents."
8. "The founder approves."
9. "Solana devnet USDC settles to all recipients."
10. "This receipt links the Dodo payment to every Solana transaction."

## Success Metrics For Demo

Show these in UI:
- 1 Dodo checkout completed.
- 1 verified webhook processed.
- 4 payout intents generated.
- 4 devnet USDC transfers completed.
- 1 receipt with Dodo + Solana proof.
- Time saved: manual spreadsheet workflow reduced from 30 minutes to 30 seconds.

## Final Build Recommendation

Stick with **AllocRail**.

Do not pivot to broad payments. AllocRail should stay focused on post-revenue treasury automation.

Build the best post-revenue treasury automation product:

**Dodo collects globally. AllocRail routes programmatically. Solana settles instantly.**
