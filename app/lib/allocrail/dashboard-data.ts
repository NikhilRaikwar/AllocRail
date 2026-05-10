import {
  listAllocationRules,
  listRecentPayoutIntents,
  listRecentReceipts,
  listRecentRevenueEvents,
} from "@/app/lib/allocrail/event-store";
import { getSeededDashboardState } from "@/app/lib/allocrail/demo-data";
import type {
  AllocationBucketKind,
  AllocationRule,
  AllocRailReceipt,
  PayoutIntent,
  RevenueEvent,
  RevenueRouteKind,
} from "@/app/lib/allocrail/types";

function isActionableMoneyRoute(event: RevenueEvent) {
  const routeKind = getEventRouteKind(event);
  return routeKind === "revenue_route" || routeKind === "recurring_route";
}

function isMeaningfulReceipt(receipt: AllocRailReceipt) {
  return (
    isActionableMoneyRoute(receipt.revenueEvent) &&
    receipt.payoutIntents.some((intent) => intent.amountCents > 0)
  );
}

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
    revenueRouteCount: number;
    recurringRouteCount: number;
    budgetSignalCount: number;
    lifecycleSignalCount: number;
    processedTotalsByCurrency: Array<{
      currency: string;
      totalCents: number;
      eventCount: number;
    }>;
  };
  bucketSummaries: BucketSummary[];
  latestReceiptBucketSummaries: BucketSummary[];
  seededDemo: boolean;
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  let [events, payoutIntents, receipts, allocationRules] = await Promise.all([
    listRecentRevenueEvents(),
    listRecentPayoutIntents(),
    listRecentReceipts(),
    listAllocationRules(),
  ]);
  let seededDemo = false;

  if (events.length === 0 && payoutIntents.length === 0 && receipts.length === 0) {
    const seededState = getSeededDashboardState();
    events = seededState.events;
    payoutIntents = seededState.payoutIntents;
    receipts = seededState.receipts;
    allocationRules = seededState.allocationRules;
    seededDemo = true;
  }
  const latestReceipt = receipts.find(isMeaningfulReceipt) ?? receipts[0] ?? null;
  const latestEvent =
    events.find(
      (event) =>
        getEventRouteKind(event) === "revenue_route" ||
        getEventRouteKind(event) === "recurring_route"
    ) ??
    events[0] ??
    null;
  const latestMonetaryEvent =
    events.find((event) => isActionableMoneyRoute(event)) ?? null;
  const allocationRule = latestReceipt?.allocationRule ?? allocationRules[0] ?? null;
  const latestReceiptIntents = latestReceipt?.payoutIntents ?? [];
  const activeIntents = payoutIntents.filter(isOpenIntent);
  const routeKindCounts = events.reduce(
    (counts, event) => {
      counts[getEventRouteKind(event)] += 1;
      return counts;
    },
    {
      revenue_route: 0,
      recurring_route: 0,
      budget_signal: 0,
      lifecycle_signal: 0,
    } satisfies Record<RevenueRouteKind, number>
  );
  const totalProcessedCents = events
    .filter((event) => isActionableMoneyRoute(event))
    .reduce(
    (sum, event) => sum + event.amountCents,
    0
  );
  const processedTotalsByCurrency = Array.from(
    events
      .filter((event) => isActionableMoneyRoute(event))
      .reduce((acc, event) => {
        const current = acc.get(event.currency) ?? {
          currency: event.currency,
          totalCents: 0,
          eventCount: 0,
        };
        current.totalCents += event.amountCents;
        current.eventCount += 1;
        acc.set(event.currency, current);
        return acc;
      }, new Map<string, { currency: string; totalCents: number; eventCount: number }>())
      .values()
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
      latestAmountCents: latestMonetaryEvent?.amountCents ?? 0,
      latestCurrency: latestMonetaryEvent?.currency ?? "USD",
      totalProcessedCents,
      totalProcessedCurrency: latestMonetaryEvent?.currency ?? "USD",
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
      revenueRouteCount: routeKindCounts.revenue_route,
      recurringRouteCount: routeKindCounts.recurring_route,
      budgetSignalCount: routeKindCounts.budget_signal,
      lifecycleSignalCount: routeKindCounts.lifecycle_signal,
      processedTotalsByCurrency,
    },
    bucketSummaries: summarizeBuckets(payoutIntents, allocationRule),
    latestReceiptBucketSummaries: summarizeBuckets(
      latestReceiptIntents,
      allocationRule
    ),
    seededDemo,
  };
}

export function getEventRouteKind(event: RevenueEvent): RevenueRouteKind {
  if (event.eventContext?.routeKind) {
    return event.eventContext.routeKind;
  }

  if (event.type === "subscription.active" || event.type === "subscription.renewed") {
    return "recurring_route";
  }

  if (
    event.type === "credit.added" ||
    event.type === "credit.deducted" ||
    event.type === "credit.balance_low"
  ) {
    return "budget_signal";
  }

  if (event.type === "subscription.cancelled" || event.type === "subscription.updated") {
    return "lifecycle_signal";
  }

  return "revenue_route";
}

export function getEventRouteKindLabel(kind: RevenueRouteKind) {
  switch (kind) {
    case "revenue_route":
      return "revenue route";
    case "recurring_route":
      return "recurring route";
    case "budget_signal":
      return "budget signal";
    case "lifecycle_signal":
      return "lifecycle signal";
  }
}

export function getEventSummary(event: RevenueEvent) {
  if (event.eventContext?.summary) {
    return event.eventContext.summary;
  }

  switch (event.type) {
    case "payment.succeeded":
      return "One-time payment revenue entered the treasury pipeline.";
    case "subscription.active":
      return "Subscription revenue route created for a newly active customer.";
    case "subscription.renewed":
      return "Recurring subscription renewal routed into treasury buckets.";
    case "subscription.cancelled":
      return "Subscription stopped. No new payout route was generated.";
    case "subscription.updated":
      return "Subscription fields changed. Founder review only.";
    case "credit.added":
      return "Credits were added and routed into the AI budget bucket.";
    case "credit.deducted":
      return "Credits were consumed; this is a budget usage signal.";
    case "credit.balance_low":
      return "Credit balance is below threshold and needs review.";
    default:
      return event.type;
  }
}

export function getReceiptSettlementLabel(statuses: string[]) {
  if (statuses.length === 0) {
    return "no payout route";
  }

  if (statuses.every((status) => status === "confirmed")) {
    return "confirmed";
  }

  if (statuses.some((status) => status === "quarantined")) {
    return "quarantined";
  }

  if (statuses.some((status) => status === "rejected")) {
    return "approval blocked";
  }

  if (statuses.some((status) => status === "submitted")) {
    return "submitting";
  }

  if (statuses.some((status) => status === "failed")) {
    return "partial failure";
  }

  return "pending settlement";
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
