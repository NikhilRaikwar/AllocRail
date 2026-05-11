"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckoutButton } from "./components/checkout-button";
import { ClusterSelect } from "./components/cluster-select";
import { ThemeToggle } from "./components/theme-toggle";
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
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Who it's for", href: "#who" },
  { label: "Why Solana", href: "#compare" },
  { label: "Live Demo", href: "#demo" },
];

const proofCards = [
  {
    value: "Dodo live",
    title: "Checkout + webhook",
    copy: "Hosted checkout, verified webhook ingestion, and routing metadata already run end to end.",
  },
  {
    value: "Rules",
    title: "Founder-defined splits",
    copy: "Each payment can expand into contractor, reserve, founder, and AI-agent treasury buckets.",
  },
  {
    value: "Wallet-bound",
    title: "Execution control",
    copy: "Sensitive settlement stays tied to the founder wallet instead of an app-controlled signer.",
  },
  {
    value: "Receipts",
    title: "Audit surface",
    copy: "Receipts tie the Dodo event, allocation rule, payout intents, and payout proof into one route view.",
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

const allocationDisplayMeta: Record<string, string> = {
  contractor_escrow: "Primary dev contractor route",
  tax_reserve: "Reserved for quarterly compliance",
  founder_share: "Core founder treasury distribution",
  agent_budget: "Programmatic AI operations budget",
};

const trustItems = [
  {
    title: "Founder auth",
    copy: "Supabase login protects dashboard access, route configuration, receipts, and refund review history.",
  },
  {
    title: "Wallet binding",
    copy: "A treasury operator wallet is cryptographically bound to the founder profile before any sensitive action is allowed.",
  },
  {
    title: "Wallet-signed execution",
    copy: "Treasury routes execute from the bound wallet so settlement authority stays with the founder, not an env signer.",
  },
];

const features = [
  {
    icon: "webhook",
    sceneIndex: 0,
    title: "Verified Webhooks",
    copy: "Cryptographic signature verification via the Dodo SDK, replay protection, and webhook-id idempotency before any treasury action is created.",
  },
  {
    icon: "rules",
    sceneIndex: 1,
    title: "Programmable Rules",
    copy: "Basis-point allocation logic per Dodo product and event type, validated to exactly 10,000 bps before route generation.",
  },
  {
    icon: "queue",
    sceneIndex: 1,
    title: "Payout Intents",
    copy: "Each verified revenue event becomes structured payout intents with status, recipient wallet, and approval requirements.",
  },
  {
    icon: "settlement",
    sceneIndex: 2,
    title: "Stablecoin Settlement Path",
    copy: "The route is prepared for Solana USDC settlement so one payment can fan out into multiple treasury destinations cheaply.",
  },
  {
    icon: "receipt",
    sceneIndex: 3,
    title: "Audit Receipts",
    copy: "Every route snapshots the Dodo event, matched rule, recipient wallets, and payout amounts into one inspectable receipt record.",
  },
  {
    icon: "shield",
    sceneIndex: 2,
    title: "Refund / dispute holds",
    copy: "Quarantine and hold logic keep contested revenue from moving before it is safe to distribute.",
  },
];

const dashboardFlowScenes = [
  {
    nav: "Events",
    panelTag: "Dodo verified",
    title: "Verified revenue event received",
    body: "A hosted Dodo checkout completes, the signed webhook lands, and AllocRail stores the event in the founder revenue inbox.",
    cta: "Webhook verified",
    metrics: [
      {
        label: "Revenue inbox",
        value: "payment.succeeded",
        meta: "Payment event captured with checkout and payment references attached.",
      },
      {
        label: "Routing metadata",
        value: "workspace + rule",
        meta: "workspace_id, merchant_id, rule_id, and product_tag resolve the treasury route.",
      },
      {
        label: "Safety",
        value: "Replay blocked",
        meta: "Signature checks and webhook idempotency run before any treasury action is created.",
      },
      {
        label: "Status",
        value: "Inbox ready",
        meta: "The founder can now inspect the matched event before payout logic begins.",
      },
    ],
    rows: [
      {
        bucket: "Revenue event inbox",
        status: "verified",
        amount: "$111.38",
        note: "Checkout session and payment reference attached",
      },
      {
        bucket: "Rule resolver",
        status: "matched",
        amount: "AI split",
        note: "Founder route resolved from Dodo metadata",
      },
    ],
  },
  {
    nav: "Routes",
    panelTag: "Rule matched",
    title: "Treasury route expanded into payout intents",
    body: "AllocRail turns the incoming revenue event into contractor, reserve, founder, and AI-agent payout intents with explicit control states.",
    cta: "Queue prepared",
    metrics: [
      {
        label: "Open routes",
        value: "4 payout intents",
        meta: "Each bucket gets its own amount, status, wallet, and receipt linkage.",
      },
      {
        label: "Pending approvals",
        value: "2 buckets",
        meta: "Contractor and AI-agent routes wait for founder approval.",
      },
      {
        label: "Auto-eligible",
        value: "2 buckets",
        meta: "Founder share and reserve routes are ready once execution begins.",
      },
      {
        label: "Receipt draft",
        value: "Created",
        meta: "The route already has a linked receipt shell before on-chain settlement.",
      },
    ],
    rows: [
      {
        bucket: "Contractor escrow",
        status: "pending approval",
        amount: "$50.12",
        note: "Founder approval required",
      },
      {
        bucket: "Founder share",
        status: "ready",
        amount: "$33.41",
        note: "Auto-eligible on execution",
      },
      {
        bucket: "Tax reserve",
        status: "ready",
        amount: "$16.70",
        note: "Reserve bucket queued",
      },
      {
        bucket: "AI-agent budget",
        status: "pending approval",
        amount: "$11.14",
        note: "Budget route awaiting founder review",
      },
    ],
  },
  {
    nav: "Routes",
    panelTag: "Founder approved",
    title: "Founder reviews sensitive payout buckets",
    body: "Approval-required intents move from pending to approved before any wallet-signed settlement can begin.",
    cta: "Approval granted",
    metrics: [
      {
        label: "Pending approvals",
        value: "0 remaining",
        meta: "Sensitive buckets are explicitly approved in the founder queue.",
      },
      {
        label: "Execution state",
        value: "Ready to sign",
        meta: "The route is now eligible for wallet-bound settlement.",
      },
      {
        label: "Guardrails",
        value: "Founder-controlled",
        meta: "Nothing moves until the bound treasury operator wallet signs.",
      },
      {
        label: "Receipt state",
        value: "Awaiting proof",
        meta: "The receipt is ready to attach the Solana transaction once confirmed.",
      },
    ],
    rows: [
      {
        bucket: "Contractor escrow",
        status: "approved",
        amount: "$50.12",
        note: "Founder approval recorded",
      },
      {
        bucket: "Founder share",
        status: "ready",
        amount: "$33.41",
        note: "Auto-eligible on execution",
      },
      {
        bucket: "Tax reserve",
        status: "ready",
        amount: "$16.70",
        note: "Reserve bucket queued",
      },
      {
        bucket: "AI-agent budget",
        status: "approved",
        amount: "$11.14",
        note: "Budget route approved by founder",
      },
    ],
  },
  {
    nav: "Receipts",
    panelTag: "Solana signed",
    title: "Wallet-bound execution settles the route",
    body: "The founder wallet signs the route, Solana USDC settlement fans out to multiple recipients, and proof is attached back to the route.",
    cta: "Settlement submitted",
    metrics: [
      {
        label: "Settlement rail",
        value: "Solana USDC",
        meta: "Multi-recipient route prepared and signed from the founder-bound wallet.",
      },
      {
        label: "Execution proof",
        value: "Signature linked",
        meta: "Explorer reference and cluster details attach back to the route.",
      },
      {
        label: "Recipient state",
        value: "4 destinations",
        meta: "Each bucket can settle without moving through bank-style manual ops.",
      },
      {
        label: "Receipt status",
        value: "Audit-ready",
        meta: "Revenue source, rule match, and payout proof now live together.",
      },
    ],
    rows: [
      {
        bucket: "Contractor escrow",
        status: "confirmed",
        amount: "$50.12",
        note: "Wallet-signed USDC route confirmed",
      },
      {
        bucket: "Founder share",
        status: "confirmed",
        amount: "$33.41",
        note: "Founder treasury route confirmed",
      },
      {
        bucket: "Tax reserve",
        status: "confirmed",
        amount: "$16.70",
        note: "Reserve bucket confirmed",
      },
      {
        bucket: "AI-agent budget",
        status: "confirmed",
        amount: "$11.14",
        note: "Agent budget route confirmed",
      },
    ],
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

function FeatureIcon({ kind }: { kind: string }) {
  const stroke = "currentColor";

  switch (kind) {
    case "webhook":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 7a5 5 0 0 1 8 4v1" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 17a5 5 0 0 1-8-4v-1" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 5h3v3" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 19H6v-3" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rules":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 7h12" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 12h8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 17h10" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="12" r="2" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case "queue":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="14" height="4" rx="1.5" stroke={stroke} strokeWidth="1.8" />
          <rect x="5" y="10" width="14" height="4" rx="1.5" stroke={stroke} strokeWidth="1.8" />
          <rect x="5" y="15" width="14" height="4" rx="1.5" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case "settlement":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 7l5 5-5 5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 17l-5-5 5-5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "receipt":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 5h8l3 3v11l-2-1-2 1-2-1-2 1-2-1-2 1V5z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 10h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 14h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4l7 3v5c0 4.5-2.9 7.5-7 8-4.1-.5-7-3.5-7-8V7l7-3z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.5 12l1.7 1.7L14.8 10" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function getRouteBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("pending")) {
    return "pending";
  }

  if (normalized.includes("ready")) {
    return "ready";
  }

  if (normalized.includes("verified")) {
    return "verified";
  }

  if (normalized.includes("matched")) {
    return "matched";
  }

  if (normalized.includes("approved")) {
    return "approved";
  }

  if (normalized.includes("confirmed")) {
    return "confirmed";
  }

  return "";
}

function DashboardNavIcon({ label }: { label: string }) {
  const stroke = "currentColor";

  switch (label) {
    case "Overview":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12.5 12 5l8 7.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 10.5V19h10v-8.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Events":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 8h12M6 12h12M6 16h8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <rect x="4" y="5" width="16" height="14" rx="3" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case "Routes":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 6h4v4H7zM13 14h4v4h-4z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M11 8h3a3 3 0 0 1 3 3v3" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "Receipts":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 5h8l3 3v11l-2-1.5L15 19l-3-1.5L9 19l-2-1.5L5 19V5h3Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 10h6M9 13h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "Rules":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7h10M7 12h7M7 17h4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16.5" cy="12" r="2.5" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  const [amount, setAmount] = useState(11138);
  const [dashboardSceneIndex, setDashboardSceneIndex] = useState(0);
  const [activeRouteRowIndex, setActiveRouteRowIndex] = useState(0);
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDashboardSceneIndex((current) => (current + 1) % dashboardFlowScenes.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const allocationPreview = demoAllocationRule.buckets.map((bucket) => ({
    ...bucket,
    amount: Math.round(amount * (bucket.percentageBps / 10_000)),
  }));
  const dashboardScene = useMemo(
    () => dashboardFlowScenes[dashboardSceneIndex],
    [dashboardSceneIndex]
  );

  useEffect(() => {
    setActiveRouteRowIndex(0);
  }, [dashboardSceneIndex]);

  useEffect(() => {
    if (dashboardScene.rows.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveRouteRowIndex((current) => (current + 1) % dashboardScene.rows.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [dashboardScene]);

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

        .cream-auth-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid var(--cta-outline);
          background: var(--surface);
          color: var(--ink) !important;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
        }

        .cream-auth-btn:hover {
          background: var(--cream-dark);
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

        .cream-hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          background: var(--border);
          box-shadow: var(--shadow-sm);
          margin: 0 auto;
          max-width: 1100px;
        }

        .cream-hero-stat-card {
          min-height: 168px;
          background: color-mix(in srgb, var(--surface-strong) 88%, transparent);
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }

        .cream-hero-stat-value {
          font-family: var(--serif);
          font-size: 34px;
          line-height: 1;
          letter-spacing: -1.5px;
          color: var(--green);
          font-style: italic;
        }

        .cream-hero-stat-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
        }

        .cream-hero-stat-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.65;
          color: var(--ink-muted);
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
          grid-template-columns: 1.35fr 1fr;
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

        .cream-proof-card-wide {
          min-height: 240px;
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
            transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
            background: var(--surface);
            border: none;
            width: 100%;
            text-align: left;
            cursor: pointer;
            font: inherit;
            color: inherit;
          }

          .cream-feature-card:hover,
          .cream-feature-card:focus-visible,
          .cream-feature-card.active {
            background: var(--cream);
            box-shadow: inset 0 0 0 1px rgba(26, 107, 74, 0.18);
          }

          .dark .cream-feature-card:hover,
          .dark .cream-feature-card:focus-visible,
          .dark .cream-feature-card.active {
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
          margin-bottom: 18px;
          border: 1px solid var(--border);
          background: var(--cream);
          color: var(--ink);
        }

        .cream-feature-icon svg {
          width: 18px;
          height: 18px;
        }

        .cream-feature-card h3 {
          font-size: 17px;
          margin-bottom: 10px;
        }

          .cream-dashboard-shell {
            border: 1px solid var(--border-strong);
            border-radius: 12px;
            overflow: hidden;
            background: var(--surface-strong);
            box-shadow: var(--shadow-lg);
            margin-top: 56px;
            width: 100%;
          }

        .cream-dashboard-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.65);
        }

        .cream-dashboard-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--serif);
          font-size: 24px;
          font-style: italic;
          letter-spacing: -0.03em;
        }

        .cream-dashboard-brand-mark {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: var(--green);
          box-shadow: 0 0 0 6px rgba(26, 107, 74, 0.12);
        }

        .cream-dashboard-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .cream-dashboard-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-family: var(--mono);
          font-size: 11px;
          color: var(--ink-muted);
          letter-spacing: 0.02em;
        }

        .cream-dashboard-chip.primary {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }

          .cream-dashboard-body {
            display: grid;
            grid-template-columns: 78px minmax(0, 1fr);
            min-height: 620px;
          }

          .cream-dashboard-sidebar {
            border-right: 1px solid var(--border);
            padding: 18px 10px;
            background: linear-gradient(180deg, rgba(239, 231, 219, 0.55), rgba(255, 253, 250, 0.7));
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .cream-dashboard-navitem {
            border-radius: 16px;
            border: 1px solid transparent;
            padding: 10px 6px;
            min-height: 72px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: var(--mono);
            font-size: 10px;
            color: var(--ink-faint);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-align: center;
          }

        .cream-dashboard-navitem.active {
          color: var(--green);
          border-color: rgba(26, 107, 74, 0.18);
          background: rgba(26, 107, 74, 0.08);
        }

          .cream-dashboard-navitem.live {
            position: relative;
            color: var(--ink);
            border-color: rgba(26, 23, 20, 0.08);
          }

          .cream-dashboard-navitem.live::after {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--green);
            box-shadow: 0 0 0 4px rgba(26, 107, 74, 0.08);
          }

          .cream-dashboard-navicon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--ink-soft);
          }

          .cream-dashboard-navicon svg {
            width: 16px;
            height: 16px;
          }

        .cream-dashboard-main {
          padding: 22px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cream-dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

          .cream-dashboard-heading {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-height: 128px;
          }

        .cream-dashboard-heading h3 {
          margin: 0;
          font-family: var(--serif);
          font-size: clamp(28px, 3vw, 38px);
          line-height: 0.96;
          letter-spacing: -0.05em;
        }

        .cream-dashboard-heading p {
          margin: 0;
          max-width: 520px;
          font-size: 15px;
          line-height: 1.65;
          color: var(--ink-muted);
        }

        .cream-dashboard-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

          .cream-dashboard-metrics {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            align-items: stretch;
          }

        .cream-dashboard-metric {
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--surface);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 150px;
        }

        .cream-dashboard-metric-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .cream-dashboard-metric-value {
          font-family: var(--serif);
          font-size: clamp(22px, 2.2vw, 30px);
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .cream-dashboard-metric p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--ink-muted);
        }

          .cream-dashboard-panel {
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--surface);
            overflow: hidden;
            min-height: 320px;
          }

          .cream-dashboard-shell,
          .cream-dashboard-metric,
          .cream-route-row,
          .cream-dashboard-panel-tag,
          .cream-route-badge {
            transition:
              background-color 0.28s ease,
              border-color 0.28s ease,
              box-shadow 0.28s ease,
              color 0.28s ease,
              opacity 0.28s ease,
              transform 0.28s ease;
          }

        .cream-dashboard-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
        }

        .cream-dashboard-panel-title {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cream-dashboard-panel-title h4 {
          margin: 0;
          font-size: 18px;
          line-height: 1.1;
        }

        .cream-dashboard-panel-title p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--ink-muted);
        }

        .cream-dashboard-panel-tag {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--green);
          border: 1px solid rgba(26, 107, 74, 0.18);
          background: rgba(26, 107, 74, 0.08);
          border-radius: 999px;
          padding: 8px 10px;
        }

          .cream-route-table {
            display: grid;
            min-height: 250px;
          }

          .cream-route-row {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) auto;
            gap: 16px;
            padding: 16px 18px;
            border-top: 1px solid var(--border);
            align-items: center;
            position: relative;
          }

          .cream-route-row:first-child {
            border-top: none;
          }

          .cream-route-row:hover,
          .cream-route-row.active {
            background: rgba(26, 107, 74, 0.04);
          }

          .cream-route-row.active::before {
            content: "";
            position: absolute;
            left: 0;
            top: 12px;
            bottom: 12px;
            width: 3px;
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(26, 107, 74, 0.15), var(--green), rgba(26, 107, 74, 0.15));
          }

          @media (prefers-reduced-motion: reduce) {
            .cream-dashboard-shell,
            .cream-dashboard-metric,
            .cream-route-row,
            .cream-dashboard-panel-tag,
            .cream-route-badge,
            .cream-feature-card {
              transition: none;
            }
          }

          @media (max-width: 1200px) {
            .cream-dashboard-body {
              min-height: 0;
            }

            .cream-dashboard-heading {
              min-height: 0;
            }

            .cream-dashboard-main {
              padding: 20px;
            }
          }

          .cream-route-bucket {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .cream-route-bucket strong {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }

        .cream-route-bucket span,
        .cream-route-status small {
          font-size: 12px;
          line-height: 1.5;
          color: var(--ink-muted);
        }

        .cream-route-status {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cream-route-badge {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 5px 10px;
          font-family: var(--mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--border);
          color: var(--ink-soft);
          background: var(--surface-strong);
        }

        .cream-route-badge.pending {
          color: var(--amber);
          border-color: rgba(155, 110, 26, 0.18);
          background: rgba(245, 237, 212, 0.8);
        }

        .cream-route-badge.ready {
          color: var(--green);
          border-color: rgba(26, 107, 74, 0.18);
          background: rgba(212, 234, 224, 0.6);
        }

        .cream-route-badge.verified,
        .cream-route-badge.matched {
          color: #3b6bb4;
          border-color: rgba(59, 107, 180, 0.18);
          background: rgba(234, 240, 248, 0.9);
        }

        .cream-route-badge.approved {
          color: var(--purple);
          border-color: rgba(91, 63, 166, 0.18);
          background: rgba(234, 228, 245, 0.9);
        }

        .cream-route-badge.confirmed {
          color: var(--green);
          border-color: rgba(26, 107, 74, 0.18);
          background: rgba(212, 234, 224, 0.9);
        }

        .cream-route-amount {
          font-family: var(--serif);
          font-size: 22px;
          line-height: 1;
          letter-spacing: -0.04em;
          justify-self: end;
        }

        .cream-demo-layout {
          align-items: start;
        }

        .cream-quote-card {
          margin-top: 40px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          padding: 30px 28px;
          max-width: 840px;
        }

        .cream-quote-text {
          margin: 0 0 18px;
          font-family: var(--serif);
          font-style: italic;
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1.25;
          letter-spacing: -0.8px;
          color: var(--ink);
        }

        .cream-quote-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-muted);
        }

        .cream-quote-meta span:first-child {
          color: var(--green);
          font-weight: 700;
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
          .cream-demo-layout,
          .cream-dashboard-body {
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

          .cream-hero-stats {
            grid-template-columns: 1fr 1fr;
          }

            .cream-dashboard-sidebar {
              flex-direction: row;
              overflow-x: auto;
              border-right: none;
              border-bottom: 1px solid var(--border);
            }

              .cream-dashboard-navitem {
                min-width: 120px;
                min-height: 64px;
              }

            .cream-dashboard-topbar-right {
              width: 100%;
              justify-content: flex-start;
            }

            .cream-dashboard-metrics {
              grid-template-columns: 1fr;
            }

          .cream-route-row {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .cream-route-amount {
            justify-self: start;
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

          .cream-hero-stat-card {
            min-height: 150px;
          }

          .cream-slider-val {
            min-width: 88px;
            font-size: 24px;
          }

          .cream-dashboard-topbar,
          .cream-dashboard-main {
            padding-left: 16px;
            padding-right: 16px;
          }

          .cream-dashboard-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

            .cream-dashboard-topbar-right,
            .cream-dashboard-header-actions {
              justify-content: flex-start;
            }

            .cream-dashboard-chip {
              min-height: 32px;
              padding: 0 10px;
              font-size: 10px;
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

          .cream-hero-stats {
            grid-template-columns: 1fr;
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
          <a href="/login" className="cream-auth-btn">
            Founder Login / Sign up
          </a>
          <ThemeToggle />
          <ClusterSelect />
        </div>
      </nav>

      <section className="cream-hero" id="top">
        <div className="cream-hero-eyebrow">
          <span className="cream-eyebrow-pip" />
          Superteam India x Dodo Payments x Solana Frontier 2026
        </div>

        <h1 className="cream-hero-title">
          <span>
            Turn Dodo revenue into <em>instant Solana treasury payouts.</em>
          </span>
        </h1>

        <p className="cream-hero-sub">
          Built for Indian SaaS founders paying global contractors without wire
          fees. AllocRail turns every verified Dodo payment into founder-ready
          contractor, reserve, founder, and AI-agent treasury routes.
        </p>

        <div className="cream-hero-actions">
          <a href="/dashboard" className="cream-cta-primary">
            Open Founder Dashboard
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

        <div className="cream-hero-stats">
          {proofCards.map((card) => (
            <div className="cream-hero-stat-card" key={card.title}>
              <div className="cream-hero-stat-value">{card.value}</div>
              <div className="cream-hero-stat-title">{card.title}</div>
              <p>{card.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cream-section cream-proof-section">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"Proof"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            Not another stablecoin checkout. <em>Treasury logic after payment.</em>
          </h2>
          <div className="cream-proof-grid cream-reveal">
            <div className="cream-proof-card cream-proof-card-wide">
              <span className="cream-proof-value">Verified</span>
              <h3>Dodo webhook {"->"} one treasury route</h3>
              <p>
                AllocRail verifies the signed Dodo event, rejects replays, and
                expands one payment into founder-safe payout routes with
                approval controls and a receipt-linked audit trail.
              </p>
            </div>
            <div className="cream-proof-card">
              <span className="cream-proof-value">Hold logic</span>
              <h3>Refund and dispute aware</h3>
              <p>
                Quarantine and approval controls stop founders from routing
                contested revenue before it is safe to distribute.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cream-section" id="product">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"Product preview"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            The founder dashboard is the <em>actual product surface.</em>
          </h2>
          <p className="cream-section-body cream-reveal">
            AllocRail should look like treasury software, not a checkout wrapper.
            Founders need one place to review revenue events, inspect route logic,
            approve sensitive buckets, and confirm payout proof.
          </p>

          <div className="cream-dashboard-shell cream-reveal">
            <div className="cream-dashboard-topbar">
              <div className="cream-dashboard-brand">
                <span className="cream-dashboard-brand-mark" />
                <span>AllocRail</span>
              </div>
              <div className="cream-dashboard-topbar-right">
                <span className="cream-dashboard-chip">Solana devnet</span>
                <span className="cream-dashboard-chip">USDC routes</span>
                <span className="cream-dashboard-chip primary">{dashboardScene.cta}</span>
              </div>
            </div>

            <div className="cream-dashboard-body">
                <div className="cream-dashboard-sidebar">
                  {["Overview", "Events", "Routes", "Receipts", "Rules"].map((item) => (
                    <div
                      key={item}
                      className={`cream-dashboard-navitem ${
                        item === dashboardScene.nav ? "active live" : ""
                      }`}
                    >
                      <span className="cream-dashboard-navicon">
                        <DashboardNavIcon label={item} />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

              <div className="cream-dashboard-main">
                <div className="cream-dashboard-header">
                  <div className="cream-dashboard-heading">
                    <h3>{dashboardScene.title}</h3>
                    <p>{dashboardScene.body}</p>
                  </div>
                  <div className="cream-dashboard-header-actions">
                    <span className="cream-dashboard-chip">Run demo payment</span>
                    <span className="cream-dashboard-chip primary">{dashboardScene.panelTag}</span>
                  </div>
                </div>

                <div className="cream-dashboard-metrics">
                  {dashboardScene.metrics.map((metric) => (
                    <div className="cream-dashboard-metric" key={metric.label}>
                      <span className="cream-dashboard-metric-label">{metric.label}</span>
                      <span className="cream-dashboard-metric-value">{metric.value}</span>
                      <p>{metric.meta}</p>
                    </div>
                  ))}
                </div>

                <div className="cream-dashboard-panel">
                  <div className="cream-dashboard-panel-header">
                    <div className="cream-dashboard-panel-title">
                      <h4>Current route state</h4>
                      <p>{dashboardScene.body}</p>
                    </div>
                    <span className="cream-dashboard-panel-tag">{dashboardScene.panelTag}</span>
                  </div>

                    <div className="cream-route-table">
                      {dashboardScene.rows.map((row, index) => (
                        <div
                          className={`cream-route-row ${index === activeRouteRowIndex ? "active" : ""}`}
                          key={row.bucket}
                        >
                          <div className="cream-route-bucket">
                            <strong>{row.bucket}</strong>
                            <span>{row.note}</span>
                          </div>
                          <div className="cream-route-status">
                            <span className={`cream-route-badge ${getRouteBadgeClass(row.status)}`}>
                              {row.status}
                            </span>
                            <small>Wallet-bound settlement path</small>
                          </div>
                          <div className="cream-route-amount">{row.amount}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cream-section" id="who">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
              <span className="cream-section-eyebrow cream-reveal">
                {"Who it's for"}
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
                {"How it works"}
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
                            {allocationDisplayMeta[bucket.kind]}
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
            {"Capabilities"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            What AllocRail actually <em>does today.</em>
          </h2>

            <div className="cream-features-grid cream-reveal">
              {features.map((feature) => (
                <button
                  type="button"
                  className={`cream-feature-card ${feature.sceneIndex === dashboardSceneIndex ? "active" : ""}`}
                  key={feature.title}
                  onClick={() => setDashboardSceneIndex(feature.sceneIndex)}
                >
                  <div className="cream-feature-icon">
                    <FeatureIcon kind={feature.icon} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </button>
              ))}
            </div>
        </div>
      </section>

      <section className="cream-section" id="compare">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"Why Solana"}
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

      <section className="cream-section">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"Why it matters"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            Built around a workflow founders still <em>run manually.</em>
          </h2>
          <div className="cream-proof-grid cream-reveal">
            <div className="cream-proof-card cream-proof-card-wide">
              <span className="cream-proof-value">After revenue lands</span>
              <h3>Contractors, reserves, and founder payouts still leave the billing stack</h3>
              <p>
                The pain starts after checkout succeeds. Teams still reconcile
                contractor payouts, reserves, and internal budgets across
                spreadsheets, bank tools, and manual approval loops.
              </p>
            </div>
            <div className="cream-proof-card">
              <span className="cream-proof-value">AllocRail wedge</span>
              <h3>Post-revenue treasury routing</h3>
              <p>
                Dodo already handles collection. AllocRail exists to turn that
                verified revenue into controlled treasury movement with proof and
                founder oversight.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cream-section">
        <hr className="cream-section-divider" />
        <div className="cream-section-inner">
          <span className="cream-section-eyebrow cream-reveal">
            {"Trust"}
          </span>
          <h2 className="cream-section-title cream-reveal">
            Founder controls stay <em>explicit and provable.</em>
          </h2>
          <div className="cream-persona-grid cream-reveal">
            {trustItems.map((item, index) => (
              <div className="cream-persona-card" key={item.title}>
                <span className="cream-persona-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
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
                {"Try it live"}
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
