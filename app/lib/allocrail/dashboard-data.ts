import {
  listAllocationRules,
  listRecentPayoutIntents,
  listRecentReceipts,
  listRecentRevenueEvents,
} from "@/app/lib/allocrail/event-store";
import type {
  AllocationBucketKind,
  AllocationRule,
  AllocRailReceipt,
  PayoutIntent,
  RevenueEvent,
} from "@/app/lib/allocrail/types";

type BucketSummary = {
  kind: AllocationBucketKind;
  label: string;
  percentageBps: number;
  count: number;
  amountCents: number;
  pendingApproval: number;
};

function isOpenIntent(intent: PayoutIntent) {
  return (
    intent.status === "draft" ||
    intent.status === "pending_approval" ||
    intent.status === "approved" ||
    intent.status === "submitted" ||
    intent.status === "failed" ||
    intent.status === "quarantined"
  );
}

function summarizeBuckets(
  sourceIntents: PayoutIntent[],
  allocationRule: AllocationRule | null
): BucketSummary[] {
  return (allocationRule?.buckets ?? []).map((bucket) => {
    const matching = sourceIntents.filter(
      (intent) => intent.bucketKind === bucket.kind
    );

    return {
      kind: bucket.kind,
      label: bucket.label,
      percentageBps: bucket.percentageBps,
      count: matching.length,
      amountCents: matching.reduce((sum, intent) => sum + intent.amountCents, 0),
      pendingApproval: matching.filter(
        (intent) => intent.status === "pending_approval"
      ).length,
    };
  });
}

export type DashboardSnapshot = {
  allocationRules: AllocationRule[];
  events: RevenueEvent[];
  payoutIntents: PayoutIntent[];
  receipts: AllocRailReceipt[];
  latestEvent: RevenueEvent | null;
  latestReceipt: AllocRailReceipt | null;
  allocationRule: AllocationRule | null;
  webhookReady: boolean;
  metrics: {
    eventCount: number;
    payoutIntentCount: number;
    receiptCount: number;
    pendingApprovalCount: number;
    latestAmountCents: number;
    latestCurrency: string;
    totalProcessedCents: number;
    totalProcessedCurrency: string;
    activeIntentCount: number;
    activeQueuedCents: number;
    latestReceiptIntentCount: number;
    latestReceiptPendingApprovalCount: number;
    latestReceiptQueuedCents: number;
  };
  bucketSummaries: BucketSummary[];
  latestReceiptBucketSummaries: BucketSummary[];
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [events, payoutIntents, receipts, allocationRules] = await Promise.all([
    listRecentRevenueEvents(),
    listRecentPayoutIntents(),
    listRecentReceipts(),
    listAllocationRules(),
  ]);
  const latestReceipt = receipts[0] ?? null;
  const latestEvent = events[0] ?? null;
  const allocationRule = latestReceipt?.allocationRule ?? allocationRules[0] ?? null;
  const latestReceiptIntents = latestReceipt?.payoutIntents ?? [];
  const activeIntents = payoutIntents.filter(isOpenIntent);
  const totalProcessedCents = events.reduce(
    (sum, event) => sum + event.amountCents,
    0
  );

  return {
    allocationRules,
    events,
    payoutIntents,
    receipts,
    latestEvent,
    latestReceipt,
    allocationRule,
    webhookReady: Boolean(process.env.DODO_PAYMENTS_WEBHOOK_SECRET),
    metrics: {
      eventCount: events.length,
      payoutIntentCount: payoutIntents.length,
      receiptCount: receipts.length,
      pendingApprovalCount: payoutIntents.filter(
        (intent) => intent.status === "pending_approval"
      ).length,
      latestAmountCents: latestEvent?.amountCents ?? 0,
      latestCurrency: latestEvent?.currency ?? "USD",
      totalProcessedCents,
      totalProcessedCurrency: latestEvent?.currency ?? "USD",
      activeIntentCount: activeIntents.length,
      activeQueuedCents: activeIntents.reduce(
        (sum, intent) => sum + intent.amountCents,
        0
      ),
      latestReceiptIntentCount: latestReceiptIntents.length,
      latestReceiptPendingApprovalCount: latestReceiptIntents.filter(
        (intent) => intent.status === "pending_approval"
      ).length,
      latestReceiptQueuedCents: latestReceiptIntents
        .filter(isOpenIntent)
        .reduce((sum, intent) => sum + intent.amountCents, 0),
    },
    bucketSummaries: summarizeBuckets(payoutIntents, allocationRule),
    latestReceiptBucketSummaries: summarizeBuckets(
      latestReceiptIntents,
      allocationRule
    ),
  };
}

export function formatMoney(cents: number, currency: string) {
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

export function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function shortId(value?: string, start = 6, end = 4) {
  if (!value) return "pending";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
