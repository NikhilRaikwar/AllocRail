# AllocRail Build Plan

Project name: **AllocRail**

Tagline:
Programmable revenue allocation rails for Dodo Payments and Solana stablecoins.

## Why This Name

I checked candidate names with Colosseum Copilot project search. **AllocRail** had no exact collision in the Colosseum project dataset. Its closest weak matches were unrelated names such as ALLOY and Raile. I also ran a quick web search and did not find a direct product/project collision for "AllocRail".

Caveat: this is not a legal trademark search. Before final submission, check domain, GitHub org/repo, X handle, and trademark databases. For hackathon use, **AllocRail** is clean enough.

## Product Definition

AllocRail is a treasury router for SaaS and AI businesses.

When revenue lands through Dodo Payments, AllocRail listens to verified Dodo webhooks, records the revenue event, and routes a configured amount of devnet USDC through Solana to treasury buckets such as:

- Contractor payouts
- Vendor spend
- Tax reserve
- Founder distribution
- Agent budget
- Operating wallet

For the hackathon demo, Dodo runs in **test mode** and Solana runs on **devnet** using Circle Devnet USDC.

## Core Demo

The primary demo should show this flow end to end:

1. Founder creates a revenue allocation rule.
2. Customer pays through a Dodo test checkout session.
3. Dodo sends a signed `payment.succeeded` webhook.
4. AllocRail verifies the webhook and records the revenue event.
5. Founder approves routing.
6. AllocRail executes Solana Devnet USDC transfers to configured recipient wallets.
7. Dashboard shows Dodo payment ID, allocation rule, recipient wallets, Solana signatures, and receipt export.

## Why Crypto Is Necessary

If Solana is removed, these get worse:

- Global settlement becomes slow and bank-dependent.
- Treasury rules become spreadsheet/manual workflows.
- Contractors cannot independently verify payout status on-chain.
- AI-agent spend limits and revenue splits become harder to enforce transparently.
- Cross-border contractor payouts go back to Wise, PayPal, wires, and manual reconciliation.

## Architecture Decision

Use an **integrate-first MVP** with a minimal on-chain component.

The fastest hackathon path:
- Dodo handles billing, checkout, subscriptions, customer records, and webhook source of truth.
- Backend handles webhook verification, allocation rules, idempotency, and job queue.
- Solana handles devnet USDC transfers and public settlement receipts.
- Optional Anchor program handles treasury policy state and PDA vault ownership.

For grand-prize credibility, include a small Anchor program if time permits. The app can still work if the first demo uses a backend signer, but the stronger Solana-native version uses a PDA-controlled vault.

## Recommended Stack

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Wallet adapter or Privy/embedded wallet later

Backend:
- Next.js route handlers for API and webhooks
- PostgreSQL via Prisma, or Supabase if speed matters
- BullMQ/Redis or a simple durable jobs table for payout processing

Dodo:
- `dodopayments` Node SDK
- Checkout sessions
- Webhooks with `client.webhooks.unwrap`
- Test mode API keys and webhook keys

Solana:
- `@solana/web3.js`
- `@solana/spl-token`
- Anchor for optional on-chain vault/router program
- Devnet RPC, preferably Helius devnet if available
- Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

Testing:
- Vitest for backend allocation math
- Anchor tests for program logic
- Playwright for core UI flow
- Dodo dashboard/CLI webhook testing
- Solana Explorer or Helius Orb for devnet transaction verification

## Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...

# Dodo
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_WEBHOOK_KEY=...
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_TEST_PRODUCT_ID=...

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
SOLANA_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
TREASURY_SIGNER_SECRET_KEY=...

# Optional Anchor
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=./keys/deployer.json
ALLOC_RAIL_PROGRAM_ID=...
```

## Data Model

### `Business`

Stores the merchant/team using AllocRail.

Fields:
- `id`
- `name`
- `owner_wallet`
- `dodo_business_id`
- `treasury_wallet`
- `solana_vault_ata`
- `created_at`

### `Recipient`

Stores payout targets.

Fields:
- `id`
- `business_id`
- `label`
- `wallet_address`
- `type`: contractor, vendor, reserve, founder, agent_budget
- `kyc_status`: demo-only field, none/pending/verified
- `created_at`

### `AllocationRule`

Defines how revenue gets split.

Fields:
- `id`
- `business_id`
- `name`
- `trigger_event`: payment.succeeded, subscription.active, subscription.renewed
- `source_product_id`
- `mode`: percentage or fixed_amount
- `status`: draft, active, paused
- `created_at`

### `AllocationRuleLine`

Fields:
- `id`
- `allocation_rule_id`
- `recipient_id`
- `percent_bps`
- `fixed_amount_usdc`
- `requires_approval`
- `max_single_payout_usdc`

### `DodoEvent`

Webhook inbox with idempotency.

Fields:
- `id`
- `webhook_id`
- `event_type`
- `business_id`
- `dodo_payment_id`
- `dodo_subscription_id`
- `payload_json`
- `processed_at`
- `created_at`

### `RevenueEvent`

Normalized revenue entry.

Fields:
- `id`
- `business_id`
- `dodo_event_id`
- `amount`
- `currency`
- `customer_email`
- `product_id`
- `metadata`
- `status`

### `PayoutIntent`

A planned on-chain payout.

Fields:
- `id`
- `business_id`
- `revenue_event_id`
- `recipient_id`
- `amount_usdc`
- `recipient_wallet`
- `status`: pending_approval, approved, executing, completed, failed
- `solana_signature`
- `error_message`
- `created_at`
- `executed_at`

## Solana Design

### MVP Version: Backend-Signed Transfers

This version is fastest and enough for a working devnet demo.

Flow:
1. App treasury wallet holds devnet USDC.
2. Backend derives/loads treasury signer.
3. On approved payout, backend sends SPL token transfer from treasury USDC ATA to recipient USDC ATA.
4. Store signature in `PayoutIntent`.

Pros:
- Fastest to build.
- Lower Anchor complexity.
- Good for demo.

Cons:
- Less Solana-native.
- Backend signer is trusted.

### Stronger Version: Anchor PDA Treasury Router

Program accounts:

`BusinessTreasury`
- PDA seed: `["business", business_id_hash]`
- owner/admin pubkey
- usdc_mint
- bump
- paused

`TreasuryVault`
- Associated token account owned by the `BusinessTreasury` PDA.
- Holds devnet USDC.

`AllocationPolicy`
- PDA seed: `["policy", business_treasury, policy_id]`
- recipient wallets
- basis-point splits
- approval threshold
- max payout

Instructions:

`initialize_business`
- Creates `BusinessTreasury`.
- Stores admin and USDC mint.

`set_policy`
- Admin creates or updates allocation split.
- Validate total bps equals 10,000.

`deposit`
- User/backend transfers devnet USDC into PDA vault.

`create_payout_intent`
- Records intended payout metadata hash.
- Optional if keeping intents off-chain.

`execute_payout`
- Transfers USDC from PDA vault to recipients using PDA signer.
- Enforces policy, max payout, pause state, and recipient list.

`pause`
- Admin pauses transfers.

Security requirements:
- Checked arithmetic only.
- Validate USDC mint exactly matches configured devnet mint.
- Validate token accounts are ATAs for expected owners and mint.
- Enforce signer/admin constraints.
- Enforce basis points sum.
- Add pause switch.
- Emit events for deposits and payouts.

## Dodo Integration

### Checkout Session

Create a checkout session when a demo customer buys a SaaS product.

Required request fields:
- `product_cart`
- `customer`
- `return_url`
- `metadata`

Metadata should include:
- `business_id`
- `allocation_rule_id`
- `internal_order_id`
- `demo_run_id`

### Webhook Events To Handle

Minimum:
- `payment.succeeded`
- `payment.failed`
- `subscription.active`
- `subscription.renewed`

Nice to have:
- `refund.succeeded`
- `dispute.opened`
- `credit.added`
- `credit.deducted`
- `credit.balance_low`

### Webhook Rules

Use Dodo SDK `client.webhooks.unwrap(...)` with:
- `webhook-id`
- `webhook-signature`
- `webhook-timestamp`

Processing rules:
- Return 200 quickly after verification.
- Store `webhook-id` and ignore duplicates.
- Process asynchronously from database/job queue.
- Never trust frontend redirect as payment proof.
- Dodo webhook is the source of truth.

## Main User Flows

### Flow 1: Founder Onboarding

1. Connect Solana wallet.
2. Create business profile.
3. Add Dodo test API key and webhook key in server env.
4. Create treasury wallet/PDA.
5. Fund treasury with devnet USDC.
6. Add recipients.
7. Create allocation rule.

### Flow 2: Customer Payment

1. Founder clicks "Create Demo Checkout".
2. Backend creates Dodo checkout session.
3. Customer completes Dodo test checkout.
4. Dodo webhook arrives.
5. App creates `RevenueEvent`.
6. App creates `PayoutIntent` rows from active allocation rule.

### Flow 3: Approval and Payout

1. Founder reviews pending payout intents.
2. Founder clicks "Approve Route".
3. Backend executes Solana devnet USDC transfers.
4. UI updates each payout with explorer link.
5. Receipt page shows:
   - Dodo event type
   - Dodo payment/session ID
   - Allocation rule
   - Recipient wallets
   - Solana signatures

### Flow 4: Agent Budget

1. Founder creates a recipient of type `agent_budget`.
2. Rule routes 5-10% of revenue into agent budget wallet.
3. App displays "Agent spend limit".
4. Optional next phase: agent proposes purchases and owner approves transfers.

## UI Pages

### `/`

Dashboard:
- Revenue processed
- Pending payouts
- Completed payouts
- Treasury USDC balance
- Last webhook received
- Last Solana transaction

### `/setup`

Wizard:
- Business profile
- Wallet connect
- Dodo test product ID
- Treasury funding status

### `/rules`

Allocation rules:
- Create rule
- Choose trigger event
- Select Dodo product
- Add recipients and percentages
- Validate total equals 100%

### `/recipients`

Recipient list:
- Label
- Wallet address
- Type
- Last payout

### `/checkout-demo`

Demo payment:
- Customer email
- Product
- Create Dodo checkout
- Open checkout URL

### `/payouts`

Payout queue:
- Pending approval
- Executing
- Completed
- Failed/retry

### `/receipts/[id]`

Public-ish receipt:
- Dodo payment metadata
- Allocation breakdown
- Solana transaction links

## Milestone Plan

### Milestone 1: Project Scaffold

Goal:
Working Next.js app with database, env config, and Solana connection.

Tasks:
- Create Next.js TypeScript app.
- Install Dodo SDK, Solana web3, SPL token, Prisma/Supabase.
- Add `.env.example`.
- Add database schema.
- Add devnet RPC health check.
- Add USDC mint constant.

Done when:
- App runs locally.
- `/api/health` returns Dodo env status, Solana RPC status, and configured USDC mint.

### Milestone 2: Treasury and Recipient Management

Goal:
Founder can create a business, add recipients, and view devnet USDC balance.

Tasks:
- Business creation UI.
- Recipient CRUD.
- Treasury wallet/PDA setup.
- Fetch USDC ATA and balance.
- Create missing recipient ATA when paying.

Done when:
- UI shows treasury devnet USDC balance.
- At least two recipient wallets are saved.

### Milestone 3: Dodo Checkout

Goal:
Create a Dodo test checkout session from the app.

Tasks:
- Add Dodo server client.
- Add `/api/dodo/checkout`.
- Include metadata: business ID, rule ID, demo run ID.
- Add checkout demo page.

Done when:
- Clicking "Create Checkout" returns a Dodo `checkout_url`.
- Customer can complete checkout in Dodo test mode.

### Milestone 4: Verified Webhooks

Goal:
Signed Dodo webhooks create normalized revenue events.

Tasks:
- Add raw-body webhook route.
- Verify with `client.webhooks.unwrap`.
- Store `DodoEvent`.
- Deduplicate by `webhook-id`.
- Normalize `payment.succeeded` and `subscription.active`.

Done when:
- Dodo dashboard/CLI test webhook is accepted.
- Duplicate webhook is ignored.
- `RevenueEvent` appears in dashboard.

### Milestone 5: Allocation Rules

Goal:
Revenue events create payout intents.

Tasks:
- Rule builder UI.
- Rule validation: total bps = 10,000.
- Rule matching by product ID/event type.
- Generate payout intents.
- Add approval status.

Done when:
- A test Dodo payment creates 2-4 payout intents.

### Milestone 6: Solana Devnet USDC Payouts

Goal:
Approved payout intents send devnet USDC.

Tasks:
- Add transfer service using `@solana/spl-token`.
- Load treasury signer securely.
- Create/get recipient ATA.
- Send transfer.
- Confirm transaction.
- Store signature and explorer URL.

Done when:
- A payout transfers devnet USDC to a recipient wallet.
- Receipt page links to Solana Explorer devnet transaction.

### Milestone 7: Anchor Treasury Program

Goal:
Move from backend-owned treasury to PDA-owned treasury.

Tasks:
- `anchor init allocrail-program`.
- Implement `initialize_business`.
- Implement PDA-owned USDC vault.
- Implement `set_policy`.
- Implement `execute_payout`.
- Add pause.
- Add Anchor tests.
- Deploy to devnet.
- Wire frontend/backend to program.

Done when:
- Program deployed on devnet.
- Treasury vault is PDA-owned.
- Payout instruction moves devnet USDC according to policy.

### Milestone 8: Demo Polish

Goal:
Make the hackathon submission feel real.

Tasks:
- Add dashboard metrics.
- Add receipt export.
- Add "before vs after" comparison.
- Add demo seed script.
- Add one-click reset for demo data.
- Record 2-minute video.

Done when:
- A judge can watch one flow from checkout to stablecoin payout in under 2 minutes.

## Devnet USDC Setup

Use Solana Devnet USDC mint:

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

Funding options:
- Circle Faucet for Solana Devnet USDC.
- Solana faucet for devnet SOL.
- If the faucet is blocked/rate-limited, create a local devnet SPL token named `USDC_DEV_DEMO` for fallback, but keep the code mint-configurable.

Important:
- USDC has 6 decimals.
- 1 USDC = `1_000_000` base units.
- Always store token amounts as integers/base units.

## API Routes

### `GET /api/health`

Returns:
- Solana RPC status
- USDC mint
- Dodo environment
- Database status

### `POST /api/dodo/checkout`

Input:
- `businessId`
- `productId`
- `customerEmail`
- `allocationRuleId`

Output:
- `checkoutUrl`
- `sessionId`

### `POST /api/webhooks/dodo`

Behavior:
- Verify Dodo signature.
- Store webhook.
- Queue processing.
- Return `{ received: true }`.

### `POST /api/payouts/:id/approve`

Behavior:
- Mark payout approved.
- Execute Solana transfer or Anchor instruction.
- Store signature.

### `POST /api/rules`

Create allocation rule.

### `GET /api/treasury/balance`

Return treasury devnet USDC balance.

## Smart Contract Interface

If using Anchor, keep it small.

```rust
initialize_business(admin, usdc_mint)
set_policy(policy_id, recipients, bps, max_payout)
deposit(amount)
execute_payout(policy_id, revenue_event_hash, payouts)
pause(paused)
```

Avoid overbuilding:
- Do not build invoice factoring in v1.
- Do not build off-ramp.
- Do not build KYC.
- Do not custody real funds for demo.
- Do not support every Dodo event at launch.

## Tests

Backend:
- Allocation percentages round correctly.
- Rule total must equal 10,000 bps.
- Duplicate webhook ID does not create duplicate revenue.
- Failed Dodo payment creates no payout.
- Refund/dispute marks revenue as disputed.

Solana:
- Transfer fails for wrong mint.
- Transfer fails when treasury balance is insufficient.
- Recipient ATA is created if missing.
- PDA payout fails if policy is paused.
- PDA payout fails if recipient is not in policy.
- PDA payout fails if amount exceeds max.

End-to-end:
- Create checkout.
- Simulate/receive Dodo webhook.
- Create revenue event.
- Generate payout intents.
- Approve payout.
- Confirm devnet USDC transfer.
- Display receipt.

## Security Notes

For hackathon:
- Use test-mode Dodo keys.
- Use devnet USDC only.
- Keep treasury signer out of frontend.
- Verify webhook signatures.
- Deduplicate webhook IDs.
- Use integer math for token amounts.
- Require approval before payouts.

For production later:
- Use multisig/Squads for treasury authority.
- Move payout policy fully on-chain.
- Add withdrawal limits and emergency pause.
- Add audit log.
- Add role-based access control.
- Add compliance review for payouts and contractors.
- Add Dodo live-mode verification checklist.

## Dodo Test Plan

1. Create Dodo test product.
2. Create Dodo test API key.
3. Configure webhook endpoint.
4. Use Dodo dashboard test webhook first.
5. Create real test checkout session.
6. Complete payment with test card.
7. Confirm `payment.succeeded` webhook.
8. Confirm payout intents.
9. Approve Solana devnet USDC payout.

## Submission Story

Headline:
AllocRail turns global SaaS revenue into programmable stablecoin treasury actions.

Demo narrative:
- Old way: founder receives revenue in one system, tracks contractors in a spreadsheet, pays globally through slow rails, and reconciles manually.
- New way: Dodo checkout creates the revenue event, AllocRail applies programmable rules, and Solana settles contractor/vendor/reserve payouts instantly in devnet USDC.

Judging bullets:
- Meaningful Dodo integration: checkout sessions, webhooks, metadata, subscriptions-ready.
- Meaningful Solana integration: devnet USDC transfers, optional PDA vault, on-chain receipts.
- Specific user: SaaS/AI founders with global contractors.
- Real-world utility: cross-border payouts and treasury automation.
- Traction path: pilot with one agency/SaaS team and two contractor payouts.

## Build Order For This Workspace

1. Scaffold Next.js + TypeScript.
2. Add Dodo checkout route.
3. Add Dodo webhook route.
4. Add database schema.
5. Add allocation rule UI.
6. Add Solana devnet USDC transfer service.
7. Add receipt page.
8. Add optional Anchor program.
9. Add demo seed and video script.

## Final Name Choice

Use:

```text
AllocRail
```

Backup names:
- TreasuryOS
- RevRail
- Vaultlane
- RouteMint

I would avoid:
- Treasura, because there are existing treasury products using that name.
- PayNest/TreasuryNest, because Copilot showed several SolNest/DePINNest-style nearby names.
- StableSplit, because split/payment naming is crowded.
