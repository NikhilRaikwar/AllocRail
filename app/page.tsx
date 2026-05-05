"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckoutButton } from "./components/checkout-button";
import { ClusterSelect } from "./components/cluster-select";
import { GridBackground } from "./components/grid-background";
import { ThemeToggle } from "./components/theme-toggle";
import { WalletButton } from "./components/wallet-button";
import {
  DEMO_MERCHANT_ID,
  DEMO_RULE_ID,
  DEMO_WORKSPACE_ID,
  demoAllocationRule,
} from "./lib/allocrail/demo-data";

const flow = [
  "Dodo checkout",
  "Verified webhook",
  "Allocation rule",
  "Payout intents",
  "Devnet USDC payouts",
  "Receipt",
];

const buckets = [
  { label: "Contractor escrow", value: "45%" },
  { label: "Tax reserve", value: "15%" },
  { label: "Founder share", value: "30%" },
  { label: "Agent budget", value: "10%" },
];

const checkoutMetadata = {
  workspace_id: DEMO_WORKSPACE_ID,
  merchant_id: DEMO_MERCHANT_ID,
  rule_id: DEMO_RULE_ID,
  product_tag: demoAllocationRule.productTag,
};

export default function Home() {
  const [demoName, setDemoName] = useState("AllocRail Demo Customer");
  const [demoEmail, setDemoEmail] = useState("founder-demo@allocrail.dev");

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <GridBackground />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/allocrail_logo.png"
              alt="AllocRail"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="text-sm font-semibold tracking-tight">
              AllocRail
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ClusterSelect />
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 pb-16">
          <section className="grid gap-10 pt-10 pb-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-medium text-foreground/55">
                Dodo Payments + Solana devnet USDC
              </p>
              <h1 className="text-5xl font-black tracking-tight text-foreground md:text-7xl">
                Programmable treasury routing for Dodo revenue.
              </h1>
              <p className="mt-6 text-base leading-7 text-foreground/60 md:text-lg">
                AllocRail turns each verified Dodo checkout, subscription, or
                usage event into contractor payouts, tax reserves, founder
                shares, and AI-agent budgets settled with Solana devnet USDC.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://arena.colosseum.org/projects/explore/allocrail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  Colosseum project
                </a>
                <a
                  href="https://github.com/NikhilRaikwar/AllocRail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border-low px-4 py-2 text-sm font-semibold transition hover:bg-cream"
                >
                  GitHub repo
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border-low bg-card">
              <div className="border-b border-border-low px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                  Example allocation rule
                </p>
                <p className="mt-1 text-sm text-foreground/65">
                  Product: AI Pro Subscription
                </p>
              </div>
              <div className="divide-y divide-border-low">
                {buckets.map((bucket) => (
                  <div
                    key={bucket.label}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <span className="text-sm font-medium">{bucket.label}</span>
                    <span className="font-mono text-sm text-foreground/65">
                      {bucket.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 border-t border-border-low pt-8 md:grid-cols-6">
            {flow.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-border-low bg-card p-4"
              >
                <p className="font-mono text-xs text-foreground/40">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm font-semibold leading-5">{step}</p>
              </div>
            ))}
          </section>

          <section className="mt-12 grid gap-8 border-t border-border-low pt-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <p className="text-sm font-medium text-foreground/55">
                Live checkout path
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Trigger a Dodo test checkout with routing metadata.
              </h2>
              <p className="mt-4 text-sm leading-6 text-foreground/60">
                The checkout session carries the workspace, merchant, rule, and
                product tag that AllocRail will use when the verified webhook
                arrives.
              </p>
              <div className="mt-6 grid max-w-xl gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                    Demo customer name
                  </span>
                  <input
                    type="text"
                    value={demoName}
                    onChange={(event) => setDemoName(event.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                    Demo customer email
                  </span>
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(event) => setDemoEmail(event.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring"
                  />
                </label>
              </div>
              <div className="mt-6">
                <CheckoutButton
                  metadata={checkoutMetadata}
                  email={demoEmail}
                  name={demoName}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border-low bg-card">
              <div className="border-b border-border-low px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                  Dodo checkout metadata
                </p>
                <p className="mt-1 text-sm text-foreground/65">
                  Attached server-side when the checkout session is created.
                </p>
              </div>
              <dl className="divide-y divide-border-low">
                {Object.entries(checkoutMetadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="grid gap-2 px-5 py-4 md:grid-cols-[0.42fr_0.58fr]"
                  >
                    <dt className="font-mono text-xs text-foreground/45">
                      {key}
                    </dt>
                    <dd className="break-all font-mono text-sm text-foreground/75">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="mt-12 grid gap-6 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold">Dodo collects globally.</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/55">
                Checkout metadata and verified webhooks become the source of
                truth for each revenue event.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold">AllocRail routes rules.</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/55">
                Founders define how revenue should split across contractors,
                reserves, founder wallets, and agent budgets.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold">Solana settles instantly.</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/55">
                Devnet USDC payouts and receipt links show the full path from
                Dodo event to on-chain settlement.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
