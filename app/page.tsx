"use client";

import { useEffect, useState } from "react";
import { CheckoutButton } from "./components/checkout-button";
import { ClusterSelect } from "./components/cluster-select";
import { ThemeToggle } from "./components/theme-toggle";
import { WalletButton } from "./components/wallet-button";
import {
  DEMO_MERCHANT_ID,
  DEMO_RULE_ID,
  DEMO_WORKSPACE_ID,
  demoAllocationRule,
} from "./lib/allocrail/demo-data";
import type { DodoRoutingMetadata } from "./lib/allocrail/types";

const checkoutMetadata: DodoRoutingMetadata = {
  workspace_id: DEMO_WORKSPACE_ID,
  merchant_id: DEMO_MERCHANT_ID,
  rule_id: DEMO_RULE_ID,
  product_tag: demoAllocationRule.productTag,
};

const navItems = [
  { label: "How it works", href: "#how" },
  { label: "Who it's for", href: "#who" },
  { label: "Why Solana", href: "#compare" },
  { label: "Live Demo", href: "#demo" },
];

const proofCards = [
  {
    value: "Live",
    title: "Dodo checkout",
    copy: "A real hosted Dodo checkout session is created from the site with routing metadata attached server-side.",
  },
  {
    value: "Verified",
    title: "Signed webhook",
    copy: "AllocRail verifies Dodo signatures, rejects replays, and only then turns revenue events into treasury actions.",
  },
  {
    value: "4 intents",
    title: "Treasury route",
    copy: "One revenue event expands into contractor escrow, tax reserve, founder share, and agent budget payout intents.",
  },
  {
    value: "Receipt",
    title: "Audit snapshot",
    copy: "Every route stores the original event, matched rule, and payout breakdown for later settlement and proof.",
  },
];

const personas = [
  {
    title: "SaaS founders",
    copy: "Collect globally with Dodo, then automatically split revenue into ops buckets instead of reconciling it manually.",
  },
  {
    title: "AI-native products",
    copy: "Keep agent spend separate from founder and contractor allocations while preserving an auditable revenue trail.",
  },
  {
    title: "Global teams",
    copy: "Prepare contractor and reserve routes immediately after payment instead of waiting on manual treasury workflows.",
  },
];

const features = [
  {
    icon: "WV",
    title: "Verified Webhooks",
    copy: "Cryptographic signature verification via the Dodo SDK, replay protection, and webhook-id idempotency before any treasury action is created.",
  },
  {
    icon: "PR",
    title: "Programmable Rules",
    copy: "Basis-point allocation logic per Dodo product and event type, validated to exactly 10,000 bps before route generation.",
  },
  {
    icon: "PI",
    title: "Payout Intents",
    copy: "Each verified revenue event becomes structured payout intents with status, recipient wallet, and approval requirements.",
  },
  {
    icon: "SU",
    title: "Stablecoin Settlement Path",
    copy: "The route is prepared for Solana USDC settlement so one payment can fan out into multiple treasury destinations cheaply.",
  },
  {
    icon: "AR",
    title: "Audit Receipts",
    copy: "Every route snapshots the Dodo event, matched rule, recipient wallets, and payout amounts into one inspectable receipt record.",
  },
];

const solanaReasons = [
  {
    title: "Fast multi-recipient settlement",
    copy: "One verified event can fan out into multiple stablecoin routes without adding bank-style delay or per-transfer operational drag.",
  },
  {
    title: "Low-cost treasury operations",
    copy: "Treasury routing only makes sense when multi-recipient settlement stays cheap enough to run routinely, not just for large invoices.",
  },
  {
    title: "Auditable payout proof",
    copy: "Receipts can link a Dodo payment event to on-chain execution, which is stronger than scattered spreadsheets and payout screenshots.",
  },
];

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
}

function formatShortId(value?: string) {
  if (!value) {
    return "pending";
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export default function Home() {
  const [amount, setAmount] = useState(11138);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Waiting for live checkout...",
    "Click launch demo treasury to create a Dodo test checkout.",
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const nodes = document.querySelectorAll(".cream-reveal");
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const allocationPreview = demoAllocationRule.buckets.map((bucket) => ({
    ...bucket,
    amount: Math.round(amount * (bucket.percentageBps / 10_000)),
  }));

  function runSimulation() {
    const paymentId = `pay_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    setTerminalLines([
      "Checkout metadata attached.",
      "Founder routing profile loaded.",
      `Contractor Escrow -> ${formatMoney(Math.round(amount * 45), "USD")}`,
      `Founder Share -> ${formatMoney(Math.round(amount * 30), "USD")}`,
      `Tax Reserve -> ${formatMoney(Math.round(amount * 15), "USD")}`,
      `AI-Agent Budget -> ${formatMoney(Math.round(amount * 10), "USD")}`,
      `Preview generated for ${paymentId}.`,
    ]);
  }

  return (
    <div className="allocrail-cream-page">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@300;400;500;600&family=Courier+Prime:wght@400;700&display=swap");

        .allocrail-cream-page {
          --cream: #f5f0e8;
          --cream-dark: #ede7d9;
          --cream-darker: #e3dac8;
          --ink: #1a1714;
          --ink-soft: #3d3830;
          --ink-muted: #7a7268;
          --ink-faint: #b5afa6;
          --green: #1a6b4a;
          --green-light: #2a8a60;
          --green-pale: #d4eae0;
          --purple: #5b3fa6;
          --purple-pale: #eae4f5;
          --amber: #9b6e1a;
          --amber-pale: #f5edd4;
          --red: #8b2e2e;
          --blue-pale: #eaf0f8;
          --surface: #fffdfa;
          --surface-strong: #ffffff;
          --section-base: #f5f0e8;
          --section-alt: #efe7db;
          --hero-bg: #f3ede4;
          --hero-ring: rgba(26, 23, 20, 0.06);
          --hero-ring-soft: rgba(26, 23, 20, 0.035);
          --terminal-bg: #181412;
          --terminal-fg: rgba(255, 248, 240, 0.82);
          --terminal-muted: rgba(255, 248, 240, 0.36);
          --nav-bg: rgba(245, 240, 232, 0.92);
          --nav-text: rgba(26, 23, 20, 0.94);
          --nav-muted: rgba(61, 56, 48, 0.82);
          --nav-border: rgba(26, 23, 20, 0.08);
          --cta-bg: #efe7db;
          --cta-text: rgba(26, 23, 20, 0.96);
          --cta-subtle: rgba(61, 56, 48, 0.78);
          --cta-outline: rgba(26, 23, 20, 0.14);
          --border: rgba(26, 23, 20, 0.1);
          --border-strong: rgba(26, 23, 20, 0.18);
          --serif: "Instrument Serif", Georgia, serif;
          --sans: "Instrument Sans", system-ui, sans-serif;
          --mono: "Courier Prime", "Courier New", monospace;
          --shadow-sm: 0 1px 3px rgba(26, 23, 20, 0.06), 0 1px 2px rgba(26, 23, 20, 0.04);
          --shadow-md: 0 4px 16px rgba(26, 23, 20, 0.08), 0 2px 6px rgba(26, 23, 20, 0.05);
          --shadow-lg: 0 16px 48px rgba(26, 23, 20, 0.12), 0 4px 16px rgba(26, 23, 20, 0.06);
          min-height: 100vh;
          background: var(--cream);
          color: var(--ink);
          font-family: var(--sans);
          overflow-x: hidden;
          position: relative;
        }

        .dark .allocrail-cream-page {
          --cream: #171412;
          --cream-dark: #1f1a17;
          --cream-darker: #2a231f;
          --ink: #f5f0e8;
          --ink-soft: #e0d7ca;
          --ink-muted: #b8ad9f;
          --ink-faint: #8d8174;
          --green-pale: rgba(26, 107, 74, 0.18);
          --purple-pale: rgba(91, 63, 166, 0.18);
          --amber-pale: rgba(155, 110, 26, 0.18);
          --blue-pale: rgba(59, 107, 180, 0.18);
          --surface: #211b18;
          --surface-strong: #261f1c;
          --section-base: #171412;
          --section-alt: #1f1a17;
          --hero-bg: #171412;
          --hero-ring: rgba(245, 240, 232, 0.08);
          --hero-ring-soft: rgba(245, 240, 232, 0.04);
          --terminal-bg: #0f0c0b;
          --terminal-fg: rgba(245, 240, 232, 0.86);
          --terminal-muted: rgba(245, 240, 232, 0.36);
          --nav-bg: rgba(20, 17, 15, 0.96);
          --nav-text: rgba(245, 240, 232, 0.96);
          --nav-muted: rgba(245, 240, 232, 0.8);
          --nav-border: rgba(245, 240, 232, 0.08);
          --cta-bg: #0f0c0b;
          --cta-text: rgba(245, 240, 232, 0.96);
          --cta-subtle: rgba(245, 240, 232, 0.62);
          --cta-outline: rgba(245, 240, 232, 0.18);
          --border: rgba(245, 240, 232, 0.08);
          --border-strong: rgba(245, 240, 232, 0.16);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.12);
          --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.18);
          --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.32), 0 4px 16px rgba(0, 0, 0, 0.24);
        }

        .allocrail-cream-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.6;
        }

        .allocrail-cream-page * {
          box-sizing: border-box;
        }

        .allocrail-cream-page a {
          color: inherit;
        }

        .cream-nav,
        .cream-hero,
        .cream-section,
        .cream-cta-section,
        .cream-footer {
          position: relative;
          z-index: 1;
        }

        .cream-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: var(--nav-bg);
          backdrop-filter: blur(16px) saturate(1.4);
          border-bottom: 1px solid var(--nav-border);
          padding: 0 48px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cream-nav-brand {
          font-family: var(--serif);
          font-size: 24px;
          font-style: italic;
          letter-spacing: -0.4px;
          text-decoration: none;
          color: var(--nav-text) !important;
        }

        .cream-nav-center {
          display: flex;
          gap: 32px;
        }

        .cream-nav-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--nav-text) !important;
          text-decoration: none;
          letter-spacing: 0.02em;
          opacity: 0.88;
          transition: color 0.2s, opacity 0.2s;
        }

        .cream-nav-link:hover {
          color: var(--nav-text);
          opacity: 1;
        }

        .cream-nav-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .cream-utility-rail {
          position: fixed;
          top: 72px;
          right: 48px;
          z-index: 95;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .cream-hero {
          background:
            radial-gradient(circle at 50% 42%, rgba(26, 107, 74, 0.05), transparent 28%),
            var(--hero-bg);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 48px 80px;
          overflow: hidden;
        }

        .cream-hero::before,
        .cream-hero::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .cream-hero::before {
          width: 600px;
          height: 600px;
          border: 1px solid var(--hero-ring);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
        }

        .cream-hero::after {
          width: 900px;
          height: 900px;
          border: 1px solid var(--hero-ring-soft);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -58%);
        }

        .cream-hero-eyebrow,
        .cream-section-eyebrow,
        .cream-flow-label,
        .cream-metric-label,
        .cream-demo-label,
        .cream-alloc-footer-label,
        .cream-stack-desc,
        .cream-footer-left,
        .cream-footer-links a {
          font-family: var(--mono);
        }

        .cream-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 36px;
        }

        .cream-eyebrow-pip,
        .cream-status-dot,
        .cream-wh-pip {
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cream-eyebrow-pip {
          width: 6px;
          height: 6px;
          background: var(--green);
        }

        .cream-hero-title {
          font-family: var(--serif);
          font-size: clamp(52px, 8vw, 96px);
          line-height: 1;
          letter-spacing: -3px;
          margin-bottom: 24px;
          max-width: 900px;
          color: var(--ink);
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .cream-hero-title span {
          display: block;
        }

        .cream-hero-title em,
        .cream-section-title em,
        .cream-cta-title em {
          font-style: italic;
          color: var(--green);
        }

        .cream-hero-sub {
          font-size: 18px;
          color: var(--ink-soft);
          max-width: 520px;
          margin: 0 auto 48px;
          line-height: 1.7;
          font-weight: 400;
        }

        .cream-hero-actions,
        .cream-cta-btns {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cream-hero-actions {
          margin-bottom: 72px;
        }

        .cream-cta-primary,
        .cream-cta-secondary,
        .cream-cta-btn-a,
        .cream-cta-btn-b {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.25s;
          white-space: nowrap;
        }

        .cream-cta-primary {
          font-size: 14px;
          font-weight: 600;
          color: var(--cream) !important;
          padding: 13px 28px;
          background: var(--ink);
          box-shadow: var(--shadow-sm);
        }

        .cream-cta-primary:hover {
          background: var(--ink-soft);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .cream-cta-secondary {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink) !important;
          padding: 13px 24px;
          border: 1px solid var(--border-strong);
          background: color-mix(in srgb, var(--surface-strong) 72%, transparent);
        }

        .cream-cta-secondary:hover {
          background: var(--surface-strong);
          border-color: var(--ink-faint);
        }

        .cream-alloc-card,
        .cream-demo-card,
        .cream-demo-meta,
        .cream-feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
        }

        .dark .cream-alloc-card,
        .dark .cream-demo-card,
        .dark .cream-demo-meta,
        .dark .cream-feature-card {
          background: var(--surface);
        }

        .cream-flow-top,
        .cream-alloc-header,
        .cream-demo-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cream-section-divider {
          border: none;
          border-top: 1px solid var(--border);
        }

        .cream-section {
          background: var(--section-base);
        }

        .cream-section-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 100px 48px;
        }

        .cream-section-eyebrow {
          display: block;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 16px;
        }

        .cream-section-title {
          font-family: var(--serif);
          font-size: clamp(36px, 4vw, 54px);
          line-height: 1.1;
          letter-spacing: -2px;
          margin-bottom: 20px;
        }

        .cream-section-body {
          font-size: 17px;
          color: var(--ink-soft);
          max-width: 480px;
          line-height: 1.75;
          font-weight: 400;
        }

        .cream-how-layout,
        .cream-webhook-layout,
        .cream-demo-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .cream-how-steps,
        .cream-webhook-list {
          display: flex;
          flex-direction: column;
        }

        .cream-how-step {
          display: flex;
          gap: 20px;
          padding: 24px 0;
          border-bottom: 1px solid var(--border);
        }

        .cream-how-step:last-child {
          border-bottom: none;
        }

        .cream-step-num-box {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--ink-muted);
          background: var(--surface-strong);
        }

        .dark .cream-step-num-box {
          background: var(--cream-dark);
        }

        .cream-how-step:hover .cream-step-num-box {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }

        .cream-step-content h3,
        .cream-feature-card h3,
        .cream-stack-name,
        .cream-alloc-title {
          font-family: var(--serif);
          font-style: italic;
        }

        .cream-step-content h3 {
          font-size: 17px;
          margin-bottom: 6px;
        }

        .cream-step-content p,
        .cream-feature-card p {
          font-size: 13.5px;
          color: var(--ink-soft);
          line-height: 1.65;
        }

        .cream-alloc-card,
        .cream-demo-card,
        .cream-demo-meta,
        .cream-stack-item,
        .cream-code-preview,
        .cream-terminal-card {
          border-radius: 14px;
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }

        .cream-alloc-header,
        .cream-demo-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
        }

        .cream-alloc-title {
          font-size: 14px;
        }

        .cream-alloc-tag {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--green);
          background: var(--green-pale);
          padding: 3px 8px;
          border-radius: 5px;
          letter-spacing: 0.05em;
        }

        .cream-alloc-body {
          padding: 20px;
        }

        .cream-alloc-row {
          margin-bottom: 18px;
        }

        .cream-alloc-row:last-child {
          margin-bottom: 0;
        }

        .cream-alloc-row-top,
        .cream-alloc-label-row,
        .cream-demo-slider,
        .cream-demo-dots,
        .cream-log-line,
        .cream-cell-check {
          display: flex;
          align-items: center;
        }

        .cream-alloc-row-top {
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .cream-alloc-label-row {
          gap: 8px;
        }

        .cream-alloc-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cream-alloc-name {
          font-size: 13px;
          font-weight: 500;
        }

        .cream-alloc-wallet {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--ink-faint);
        }

        .cream-alloc-pct {
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 700;
        }

        .cream-bar-track,
        .cream-demo-alloc-track {
          background: var(--cream-dark);
          overflow: hidden;
        }

        .cream-bar-track {
          height: 6px;
          border-radius: 3px;
        }

        .cream-bar-fill,
        .cream-demo-alloc-fill {
          height: 100%;
          border-radius: inherit;
          transition: width 0.4s ease;
        }

        .cream-green {
          background: var(--green);
        }

        .cream-purple {
          background: var(--purple);
        }

        .cream-amber {
          background: var(--amber);
        }

        .cream-blue {
          background: #3b6bb4;
        }

        .cream-alloc-footer {
          border-top: 1px solid var(--border);
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cream-alloc-footer-label {
          font-size: 10px;
          color: var(--ink-faint);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .cream-alloc-footer-val {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--green);
          font-weight: 700;
        }

        .cream-code-preview,
        .cream-terminal-card {
          background: var(--terminal-bg);
          color: var(--terminal-fg);
          box-shadow: var(--shadow-lg);
        }

        .cream-code-header,
        .cream-terminal-header {
          background: rgba(255, 255, 255, 0.03);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .cream-code-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .cream-dot-r {
          background: #ff5f57;
        }

        .cream-dot-y {
          background: #ffbd2e;
        }

        .cream-dot-g {
          background: #28c840;
        }

        .cream-code-filename {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--terminal-muted);
          margin-left: 8px;
        }

        .cream-code-body,
        .cream-terminal-body {
          padding: 24px;
          font-family: var(--mono);
          font-size: 12.5px;
          line-height: 2;
        }

        .cream-terminal-body {
          min-height: 280px;
          font-size: 12px;
        }

        .cream-code-comment {
          color: var(--terminal-muted);
        }

        .cream-code-key,
        .cream-code-str {
          color: #c3e88d;
        }

        .cream-code-val {
          color: #f07178;
        }

        .cream-code-fn {
          color: #82aaff;
        }

        .cream-code-green {
          color: #14f195;
        }

        .cream-code-purple {
          color: #c792ea;
        }

        .cream-code-bracket {
          color: rgba(255, 255, 255, 0.5);
        }

        .cream-demo-section {
          background: var(--section-alt);
        }

        .cream-proof-grid,
        .cream-persona-grid,
        .cream-why-grid {
          display: grid;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          margin-top: 48px;
          box-shadow: var(--shadow-sm);
        }

        .cream-proof-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .cream-persona-grid,
        .cream-why-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .cream-proof-card,
        .cream-persona-card,
        .cream-why-card {
          min-height: 210px;
          padding: 24px;
          background: var(--surface);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cream-proof-value,
        .cream-persona-index,
        .cream-why-kicker {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--green);
        }

        .cream-proof-card h3,
        .cream-persona-card h3,
        .cream-why-card h3 {
          font-size: 22px;
          line-height: 1.15;
          margin: 0;
        }

        .cream-proof-card p,
        .cream-persona-card p,
        .cream-why-card p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--ink-muted);
        }

        .cream-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          margin-top: 56px;
          box-shadow: var(--shadow-sm);
        }

        .cream-feature-card {
          padding: 32px 28px;
          transition: background 0.2s;
        }

        .cream-feature-card:hover {
          background: var(--cream);
        }

        .dark .cream-feature-card:hover {
          background: var(--cream-darker);
        }

        .cream-feature-icon,
        .cream-stack-emoji {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cream-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          font-size: 12px;
          margin-bottom: 18px;
          border: 1px solid var(--border);
          background: var(--cream);
          font-family: var(--mono);
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .cream-feature-card h3 {
          font-size: 17px;
          margin-bottom: 10px;
        }

        .cream-demo-layout {
          align-items: start;
        }

        .cream-demo-card-header {
          padding: 18px 24px;
        }

        .cream-demo-dots {
          gap: 6px;
        }

        .cream-demo-card-title {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--ink-soft);
          margin-left: 8px;
          letter-spacing: 0.04em;
        }

        .cream-demo-body,
        .cream-demo-meta {
          padding: 24px;
        }

        .cream-demo-field {
          margin-bottom: 16px;
        }

        .cream-demo-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 6px;
        }

        .cream-demo-slider {
          gap: 16px;
        }

        .cream-slider-val {
          font-family: var(--serif);
          font-size: 32px;
          font-style: italic;
          color: var(--green);
          min-width: 120px;
          text-align: right;
        }

        .cream-demo-range {
          flex: 1;
          appearance: none;
          -webkit-appearance: none;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(
            90deg,
            var(--green) 0%,
            var(--green) var(--val, 50%),
            var(--cream-darker) var(--val, 50%),
            var(--cream-darker) 100%
          );
          outline: none;
        }

        .cream-demo-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--green);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }

        .dark .cream-demo-range::-webkit-slider-thumb {
          background: var(--cream);
        }

        .cream-demo-alloc-preview {
          margin-top: 20px;
        }

        .cream-demo-alloc-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .cream-demo-alloc-label {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--ink-muted);
          width: 130px;
          flex-shrink: 0;
        }

        .cream-demo-alloc-track {
          flex: 1;
          height: 8px;
          border-radius: 4px;
        }

        .cream-demo-alloc-pct {
          font-family: var(--mono);
          font-size: 11px;
          width: 68px;
          text-align: right;
        }

        .cream-demo-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }

        .cream-simulate-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--border-strong);
          border-radius: 10px;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cream-simulate-btn:hover {
          background: var(--cream);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .dark .cream-simulate-btn:hover {
          background: var(--cream-darker);
        }

        .cream-terminal-body {
          overflow: auto;
        }

        .cream-log-line {
          gap: 12px;
          align-items: flex-start;
        }

        .cream-log-time {
          color: var(--terminal-muted);
          flex-shrink: 0;
        }

        .cream-log-msg {
          color: var(--terminal-fg);
          word-break: break-word;
        }

        .cream-log-success {
          color: #2a8a60;
        }

        .cream-log-info {
          color: #82aaff;
        }

        .cream-demo-meta-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cream-demo-meta-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          font-family: var(--mono);
          font-size: 11px;
        }

        .cream-demo-meta-key {
          color: var(--ink-muted);
        }

        .cream-demo-meta-value {
          color: var(--ink);
          word-break: break-word;
        }

        .cream-demo-meta-rule {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .cream-cta-section {
          background: var(--cta-bg);
          overflow: hidden;
        }

        .cream-cta-section::before {
          content: "";
          position: absolute;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.04);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .cream-cta-inner {
          max-width: 800px;
          margin: 0 auto;
          padding: 120px 48px;
          text-align: center;
          position: relative;
        }

        .cream-cta-title {
          font-family: var(--serif);
          font-size: clamp(40px, 5vw, 68px);
          letter-spacing: -2px;
          line-height: 1.05;
          color: var(--cta-text);
          margin-bottom: 20px;
        }

        .cream-cta-sub {
          font-size: 17px;
          color: var(--cta-subtle);
          margin-bottom: 40px;
          font-weight: 400;
        }

        .cream-cta-btn-a {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink) !important;
          padding: 13px 28px;
          background: var(--surface-strong);
        }

        .cream-cta-btn-a:hover {
          background: var(--cream);
          transform: translateY(-1px);
        }

        .cream-cta-btn-b {
          font-size: 14px;
          font-weight: 500;
          color: var(--cta-text) !important;
          padding: 13px 24px;
          border: 1px solid var(--cta-outline);
          background: transparent;
        }

        .cream-cta-btn-b:hover {
          border-color: color-mix(in srgb, var(--cta-text) 32%, transparent);
          color: var(--cta-text);
        }

        .cream-footer {
          border-top: 1px solid var(--border);
          padding: 32px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .cream-footer-left {
          font-size: 11px;
          color: var(--ink-faint);
        }

        .cream-footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .cream-footer-links a {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .cream-footer-links a:hover {
          color: var(--ink);
        }

        .cream-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: all 0.65s ease;
        }

        .cream-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 1100px) {
          .cream-nav {
            padding: 0 24px;
          }
        }

        @media (max-width: 900px) {
          .cream-nav-center {
            display: none;
          }

          .cream-nav-right {
            gap: 8px;
          }

          .cream-hero {
            padding: 120px 24px 60px;
          }

          .cream-section-inner,
          .cream-cta-inner {
            padding: 64px 24px;
          }

          .cream-how-layout,
          .cream-demo-layout {
            grid-template-columns: 1fr;
          }

          .cream-features-grid {
            grid-template-columns: 1fr;
          }

          .cream-proof-grid,
          .cream-persona-grid,
          .cream-why-grid {
            grid-template-columns: 1fr;
          }

          .cream-demo-meta-row {
            grid-template-columns: 1fr;
          }

          .cream-footer {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .cream-nav {
            height: auto;
            min-height: 60px;
            padding-top: 10px;
            padding-bottom: 10px;
            flex-wrap: wrap;
            gap: 12px;
          }

          .cream-hero-title {
            letter-spacing: -2px;
          }

          .cream-nav-right {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .cream-hero-sub,
          .cream-section-body,
          .cream-cta-sub {
            font-size: 15px;
          }

          .cream-slider-val {
            min-width: 88px;
            font-size: 24px;
          }

          .cream-demo-slider {
            flex-direction: column;
            align-items: stretch;
          }

          .cream-demo-alloc-row {
            gap: 8px;
          }

          .cream-demo-alloc-label {
            width: 96px;
          }

        }
      `}</style>

      <nav className="cream-nav">
        <a href="#top" className="cream-nav-brand">
          AllocRail
        </a>
        <div className="cream-nav-center">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="cream-nav-link">
              {item.label}
            </a>
          ))}
        </div>
        <div className="cream-nav-right">
          <ThemeToggle />
          <ClusterSelect />
          <WalletButton />
        </div>
      </nav>

      <section className="cream-hero" id="top">
        <div className="cream-hero-eyebrow">
          <span className="cream-eyebrow-pip" />
          Superteam India x Dodo Payments x Solana Frontier 2026
        </div>

        <h1 className="cream-hero-title">
          <span>Dodo collects.</span>
          <span>
            AllocRail <em>routes.</em>
          </span>
          <span>Solana settles.</span>
        </h1>

        <p className="cream-hero-sub">
          Turn every Dodo payment event into automatic Solana USDC splits:
          contractor escrow, tax reserves, founder shares, and AI-agent budgets
          in one webhook.
        </p>

        <div className="cream-hero-actions">
          <a href="#demo" className="cream-cta-primary">
            Launch Demo Treasury
          </a>
          <a
            href="https://arena.colosseum.org/projects/explore/allocrail"
            className="cream-cta-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Colosseum Project {"->"}
          </a>
        </div>
      </section>

      <section className="cream-section cream-proof-section">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"// proof"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            Not another stablecoin checkout. <em>Treasury logic after payment.</em>
          </h2>
          <div className="cream-proof-grid cream-reveal">
            {proofCards.map((card) => (
              <div className="cream-proof-card" key={card.title}>
                <span className="cream-proof-value">{card.value}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cream-section" id="who">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"// who it's for"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            Built for teams with revenue in one place and <em>treasury work everywhere else.</em>
          </h2>
          <div className="cream-persona-grid cream-reveal">
            {personas.map((persona, index) => (
              <div className="cream-persona-card" key={persona.title}>
                <span className="cream-persona-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{persona.title}</h3>
                <p>{persona.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cream-section" id="how">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <div className="cream-how-layout">
            <div>
              <span className="cream-section-eyebrow cream-reveal">
                {"// how it works"}
              </span>
              <h2 className="cream-section-title cream-reveal">
                Revenue in. Treasury <em>automated.</em>
              </h2>
              <p className="cream-section-body cream-reveal">
                AllocRail sits after Dodo revenue lands. It verifies the event,
                resolves the matching allocation rule, creates payout intents,
                and prepares the route for Solana settlement and receipts.
              </p>

              <div className="cream-how-steps cream-reveal">
                <div className="cream-how-step">
                  <div className="cream-step-num-box">01</div>
                  <div className="cream-step-content">
                    <h3>Dodo checkout completes</h3>
                    <p>
                      A hosted Dodo checkout session captures the payment and
                      carries routing metadata for workspace, merchant, rule,
                      and product tag.
                    </p>
                  </div>
                </div>
                <div className="cream-how-step">
                  <div className="cream-step-num-box">02</div>
                  <div className="cream-step-content">
                    <h3>Webhook verifies</h3>
                    <p>
                      AllocRail unwraps the signed Dodo webhook, enforces replay
                      protection and idempotency, and stores the event in its
                      inbox.
                    </p>
                  </div>
                </div>
                <div className="cream-how-step">
                  <div className="cream-step-num-box">03</div>
                  <div className="cream-step-content">
                    <h3>Rule engine matches</h3>
                    <p>
                      The metadata resolves to a founder-defined rule that maps
                      revenue into contractor escrow, tax reserve, founder
                      share, and AI-agent budget buckets.
                    </p>
                  </div>
                </div>
                <div className="cream-how-step">
                  <div className="cream-step-num-box">04</div>
                  <div className="cream-step-content">
                    <h3>Payout intents + receipt</h3>
                    <p>
                      AllocRail generates payout intents, marks approval
                      requirements, and snapshots a receipt that later links to
                      Solana settlement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="cream-reveal">
              <div className="cream-alloc-card">
                <div className="cream-alloc-header">
                  <span className="cream-alloc-title">Example founder rule</span>
                  <span className="cream-alloc-tag">live split</span>
                </div>
                <div className="cream-alloc-body">
                  {demoAllocationRule.buckets.map((bucket, index) => (
                    <div className="cream-alloc-row" key={bucket.kind}>
                      <div className="cream-alloc-row-top">
                        <div>
                          <div className="cream-alloc-label-row">
                            <span
                              className={`cream-alloc-dot ${
                                index === 0
                                  ? "cream-green"
                                  : index === 1
                                    ? "cream-amber"
                                    : index === 2
                                      ? "cream-purple"
                                      : "cream-blue"
                              }`}
                            />
                            <span className="cream-alloc-name">{bucket.label}</span>
                          </div>
                          <div className="cream-alloc-wallet">
                            {formatShortId(bucket.recipientWallet)}
                          </div>
                        </div>
                        <span className="cream-alloc-pct">
                          {bucket.percentageBps / 100}%
                        </span>
                      </div>
                      <div className="cream-bar-track">
                        <div
                          className={`cream-bar-fill ${
                            index === 0
                              ? "cream-green"
                              : index === 1
                                ? "cream-amber"
                                : index === 2
                                  ? "cream-purple"
                                  : "cream-blue"
                          }`}
                          style={{ width: `${bucket.percentageBps / 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cream-alloc-footer">
                  <span className="cream-alloc-footer-label">daily limit</span>
                  <span className="cream-alloc-footer-val">
                    {formatMoney(demoAllocationRule.dailyLimitCents, "USD")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cream-section">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"// capabilities"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            What AllocRail actually <em>does today.</em>
          </h2>

          <div className="cream-features-grid cream-reveal">
            {features.map((feature) => (
              <div className="cream-feature-card" key={feature.title}>
                <div className="cream-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cream-section" id="compare">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"// why solana"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            Why the payout rail has to be <em>Solana.</em>
          </h2>
          <p className="cream-section-body cream-reveal">
            Dodo solves global collection. AllocRail uses Solana where
            treasury routing benefits from speed, low fees, and verifiable
            execution.
          </p>

          <div className="cream-why-grid cream-reveal">
            {solanaReasons.map((reason, index) => (
              <div className="cream-why-card" key={reason.title}>
                <span className="cream-why-kicker">
                  0{index + 1}
                </span>
                <h3>{reason.title}</h3>
                <p>{reason.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cream-section cream-demo-section" id="demo">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <div className="cream-demo-layout">
            <div>
              <span className="cream-section-eyebrow cream-reveal">
                {"// try it live"}
              </span>
              <h2 className="cream-section-title cream-reveal">
                Simulate a <em>treasury route.</em>
              </h2>
              <p className="cream-section-body cream-reveal">
                Move the payment amount, inspect the split, then launch a real
                Dodo checkout with the same routing metadata wired into the
                webhook pipeline.
              </p>

              <div className="cream-demo-card cream-reveal" style={{ marginTop: "36px" }}>
                <div className="cream-demo-card-header">
                  <div className="cream-demo-dots">
                    <div className="cream-code-dot cream-dot-r" />
                    <div className="cream-code-dot cream-dot-y" />
                    <div className="cream-code-dot cream-dot-g" />
                  </div>
                  <span className="cream-demo-card-title">
                    allocrail - simulation sandbox
                  </span>
                </div>
                <div className="cream-demo-body">
                  <div className="cream-demo-field">
                    <span className="cream-demo-label">
                      Dodo payment amount (USD)
                    </span>
                    <div className="cream-demo-slider">
                      <input
                        type="range"
                        min="1000"
                        max="100000"
                        step="100"
                        value={amount}
                        onChange={(event) => setAmount(Number(event.target.value))}
                        className="cream-demo-range"
                        style={
                          {
                            "--val": `${((amount - 1000) / 99000) * 100}%`,
                          } as React.CSSProperties
                        }
                      />
                      <span className="cream-slider-val">
                        {formatMoney(amount, "USD")}
                      </span>
                    </div>
                  </div>

                  <div className="cream-demo-alloc-preview">
                    <div className="cream-demo-label" style={{ marginBottom: "12px" }}>
                      Allocation preview
                    </div>
                    {allocationPreview.map((bucket, index) => (
                      <div
                        className="cream-demo-alloc-row"
                        key={bucket.kind}
                        style={{
                          marginBottom:
                            index === allocationPreview.length - 1 ? "0" : "12px",
                        }}
                      >
                        <span className="cream-demo-alloc-label">
                          {bucket.label}
                        </span>
                        <div className="cream-demo-alloc-track">
                          <div
                            className={`cream-demo-alloc-fill ${
                              index === 0
                                ? "cream-green"
                                : index === 1
                                  ? "cream-amber"
                                  : index === 2
                                    ? "cream-purple"
                                    : "cream-blue"
                            }`}
                            style={{ width: `${bucket.percentageBps / 100}%` }}
                          />
                        </div>
                        <span
                          className="cream-demo-alloc-pct"
                          style={{
                            color:
                              index === 0
                                ? "var(--green)"
                                : index === 1
                                  ? "var(--amber)"
                                  : index === 2
                                    ? "var(--purple)"
                                    : "#3b6bb4",
                          }}
                        >
                          {formatMoney(bucket.amount, "USD")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="cream-demo-actions">
                    <button className="cream-simulate-btn" onClick={runSimulation}>
                      Preview route output
                    </button>
                    <CheckoutButton
                      metadata={checkoutMetadata}
                      email="founder-demo@allocrail.dev"
                      name="AllocRail Demo Customer"
                      label="Launch Dodo test checkout"
                      buttonClassName="!w-full !rounded-[10px] !bg-[#1a1714] !px-4 !py-3 !text-sm !font-semibold !text-white !shadow-none hover:!bg-[#1a6b4a]"
                      sessionClassName="font-mono text-[11px] leading-6 text-[var(--ink-muted)]"
                      statusClassName="text-sm leading-6 text-[var(--ink-muted)]"
                      errorClassName="text-sm leading-6 text-[var(--red)]"
                      onSessionCreated={(sessionId) => {
                        setTerminalLines((current) => [
                          ...current,
                          `Checkout session created - ${sessionId}`,
                        ]);
                      }}
                      onRedirect={() => {
                        setTerminalLines((current) => [
                          ...current,
                          "Redirecting to Dodo hosted checkout...",
                        ]);
                      }}
                      onError={(message) => {
                        setTerminalLines((current) => [
                          ...current,
                          `Checkout failed - ${message}`,
                        ]);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="cream-reveal">
              <div className="cream-terminal-card">
                <div className="cream-terminal-header">
                  <div className="cream-code-dot cream-dot-r" />
                  <div className="cream-code-dot cream-dot-y" />
                  <div className="cream-code-dot cream-dot-g" />
                  <span className="cream-code-filename">
                    allocrail - terminal output
                  </span>
                </div>
                <div className="cream-terminal-body">
                  {terminalLines.map((line, index) => (
                    <div className="cream-log-line" key={`${line}-${index}`}>
                      <span className="cream-log-time">
                        {String(index).padStart(2, "0")}:00:00
                      </span>
                      <span
                        className={
                          line.startsWith("OK")
                            ? "cream-log-msg cream-log-success"
                            : line.includes("Redirecting")
                              ? "cream-log-msg cream-log-info"
                              : "cream-log-msg"
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cream-demo-meta" style={{ marginTop: "16px" }}>
                <div className="cream-demo-label" style={{ marginBottom: "14px" }}>
                  Demo checkout metadata
                </div>
                <div className="cream-demo-meta-grid">
                  <div className="cream-demo-meta-row">
                    <span className="cream-demo-meta-key">workspace_id</span>
                    <span className="cream-demo-meta-value">
                      {checkoutMetadata.workspace_id}
                    </span>
                  </div>
                  <div className="cream-demo-meta-row">
                    <span className="cream-demo-meta-key">merchant_id</span>
                    <span className="cream-demo-meta-value">
                      {checkoutMetadata.merchant_id}
                    </span>
                  </div>
                  <div className="cream-demo-meta-row">
                    <span className="cream-demo-meta-key">rule_id</span>
                    <span className="cream-demo-meta-value">
                      {checkoutMetadata.rule_id}
                    </span>
                  </div>
                  <div className="cream-demo-meta-row">
                    <span className="cream-demo-meta-key">product_tag</span>
                    <span className="cream-demo-meta-value">
                      {checkoutMetadata.product_tag}
                    </span>
                  </div>
                  <div className="cream-demo-meta-rule" />
                  <div className="cream-demo-meta-row">
                    <span className="cream-demo-meta-key">route currency</span>
                    <span className="cream-demo-meta-value">USDC on Solana</span>
                  </div>
                  <div className="cream-demo-meta-row">
                    <span className="cream-demo-meta-key">cluster</span>
                    <span className="cream-demo-meta-value">devnet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cream-cta-section">
        <div className="cream-cta-inner">
          <h2 className="cream-cta-title">
            Dodo collects globally.
            <br />
            AllocRail routes <em>programmatically.</em>
            <br />
            Solana settles instantly.
          </h2>
          <p className="cream-cta-sub">
            One webhook. Programmable treasury. Built for the Solana Frontier.
          </p>
          <div className="cream-cta-btns">
            <a href="#demo" className="cream-cta-btn-a">
              Launch Treasury Demo
            </a>
            <a
              href="https://github.com/NikhilRaikwar/AllocRail"
              className="cream-cta-btn-b"
              target="_blank"
              rel="noreferrer"
            >
              View Source on GitHub {"->"}
            </a>
          </div>
        </div>
      </section>

      <footer className="cream-footer">
        <div className="cream-footer-left">
          AllocRail - Superteam India x Dodo Payments x Solana Frontier Hackathon
          2026
        </div>
        <div className="cream-footer-links">
          <a
            href="https://github.com/NikhilRaikwar/AllocRail"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://arena.colosseum.org/projects/explore/allocrail"
            target="_blank"
            rel="noreferrer"
          >
            Colosseum
          </a>
          <a href="https://x.com/AllocRail" target="_blank" rel="noreferrer">
            Twitter
          </a>
          <a
            href="https://docs.dodopayments.com"
            target="_blank"
            rel="noreferrer"
          >
            Dodo Docs
          </a>
        </div>
      </footer>
    </div>
  );
}
