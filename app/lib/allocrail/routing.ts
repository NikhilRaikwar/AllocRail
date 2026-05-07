import { demoAllocationRule } from "./demo-data";
import { findAllocationRuleByMetadata } from "./event-store";
import { isValidAllocationTotal } from "./metadata";
import type { AllocationRule, AllocRailReceipt, PayoutIntent, RevenueEvent } from "./types";

const FX_RATES_TO_USD: Partial<Record<string, number>> = {
  USD: 1,
  USDC: 1,
  INR: 83,
};

function normalizeRevenueToSettlementCents(event: RevenueEvent) {
  const sourceCurrency = event.currency.toUpperCase();
  const rate = FX_RATES_TO_USD[sourceCurrency];

  if (!rate) {
    return event.amountCents;
  }

  if (rate === 1) {
    return event.amountCents;
  }

  return Math.round(event.amountCents / rate);
}

function validateAllocationRule(rule: AllocationRule) {
  const totalBps = rule.buckets.reduce(
    (sum, bucket) => sum + bucket.percentageBps,
    0
  );

  if (!isValidAllocationTotal(totalBps)) {
    throw new Error(`Allocation rule ${rule.id} has an invalid total basis points`);
  }
}

export async function resolveAllocationRule(event: RevenueEvent): Promise<AllocationRule> {
  const matched = await findAllocationRuleByMetadata(event.metadata);

  if (matched) {
    validateAllocationRule(matched);
    return matched;
  }

  const matchesDemoRule =
    event.metadata.workspace_id === demoAllocationRule.workspaceId &&
    event.metadata.merchant_id === demoAllocationRule.merchantId &&
    event.metadata.rule_id === demoAllocationRule.id &&
    event.metadata.product_tag === demoAllocationRule.productTag;

  if (!matchesDemoRule) {
    throw new Error(
      `No allocation rule found for workspace ${event.metadata.workspace_id} and rule ${event.metadata.rule_id}`
    );
  }

  validateAllocationRule(demoAllocationRule);
  return demoAllocationRule;
}

export function createPayoutIntents(
  event: RevenueEvent,
  rule: AllocationRule
): PayoutIntent[] {
  const settlementAmountCents = normalizeRevenueToSettlementCents(event);

  return rule.buckets.map((bucket) => ({
    id: `po_${event.id}_${bucket.kind}`,
    revenueEventId: event.id,
    bucketKind: bucket.kind,
    recipientWallet: bucket.recipientWallet,
    amountCents: Math.floor((settlementAmountCents * bucket.percentageBps) / 10_000),
    currency: "USDC",
    requiresApproval: bucket.requiresApproval,
    status: bucket.requiresApproval ? "pending_approval" : "draft",
  }));
}

export function createReceipt(
  event: RevenueEvent,
  rule: AllocationRule,
  payoutIntents: PayoutIntent[]
): AllocRailReceipt {
  return {
    id: `rcpt_${event.id}`,
    revenueEvent: event,
    allocationRule: rule,
    payoutIntents,
  };
}
