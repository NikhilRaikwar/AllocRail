# AllocRail Agentic Engineering Evidence

This file summarizes the proof package for the Superteam Agentic Engineering Grant.

## Project

**AllocRail** turns Dodo Payments revenue into programmable Solana USDC treasury actions for SaaS and AI founders.

Core flow:

1. Customer pays through Dodo checkout.
2. Dodo sends a verified webhook.
3. AllocRail selects an allocation rule from Dodo metadata.
4. AllocRail creates payout intents.
5. Solana devnet USDC routes to contractor, reserve, founder, and agent-budget wallets.
6. Receipt links the Dodo event to Solana transaction signatures.

## Why This Is A Working Solana Product

AllocRail uses Solana for the part where blockchains are actually necessary: programmable settlement and verifiable payout receipts.

The MVP will ship on Solana devnet using devnet USDC:

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

Planned Solana components:

- devnet USDC treasury wallet
- multi-recipient SPL token transfers
- on-chain transaction receipts
- optional Anchor PDA treasury vault for policy-enforced payouts

## AI / solana.new Workflow Used

I used Codex with solana.new skills and Dodo tools to move from idea to product plan:

- `find-next-crypto-idea`: generated and ranked Solana Frontier / Dodo Payments track ideas.
- Colosseum Copilot: validated crowdedness, similar projects, and winner patterns.
- Dodo MCP / Dodo skills: validated real Dodo integration points: checkout sessions, metadata, verified webhooks, subscriptions, credits, usage events.
- Solana scaffold/build skills: planned the devnet architecture, MVP milestones, and optional Anchor PDA treasury vault.

The exported Codex session transcript is included separately as:

```text
codex-session.jsonl
```

## Current Planning Artifacts

- `README.md`
- `GRANT_APPLICATION.md`
- `ALLOC_RAIL_DODO_TRACK_PLAN.md`
- `ALLOC_RAIL_BUILD_PLAN.md`
- `SOLANA_FRONTIER_IDEA_RESEARCH.md`
- `DODO_STABLECOIN_TRACK_RESEARCH.md`

## Prior Builder Proof

Public repos:

- SolLink: https://github.com/NikhilRaikwar/SolLink
- SolPacket: https://github.com/NikhilRaikwar/SolPacket
- SocialENS: https://github.com/NikhilRaikwar/SocialENS
- AgentOS: https://github.com/NikhilRaikwar/AgentOS
- AllocRail: https://github.com/NikhilRaikwar/AllocRail
- Colosseum AllocRail project: https://arena.colosseum.org/projects/explore/allocrail

## Grant Milestones

1. May 5: Scaffold Next.js app, database schema, Dodo/Solana environment setup, health check.
2. May 6: Implement Dodo checkout session creation with metadata.
3. May 7: Implement verified Dodo webhook handler with idempotency and revenue inbox.
4. May 8-9: Build allocation engine, payout intents, and Solana devnet USDC transfers.
5. May 10-11: Polish receipt page, demo flow, optional Anchor PDA treasury vault, and submit to Colosseum Frontier.

## Primary KPI

Complete one end-to-end demo:

```text
Dodo test checkout -> verified webhook -> allocation rule -> 3+ Solana devnet USDC payouts -> public receipt with Dodo event ID and Solana transaction links
```
