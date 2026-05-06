import {
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
  count: number;
  amountCents: number;
  pendingApproval: number;
};

export type DashboardSnapshot = {
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
  };
  bucketSummaries: BucketSummary[];
};

export function getDashboardSnapshot(): DashboardSnapshot {
  const events = listRecentRevenueEvents();
  const payoutIntents = listRecentPayoutIntents();
  const receipts = listRecentReceipts();
  const latestReceipt = receipts[0] ?? null;
  const latestEvent = events[0] ?? null;
  const allocationRule = latestReceipt?.allocationRule ?? null;

  return {
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
    },
    bucketSummaries: (allocationRule?.buckets ?? []).map((bucket) => {
      const matching = payoutIntents.filter(
        (intent) => intent.bucketKind === bucket.kind
      );

      return {
        kind: bucket.kind,
        label: bucket.label,
        count: matching.length,
        amountCents: matching.reduce((sum, intent) => sum + intent.amountCents, 0),
        pendingApproval: matching.filter(
          (intent) => intent.status === "pending_approval"
        ).length,
      };
    }),
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
