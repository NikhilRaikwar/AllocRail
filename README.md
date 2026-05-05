# AllocRail

**Dodo revenue -> programmable Solana treasury in one webhook.**

AllocRail is a programmable treasury router for SaaS and AI founders using Dodo Payments. Dodo handles global checkout, subscriptions, usage billing, and verified payment events. AllocRail turns those revenue events into Solana devnet USDC payout intents for contractors, tax reserves, founder distributions, and AI-agent budgets.

## Core Flow

```text
Dodo checkout -> verified webhook -> allocation rule -> payout intents -> Solana devnet USDC transfers -> receipt
```

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
- Solana devnet USDC multi-recipient payouts.
- Receipt page linking the Dodo event ID to Solana transaction signatures.
- Optional Anchor PDA treasury vault for policy-enforced payouts.

## Current API Foundation

Milestone 1 adds the first API surface:

```text
GET /api/health
GET /api/allocrail/demo
GET /api/dodo/checkout
POST /api/dodo/checkout
```

`/api/health` reports non-secret environment readiness for Dodo and Solana configuration.

`/api/allocrail/demo` returns a demo Dodo revenue event, allocation rule, payout intents, and validation checks.

`/api/dodo/checkout` creates a Dodo checkout session in test mode with AllocRail metadata:

```text
workspace_id
merchant_id
rule_id
product_tag
```

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind |
| Solana client | `@solana/kit`, wallet-standard |
| Program | Anchor scaffold, planned PDA treasury vault |
| Payments | Dodo Payments checkout, metadata, webhooks |
| Data | Prisma/Postgres planned for MVP |
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

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Anchor setup requires the Anchor CLI. The scaffold includes an Anchor workspace under `anchor/`, but program build/deploy is optional for the first Dodo-to-devnet-USDC MVP.

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
