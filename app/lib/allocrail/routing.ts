import { demoAllocationRule } from "./demo-data";
import { isValidAllocationTotal } from "./metadata";
import type { AllocationRule, AllocRailReceipt, PayoutIntent, RevenueEvent } from "./types";

export function resolveAllocationRule(event: RevenueEvent): AllocationRule {
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

  const totalBps = demoAllocationRule.buckets.reduce(
    (sum, bucket) => sum + bucket.percentageBps,
    0
  );

  if (!isValidAllocationTotal(totalBps)) {
    throw new Error(`Allocation rule ${demoAllocationRule.id} has an invalid total basis points`);
  }

  return demoAllocationRule;
}

export function createPayoutIntents(
  event: RevenueEvent,
  rule: AllocationRule
): PayoutIntent[] {
  return rule.buckets.map((bucket) => ({
    id: `po_${event.id}_${bucket.kind}`,
    revenueEventId: event.id,
    bucketKind: bucket.kind,
    recipientWallet: bucket.recipientWallet,
    amountCents: Math.floor((event.amountCents * bucket.percentageBps) / 10_000),
    currency: "USDC",
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
