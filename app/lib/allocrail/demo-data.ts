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
      label: "Shivam R. - Dev Contract",
      percentageBps: 4500,
      recipientWallet: "uzYzrbKEk6w4nwqYsi2R3LwEkdsbkUqa86nidtQg3Xx",
      requiresApproval: true,
    },
    {
      kind: "tax_reserve",
      label: "Tax Reserve - Q2",
      percentageBps: 1500,
      recipientWallet: "BQsTwJMBqMcd7y9vaaknSpbgXgybcF9vpFzrgRzqHV7q",
      requiresApproval: false,
    },
    {
      kind: "founder_share",
      label: "Founder Distribution",
      percentageBps: 3000,
      recipientWallet: "CHGrH66KAZgZowZaYsJQfUUpbvNi6koqArNetWoECTob",
      requiresApproval: false,
    },
    {
      kind: "agent_budget",
      label: "AI Agent Budget",
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

export const demoRecurringEvent: RevenueEvent = {
  id: "rev_demo_002",
  dodoEventId: "evt_dodo_demo_002",
  dodoSubscriptionId: "sub_dodo_demo_002",
  dodoCustomerId: "cus_dodo_demo_001",
  type: "subscription.renewed",
  amountCents: 10_500,
  currency: "USD",
  receivedAt: new Date("2026-05-06T00:00:00.000Z").toISOString(),
  metadata: {
    workspace_id: DEMO_WORKSPACE_ID,
    merchant_id: DEMO_MERCHANT_ID,
    rule_id: DEMO_RULE_ID,
    product_tag: "ai-pro-subscription",
  },
  eventContext: {
    routeKind: "recurring_route",
    subscriptionStatus: "active",
    nextBillingDate: "2026-06-06T00:00:00.000Z",
    summary: "Recurring subscription renewal settled into the founder treasury route.",
  },
};

export const demoBudgetEvent: RevenueEvent = {
  id: "rev_demo_003",
  dodoEventId: "evt_dodo_demo_003",
  dodoCustomerId: "cus_dodo_demo_001",
  type: "credit.added",
  amountCents: 0,
  currency: "USD",
  receivedAt: new Date("2026-05-06T00:04:00.000Z").toISOString(),
  creditEntitlementId: "cde_dodo_demo_001",
  creditEntitlementName: "AllocRail AI Agent Credits",
  metadata: {
    workspace_id: DEMO_WORKSPACE_ID,
    merchant_id: DEMO_MERCHANT_ID,
    rule_id: DEMO_RULE_ID,
    product_tag: "ai-pro-subscription",
  },
  eventContext: {
    routeKind: "budget_signal",
    summary: "AI agent credits were replenished from the latest founder billing cycle.",
    creditEntitlementId: "cde_dodo_demo_001",
    creditEntitlementName: "AllocRail AI Agent Credits",
  },
};

export const demoLifecycleEvent: RevenueEvent = {
  id: "rev_demo_004",
  dodoEventId: "evt_dodo_demo_004",
  dodoSubscriptionId: "sub_dodo_demo_002",
  dodoCustomerId: "cus_dodo_demo_001",
  type: "subscription.updated",
  amountCents: 10_500,
  currency: "USD",
  receivedAt: new Date("2026-05-06T00:08:00.000Z").toISOString(),
  metadata: {
    workspace_id: DEMO_WORKSPACE_ID,
    merchant_id: DEMO_MERCHANT_ID,
    rule_id: DEMO_RULE_ID,
    product_tag: "ai-pro-subscription",
  },
  eventContext: {
    routeKind: "lifecycle_signal",
    subscriptionStatus: "active",
    summary: "Subscription plan metadata changed. Founder review only; no new payout route was created.",
  },
};

function attachIntentProof(
  receipt: AllocRailReceipt,
  cluster: "devnet" | "mainnet-beta" = "devnet"
): AllocRailReceipt {
  return {
    ...receipt,
    payoutIntents: receipt.payoutIntents.map((intent, index) => ({
      ...intent,
      status: "confirmed",
      solanaCluster: cluster,
      solanaSignature: `5DemoSig${index}${receipt.id.slice(-6)}AllocRailConfirmed`,
      explorerUrl: `https://explorer.solana.com/tx/5DemoSig${index}${receipt.id.slice(
        -6
      )}AllocRailConfirmed?cluster=${cluster}`,
      submittedAt: receipt.revenueEvent.receivedAt,
      confirmedAt: receipt.revenueEvent.receivedAt,
    })),
  };
}

export function getSeededDashboardState() {
  const pendingReceipt = getDemoReceipt();
  const settledReceipt = attachIntentProof({
    id: "rcpt_allocrail_demo_002",
    revenueEvent: demoRecurringEvent,
    allocationRule: demoAllocationRule,
    payoutIntents: createDemoPayoutIntents(demoRecurringEvent, demoAllocationRule),
  });

  return {
    allocationRules: [demoAllocationRule],
    events: [demoRevenueEvent, demoRecurringEvent, demoBudgetEvent, demoLifecycleEvent],
    receipts: [pendingReceipt, settledReceipt],
    payoutIntents: [...pendingReceipt.payoutIntents, ...settledReceipt.payoutIntents],
  };
}
