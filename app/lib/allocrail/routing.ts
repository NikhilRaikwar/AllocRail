import { demoAllocationRule } from "./demo-data";
import { findAllocationRuleByMetadata } from "./event-store";
import { getTreasuryConfigForWorkspace } from "./founder";
import { isValidAllocationTotal } from "./metadata";
import type { AllocationRule, AllocRailReceipt, PayoutIntent, RevenueEvent } from "./types";

async function normalizeRevenueToSettlementCents(
  amountCents: number,
  sourceCurrencyRaw: string,
  workspaceId: string
) {
  const sourceCurrency = sourceCurrencyRaw.toUpperCase();

  if (sourceCurrency === "USD" || sourceCurrency === "USDC") {
    return amountCents;
  }

  if (sourceCurrency !== "INR") {
    return amountCents;
  }

  const treasuryConfig = await getTreasuryConfigForWorkspace(workspaceId);
  const rate = treasuryConfig.fxRateInrUsd;
  return Math.round(amountCents / rate);
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

export async function createPayoutIntents(
  event: RevenueEvent,
  rule: AllocationRule,
  settlementBasis?: {
    amountCents: number;
    currency: string;
  },
  options?: {
    includeKinds?: string[];
  }
): Promise<PayoutIntent[]> {
  const settlementAmountCents = settlementBasis
    ? await normalizeRevenueToSettlementCents(
        settlementBasis.amountCents,
        settlementBasis.currency,
        event.metadata.workspace_id
      )
    : await normalizeRevenueToSettlementCents(
        event.amountCents,
        event.currency,
        event.metadata.workspace_id
      );

  const includedKinds = options?.includeKinds ?? null;
  const buckets = includedKinds
    ? rule.buckets.filter((bucket) => includedKinds.includes(bucket.kind))
    : rule.buckets;

  return buckets.map((bucket) => ({
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
