import type {
  AllocationRule,
  AllocRailReceipt,
  PayoutIntent,
  RevenueEvent,
} from "./types";

export const DEMO_WORKSPACE_ID = "wrk_allocrail_demo";
export const DEMO_MERCHANT_ID = "mch_india_ai_saas";
export const DEMO_RULE_ID = "rule_ai_subscription_split";

export const demoAllocationRule: AllocationRule = {
  id: DEMO_RULE_ID,
  workspaceId: DEMO_WORKSPACE_ID,
  merchantId: DEMO_MERCHANT_ID,
  name: "AI SaaS revenue split",
  productTag: "ai-pro-subscription",
  currency: "USDC",
  dailyLimitCents: 25_000_00,
  enabled: true,
  buckets: [
    {
      kind: "contractor_escrow",
      label: "Contractor escrow",
      percentageBps: 4500,
      recipientWallet: "uzYzrbKEk6w4nwqYsi2R3LwEkdsbkUqa86nidtQg3Xx",
      requiresApproval: true,
    },
    {
      kind: "tax_reserve",
      label: "Tax reserve",
      percentageBps: 1500,
      recipientWallet: "BQsTwJMBqMcd7y9vaaknSpbgXgybcF9vpFzrgRzqHV7q",
      requiresApproval: false,
    },
    {
      kind: "founder_share",
      label: "Founder share",
      percentageBps: 3000,
      recipientWallet: "CHGrH66KAZgZowZaYsJQfUUpbvNi6koqArNetWoECTob",
      requiresApproval: false,
    },
    {
      kind: "agent_budget",
      label: "AI-agent budget",
      percentageBps: 1000,
      recipientWallet: "HL4kKQoby1VeifzWQtX8hJqeW2CZT5ADTM16cHcbUKgi",
      requiresApproval: true,
    },
  ],
};

export const demoRevenueEvent: RevenueEvent = {
  id: "rev_demo_001",
  dodoEventId: "evt_dodo_demo_001",
  dodoPaymentId: "pay_dodo_demo_001",
  checkoutSessionId: "cks_dodo_demo_001",
  type: "payment.succeeded",
  amountCents: 11_13_762,
  currency: "INR",
  receivedAt: new Date("2026-05-05T00:00:00.000Z").toISOString(),
  metadata: {
    workspace_id: DEMO_WORKSPACE_ID,
    merchant_id: DEMO_MERCHANT_ID,
    rule_id: DEMO_RULE_ID,
    product_tag: "ai-pro-subscription",
  },
};

export function createDemoPayoutIntents(
  event: RevenueEvent,
  rule: AllocationRule
): PayoutIntent[] {
  return rule.buckets.map((bucket) => ({
    id: `po_${event.id}_${bucket.kind}`,
    revenueEventId: event.id,
    bucketKind: bucket.kind,
    recipientWallet: bucket.recipientWallet,
    amountCents: Math.floor(
      (event.amountCents * bucket.percentageBps) / 10_000
    ),
    currency: "USDC",
    requiresApproval: bucket.requiresApproval,
    status: bucket.requiresApproval ? "pending_approval" : "draft",
  }));
}

export function getDemoReceipt(): AllocRailReceipt {
  return {
    id: "rcpt_allocrail_demo_001",
    revenueEvent: demoRevenueEvent,
    allocationRule: demoAllocationRule,
    payoutIntents: createDemoPayoutIntents(
      demoRevenueEvent,
      demoAllocationRule
    ),
  };
}
