# Agentic Engineering Grant Application: AllocRail

Submit here: https://superteam.fun/earn/grants/agentic-engineering

## Step 1: Basics

**Project Title**

> AllocRail

**One Line Description**

> AllocRail turns Dodo revenue into Solana USDC treasury routing for contractor payouts, tax reserves, founder shares, and agent budgets.

**TG username**

> t.me/NikhilRaikwar18

**Wallet Address**

> FTUBznyYczMZ4Qt68XfF1Fye2qNujCUnw4vzuixtyU4b

## Step 2: Details

**Project Details**

> AllocRail is a programmable treasury router for SaaS and AI founders using Dodo Payments. Dodo handles global checkout, subscriptions, and verified payment events; AllocRail listens to those Dodo webhooks and routes revenue into Solana devnet USDC payout intents for contractors, tax reserves, founder distributions, and AI-agent budgets.
>
> The problem is that global founders can collect revenue, but post-revenue operations are still manual: spreadsheet splits, Wise/PayPal payouts, tax reserve tracking, contractor reconciliation, and no clean receipt linking customer revenue to downstream payouts.
>
> AllocRail solves this by using Dodo checkout sessions and metadata to select allocation rules, verified Dodo webhooks as the source of truth, and Solana stablecoins for fast, low-cost, programmable settlement. The MVP will show a full flow: Dodo test checkout -> verified webhook -> allocation rule -> payout intents -> devnet USDC transfers -> receipt linking Dodo event IDs to Solana transaction signatures.

**Deadline**

> May 11, 2026, before the Solana Frontier Hackathon submission deadline.

**Proof of Work**

> I have shipped multiple hackathon projects across Solana and Ethereum. On Solana, I built SolLink and SolPacket, both public repos showing prior Solana product work: https://github.com/NikhilRaikwar/SolLink and https://github.com/NikhilRaikwar/SolPacket.
>
> I also built SocialENS, an ETHGlobal hackathon winning project: https://github.com/NikhilRaikwar/SocialENS, and AgentOS, an agent-based project for ETHGlobal/OpenAgents: https://github.com/NikhilRaikwar/AgentOS.
>
> For AllocRail, I used solana.new skills through Codex for idea discovery, Solana Frontier positioning, and scaffold/build planning. I used Colosseum Copilot to validate the project landscape and confirm that AllocRail should focus on post-revenue treasury automation rather than broad payment collection. I also used Dodo MCP and Dodo skills to validate checkout sessions, metadata routing, verified webhooks, subscriptions, credits, and usage-based billing.
>
> Current AllocRail artifacts include `ALLOC_RAIL_DODO_TRACK_PLAN.md`, `ALLOC_RAIL_BUILD_PLAN.md`, `SOLANA_FRONTIER_IDEA_RESEARCH.md`, `DODO_STABLECOIN_TRACK_RESEARCH.md`, and an exported Codex session transcript available for private grant review if requested.
>
> Colosseum project created: https://arena.colosseum.org/projects/explore/allocrail

**Personal X Profile**

> https://x.com/AllocRail

**Personal GitHub Profile / Repo**

> https://github.com/NikhilRaikwar/AllocRail

**Colosseum Project**

> https://arena.colosseum.org/projects/explore/allocrail

**AI Session Transcript**

> Attach `codex-session.jsonl`.

## Step 3: Milestones

**Goals and Milestones**

> Milestone 1 — May 5: Scaffold Next.js app, database schema, Dodo/Solana environment setup, and health check.
>
> Milestone 2 — May 6: Implement Dodo checkout session creation with metadata for workspace, product, and allocation rule.
>
> Milestone 3 — May 7: Implement verified Dodo webhook handler with idempotency and revenue event inbox.
>
> Milestone 4 — May 8-9: Build allocation rule engine, payout intents, and Solana devnet USDC multi-recipient transfers.
>
> Milestone 5 — May 10-11: Polish receipt page, demo flow, optional Anchor PDA treasury vault, and submit to Colosseum Frontier.

**Primary KPI**

> Complete one end-to-end demo flow: Dodo test checkout -> verified webhook -> allocation rule -> at least 3 Solana devnet USDC payouts -> public receipt with Dodo event ID and Solana transaction links.

**Final Tranche Requirement**

> After shipping, I will submit the Colosseum project link, GitHub repo, live app URL, and AI coding subscription receipt(s) totaling $200.
